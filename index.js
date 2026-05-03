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


// 🌴 DATA MISS MÉTÉO
const weatherData = {
  jour: {
    soleil: {
      texts: ["Un soleil éclatant illumine la ville.", "La journée est lumineuse.", "Le ciel est dégagé."],
      tips: ["Parfait pour RP extérieur.", "Profitez de la ville.", "Ambiance dynamique."],
      img: "./images/soleil.jpg",
      color: "#FFD700"
    },
    pluie: {
      texts: ["Une pluie s’installe.", "Temps humide.", "Ambiance plus calme."],
      tips: ["Routes glissantes.", "RP plus posé.", "Atmosphère réaliste."],
      img: "./images/pluie.jpg",
      color: "#4A90E2"
    },
    brouillard: {
      texts: ["Un brouillard dense apparaît.", "Visibilité réduite.", "Ambiance mystérieuse."],
      tips: ["RP tension.", "Déplacements prudents.", "Parfait pour scènes discrètes."],
      img: "./images/brouillard.jpg",
      color: "#95A5A6"
    }
  },
  soir: {
    soleil: {
      texts: ["Nuit claire.", "Ciel dégagé.", "Ambiance calme."],
      tips: ["RP nocturne.", "Sorties idéales.", "Ambiance paisible."],
      img: "./images/nuit-soleil.jpg",
      color: "#2C3E50"
    },
    pluie: {
      texts: ["Pluie nocturne.", "Ambiance sombre.", "Ville humide."],
      tips: ["RP dramatique.", "Rues désertes.", "Immersion ++"],
      img: "./images/nuit-pluie.jpg",
      color: "#34495E"
    }
  }
};


// 🌴 SAISONS
function getSeason() {
  const month = new Date().getMonth() + 1;

  if ([12, 1, 2].includes(month)) return "hiver";
  if ([3, 4, 5].includes(month)) return "printemps";
  if ([6, 7, 8].includes(month)) return "ete";
  if ([9, 10, 11].includes(month)) return "automne";
}


// 📺 EMBED
function createEmbed(data) {
  const weatherFile = new AttachmentBuilder(data.img);
  const lunaFile = new AttachmentBuilder("./images/luna.png");

  const text = data.texts[Math.floor(Math.random() * data.texts.length)];
  const tip = data.tips[Math.floor(Math.random() * data.tips.length)];

  const embed = new EmbedBuilder()
    .setTitle("🌴📺 MISS MÉTÉO — SAN EUPHORIA")
    .setDescription(`👩 Ici **Luna Reyes**.\n\n${text}\n\n💡 Conseil RP : ${tip}`)
    .setColor(data.color)
    .setThumbnail("attachment://luna.png")
    .setImage(`attachment://${data.img.split('/').pop()}`)
    .setTimestamp();

  return { embed, files: [weatherFile, lunaFile] };
}


// 📦 COMMANDES
const commands = [
  new SlashCommandBuilder()
    .setName('forcemeteo')
    .setDescription('Forcer la météo')
    .addStringOption(opt =>
      opt.setName('moment')
        .setDescription('jour ou soir')
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


// 🚀 REGISTER
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
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
    const season = getSeason();

    let weighted = [];

    if (moment === "jour") {
      if (season === "ete") weighted = ["soleil", "soleil", "soleil", "pluie"];
      if (season === "automne") weighted = ["pluie", "pluie", "brouillard", "soleil"];
      if (season === "hiver") weighted = ["pluie", "pluie", "soleil"];
      if (season === "printemps") weighted = ["soleil", "pluie", "brouillard"];
    }

    if (moment === "soir") {
      if (season === "ete") weighted = ["soleil", "soleil", "pluie"];
      if (season === "automne") weighted = ["pluie", "pluie", "soleil"];
      if (season === "hiver") weighted = ["pluie", "pluie", "soleil"];
      if (season === "printemps") weighted = ["soleil", "pluie"];
    }

    const random = weighted[Math.floor(Math.random() * weighted.length)];
    const weather = weatherData[moment][random];

    const { embed, files } = createEmbed(weather);

    await channel.send({ embeds: [embed], files });

    const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
    setTimeout(sendWeather, delay);
  }

  sendWeather();
}


// ⚙️ ADMIN
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'forcemeteo') {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Admin seulement", ephemeral: true });
    }

    const moment = interaction.options.getString('moment');
    const type = interaction.options.getString('type');

    const { embed, files } = createEmbed(weatherData[moment][type]);

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send({ embeds: [embed], files });

    return interaction.reply({ content: "✅ Envoyé", ephemeral: true });
  }
});


// 🤖 READY
client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);
  startWeatherLoop();
});

client.login(TOKEN);