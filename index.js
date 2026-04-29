require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID; // ajoute ça dans ton .env

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🌦️ Météos disponibles
const weatherDay = {
  soleil: {
    title: "Journée Ensoleillée",
    text: "☀️ Un soleil éclatant illumine San Euphoria. Les rues sont animées et baignées de lumière.",
    img: "./images/soleil.jpg",
    color: "#FFD700"
  },
  pluie: {
    title: "Pluie de Jour",
    text: "🌧️ Une pluie douce tombe sur la ville, créant une ambiance calme et immersive.",
    img: "./images/pluie.jpg",
    color: "#4A90E2"
  },
  brouillard: {
    title: "Brouillard Dense",
    text: "🌫️ Un épais brouillard recouvre San Euphoria, réduisant la visibilité dans les rues.",
    img: "./images/brouillard.jpg",
    color: "#95A5A6"
  }
};

const weatherNight = {
  soleil: {
    title: "Soirée Claire",
    text: "🌙 La nuit tombe sur San Euphoria. Le ciel est dégagé et paisible.",
    img: "./images/nuit-soleil.jpg",
    color: "#2C3E50"
  },
  pluie: {
    title: "Pluie Nocturne",
    text: "🌧️ La pluie tombe sous les lumières de la ville, créant une ambiance nocturne unique.",
    img: "./images/nuit-pluie.jpg",
    color: "#34495E"
  }
};

// 📦 Commandes
const commands = [
  new SlashCommandBuilder()
    .setName('jour')
    .setDescription('Météo de jour')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('soleil / pluie / brouillard')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Pluie', value: 'pluie' },
          { name: 'Brouillard', value: 'brouillard' }
        )
    ),

  new SlashCommandBuilder()
    .setName('soir')
    .setDescription('Météo du soir')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('soleil / pluie')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Pluie', value: 'pluie' }
        )
    )
].map(cmd => cmd.toJSON());

// 🚀 Enregistrer commandes
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commandes enregistrées");
  } catch (error) {
    console.error(error);
  }
})();

// 🌴 Créer embed
function createWeatherEmbed(weather) {
  const file = new AttachmentBuilder(weather.img);

  const embed = new EmbedBuilder()
    .setTitle(`🌴 San Euphoria — ${weather.title}`)
    .setDescription(weather.text)
    .setColor(weather.color)
    .setImage(`attachment://${weather.img.split('/').pop()}`)
    .setFooter({ text: "Ville RP • San Euphoria" })
    .setTimestamp();

  return { embed, file };
}

// 🇫🇷 Heure France
function getFrenchHour() {
  return parseInt(
    new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "numeric",
      hour12: false
    })
  );
}

// 🤖 Ready + météo auto
client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);
  startAutoWeather();
});

// ⚡ Commandes manuelles
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const type = interaction.options.getString('type');

  if (interaction.commandName === 'jour') {
    const weather = weatherDay[type];
    const { embed, file } = createWeatherEmbed(weather);
    return interaction.reply({ embeds: [embed], files: [file] });
  }

  if (interaction.commandName === 'soir') {
    const weather = weatherNight[type];
    const { embed, file } = createWeatherEmbed(weather);
    return interaction.reply({ embeds: [embed], files: [file] });
  }
});

// 🔁 Météo automatique
async function startAutoWeather() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  async function sendWeather() {
    const hour = getFrenchHour();
    const isDay = hour >= 6 && hour < 21;

    const pool = isDay ? weatherDay : weatherNight;
    const keys = Object.keys(pool);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    const weather = pool[randomKey];
    const { embed, file } = createWeatherEmbed(weather);

    await channel.send({
      content: "📢 **Météo automatique de San Euphoria**",
      embeds: [embed],
      files: [file]
    });

    // 60 à 120 minutes
    const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
    setTimeout(sendWeather, delay);
  }

  sendWeather();
}

client.login(TOKEN);