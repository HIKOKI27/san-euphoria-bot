require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionsBitField
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🌴 MISS MÉTÉO TEXTES
const weatherData = {
  jour: {
    soleil: {
      title: "Journée Ensoleillée",
      text: "Bonjour San Euphoria.\n\nUn soleil éclatant illumine la ville aujourd’hui. L’ambiance est dynamique, les rues sont animées et parfaites pour vos activités.",
      img: "./images/soleil.jpg",
      color: "#FFD700"
    },
    pluie: {
      title: "Pluie de Jour",
      text: "Bonjour San Euphoria.\n\nUne pluie régulière s’installe sur la ville. Les routes deviennent humides et l’atmosphère plus calme.",
      img: "./images/pluie.jpg",
      color: "#4A90E2"
    },
    brouillard: {
      title: "Brouillard Dense",
      text: "Bonjour San Euphoria.\n\nUn brouillard épais recouvre la ville. La visibilité est réduite et l’ambiance devient mystérieuse.",
      img: "./images/brouillard.jpg",
      color: "#95A5A6"
    }
  },
  soir: {
    soleil: {
      title: "Soirée Claire",
      text: "Bonsoir San Euphoria.\n\nLe ciel est dégagé ce soir, offrant une ambiance calme et élégante sur toute la ville.",
      img: "./images/nuit-soleil.jpg",
      color: "#2C3E50"
    },
    pluie: {
      title: "Pluie Nocturne",
      text: "Bonsoir San Euphoria.\n\nLa pluie tombe sous les lumières de la ville, créant une ambiance nocturne immersive.",
      img: "./images/nuit-pluie.jpg",
      color: "#34495E"
    }
  }
};

// 📦 COMMANDES
const commands = [
  new SlashCommandBuilder()
    .setName('forcemeteo')
    .setDescription('Forcer la météo (admin)')
    .addStringOption(opt =>
      opt.setName('moment')
        .setDescription('jour / soir')
        .setRequired(true)
        .addChoices(
          { name: 'Jour', value: 'jour' },
          { name: 'Soir', value: 'soir' }
        )
    )
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('type météo')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Pluie', value: 'pluie' },
          { name: 'Brouillard', value: 'brouillard' }
        )
    )
].map(c => c.toJSON());

// 🚀 ENREGISTREMENT
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Commandes enregistrées");
})();

// 🎭 EMBED MISS MÉTÉO
function createEmbed(data) {
  const file = new AttachmentBuilder(data.img);

  const embed = new EmbedBuilder()
    .setTitle("🌴📺 MISS MÉTÉO — SAN EUPHORIA")
    .setDescription(data.text)
    .setColor(data.color)
    .setImage(`attachment://${data.img.split('/').pop()}`)
    .setFooter({ text: "San Euphoria Weather System" })
    .setTimestamp();

  return { embed, file };
}

// 🇫🇷 HEURE
function getFrenchHour() {
  return parseInt(new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    hour12: false
  }));
}

// 🔁 AUTO MÉTÉO
async function startWeatherLoop() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  async function sendWeather() {
    const hour = getFrenchHour();
    const moment = (hour >= 6 && hour < 21) ? "jour" : "soir";

    const pool = weatherData[moment];
    const keys = Object.keys(pool);
    const random = keys[Math.floor(Math.random() * keys.length)];

    const weather = pool[random];
    const { embed, file } = createEmbed(weather);

    await channel.send({ embeds: [embed], files: [file] });

    const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
    setTimeout(sendWeather, delay);
  }

  sendWeather();
}

// ⚡ COMMANDES ADMIN
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'forcemeteo') {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Réservé aux admins.", ephemeral: true });
    }

    const moment = interaction.options.getString('moment');
    const type = interaction.options.getString('type');

    if (!weatherData[moment][type]) {
      return interaction.reply("❌ Météo invalide.");
    }

    const { embed, file } = createEmbed(weatherData[moment][type]);

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send({ embeds: [embed], files: [file] });

    return interaction.reply({ content: "✅ Météo forcée envoyée.", ephemeral: true });
  }
});

// 🤖 READY
client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);
  startWeatherLoop();
});

client.login(TOKEN);