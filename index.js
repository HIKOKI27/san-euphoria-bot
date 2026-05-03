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

if (!TOKEN) {
  console.error("❌ TOKEN manquant");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


// 🌴 MISS MÉTÉO DATA
const weatherData = {
  jour: {
    soleil: {
      texts: [
        "Un soleil éclatant illumine la ville aujourd’hui.",
        "La journée s’annonce lumineuse sur San Euphoria.",
        "Le ciel est parfaitement dégagé."
      ],
      tips: [
        "Profitez-en pour organiser des scènes en extérieur.",
        "Conditions parfaites pour RP en ville.",
        "Idéal pour événements RP."
      ],
      img: "./images/soleil.jpg",
      color: "#FFD700"
    },
    pluie: {
      texts: [
        "Une pluie régulière s’installe sur la ville.",
        "Les nuages dominent San Euphoria.",
        "L’atmosphère devient plus lourde."
      ],
      tips: [
        "Adaptez vos scènes RP.",
        "Routes glissantes.",
        "Ambiance plus calme."
      ],
      img: "./images/pluie.jpg",
      color: "#4A90E2"
    },
    brouillard: {
      texts: [
        "Un brouillard dense recouvre la ville.",
        "La visibilité est réduite.",
        "Ambiance mystérieuse."
      ],
      tips: [
        "Parfait pour scènes discrètes.",
        "Visibilité réduite.",
        "RP tension conseillé."
      ],
      img: "./images/brouillard.jpg",
      color: "#95A5A6"
    }
  },
  soir: {
    soleil: {
      texts: [
        "La nuit est claire et paisible.",
        "Le ciel est dégagé ce soir.",
        "Ambiance nocturne calme."
      ],
      tips: [
        "Sorties RP nocturnes idéales.",
        "Parfait pour scènes calmes.",
        "Profitez de la nuit."
      ],
      img: "./images/nuit-soleil.jpg",
      color: "#2C3E50"
    },
    pluie: {
      texts: [
        "La pluie tombe sous les lumières.",
        "Une pluie nocturne s’installe.",
        "Ambiance sombre et immersive."
      ],
      tips: [
        "Scènes dramatiques idéales.",
        "Rues désertes.",
        "RP immersif."
      ],
      img: "./images/nuit-pluie.jpg",
      color: "#34495E"
    }
  }
};


// 📺 EMBED MISS MÉTÉO
function createEmbed(data) {
  const weatherFile = new AttachmentBuilder(data.img);
  const lunaFile = new AttachmentBuilder("./images/luna.png");

  const text = data.texts[Math.floor(Math.random() * data.texts.length)];
  const tip = data.tips[Math.floor(Math.random() * data.tips.length)];

  const embed = new EmbedBuilder()
    .setTitle("🌴📺 MISS MÉTÉO — SAN EUPHORIA")
    .setDescription(
      `👩 Ici **Luna Reyes**, en direct de San Euphoria.\n\n${text}\n\n💡 **Conseil RP :** ${tip}`
    )
    .setColor(data.color)
    .setThumbnail("attachment://luna.png")
    .setImage(`attachment://${data.img.split('/').pop()}`)
    .setFooter({ text: "San Euphoria Weather System" })
    .setTimestamp();

  return {
    embed,
    files: [weatherFile, lunaFile]
  };
}


// 📦 COMMANDES
const commands = [
  new SlashCommandBuilder()
    .setName('forcemeteo')
    .setDescription('Forcer la météo (admin)')
    .addStringOption(opt =>
      opt.setName('moment')
        .setRequired(true)
        .addChoices(
          { name: 'Jour', value: 'jour' },
          { name: 'Soir', value: 'soir' }
        )
    )
    .addStringOption(opt =>
      opt.setName('type')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Pluie', value: 'pluie' },
          { name: 'Brouillard', value: 'brouillard' }
        )
    )
].map(c => c.toJSON());


// 🚀 ENREGISTREMENT COMMANDES
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Commandes enregistrées");
})();


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
    const { embed, files } = createEmbed(weather);

    await channel.send({ embeds: [embed], files });

    const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
    setTimeout(sendWeather, delay);
  }

  sendWeather();
}


// ⚙️ COMMANDES ADMIN
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

    const { embed, files } = createEmbed(weatherData[moment][type]);

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send({ embeds: [embed], files });

    return interaction.reply({ content: "✅ Météo forcée envoyée.", ephemeral: true });
  }
});


// 🤖 READY
client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);
  startWeatherLoop();
});

client.login(TOKEN);