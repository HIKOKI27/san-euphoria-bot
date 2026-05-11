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

if (!TOKEN || !CLIENT_ID || !GUILD_ID || !CHANNEL_ID) {
  console.error('❌ Variables manquantes : TOKEN, CLIENT_ID, GUILD_ID ou CHANNEL_ID');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 🎭 AUTO RÔLES À L’ARRIVÉE
client.on('guildMemberAdd', async member => {
  try {
    const roles = [
      '1259638063324201141',
      '1259628698034770012',
      '1260616730766475294',
      '1259605120862392341',
      '1259627935804162090',
      '1259621183502942359',
      '1259627851766960212',
      '1291306988197777439',
      '1293174726365024287'
    ];

    for (const roleId of roles) {
      await member.roles.add(roleId);
    }

    console.log(`✅ Rôles ajoutés à ${member.user.tag}`);
  } catch (error) {
    console.error('❌ Erreur ajout rôles :', error);
  }
});

// 🌴 SAISONS
const SEASONS = {
  hiver: { label: '❄️ Hiver', sunrise: '08:00', sunset: '17:30' },
  printemps: { label: '🌸 Printemps', sunrise: '06:30', sunset: '20:00' },
  ete: { label: '☀️ Été', sunrise: '06:00', sunset: '21:00' },
  automne: { label: '🍂 Automne', sunrise: '07:00', sunset: '18:30' }
};

function getSeason() {
  const month = new Date().getMonth() + 1;

  if ([12, 1, 2].includes(month)) return 'hiver';
  if ([3, 4, 5].includes(month)) return 'printemps';
  if ([6, 7, 8].includes(month)) return 'ete';
  return 'automne';
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getFranceDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
}

function getFranceMinutes() {
  const d = getFranceDate();
  return d.getHours() * 60 + d.getMinutes();
}

function getPeriod() {
  const season = getSeason();
  const now = getFranceMinutes();

  const sunrise = timeToMinutes(SEASONS[season].sunrise);
  const sunset = timeToMinutes(SEASONS[season].sunset);

  if (now >= sunrise && now < sunrise + 30) return 'lever';
  if (now >= sunrise + 30 && now < 12 * 60) return 'matin';
  if (now >= 12 * 60 && now < sunset - 30) return 'jour';
  if (now >= sunset - 30 && now < sunset + 30) return 'coucher';

  return 'nuit';
}

function randomImage(period, weather) {
  const n = Math.floor(Math.random() * 3) + 1;
  return `./images/${period}/${weather}${n}.jpg`;
}

function randomTemp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTemperature(season, weather, period) {
  if (period === 'nuit') {
    if (season === 'ete') return randomTemp(18, 26);
    if (season === 'printemps') return randomTemp(12, 18);
    if (season === 'automne') return randomTemp(10, 17);
    return randomTemp(7, 14);
  }

  const ranges = {
    ete: {
      soleil: [26, 40],
      gris: [22, 30],
      pluie: [20, 26],
      brouillard: [19, 25],
      clair: [18, 26]
    },
    printemps: {
      soleil: [17, 24],
      gris: [14, 20],
      pluie: [12, 18],
      brouillard: [11, 17],
      clair: [12, 18]
    },
    automne: {
      soleil: [15, 23],
      gris: [12, 18],
      pluie: [10, 16],
      brouillard: [9, 15],
      clair: [10, 17]
    },
    hiver: {
      soleil: [10, 18],
      gris: [9, 15],
      pluie: [8, 14],
      brouillard: [7, 13],
      clair: [7, 14]
    }
  };

  const [min, max] = ranges[season][weather] || [15, 22];
  return randomTemp(min, max);
}

// 👕 CONSEILS VESTIMENTAIRES LONGS — 3 par saison + météo
const clothingAdvices = {
  ete: {
    soleil: [
      `Les températures peuvent devenir particulièrement élevées sous le soleil de San Euphoria.
Privilégie des vêtements légers, respirants et clairs pour mieux supporter la chaleur.
Pense aussi à boire régulièrement de l’eau si tu restes longtemps dehors.`,

      `La chaleur estivale peut vite devenir lourde dans les quartiers très urbanisés.
Une tenue légère est fortement recommandée, surtout aux heures les plus chaudes.
Évite les vêtements épais et garde de l’eau avec toi lors de tes déplacements.`,

      `Le soleil reste très présent aujourd’hui et la température peut grimper rapidement.
Des vêtements confortables, légers et adaptés à la chaleur seront les plus pratiques.
Si tu passes du temps dehors, cherche l’ombre dès que possible et hydrate-toi souvent.`
    ],
    gris: [
      `Même avec un ciel couvert, l’air reste chaud sur San Euphoria en été.
Une tenue légère reste adaptée, mais une veste fine peut être utile près de la côte.
L’air marin peut rendre certains quartiers un peu plus frais par moments.`,

      `Le ciel gris limite légèrement la chaleur directe, mais la température reste agréable.
Privilégie des vêtements confortables et respirants pour rester à l’aise toute la journée.
Une petite couche supplémentaire peut être utile en fin de journée ou près de l’océan.`,

      `La couverture nuageuse donne une impression plus douce, mais l’été reste bien présent.
Une tenue légère suffit généralement, surtout si tu circules dans les zones urbaines.
Garde tout de même une veste fine si tu prévois de rester dehors tard.`
    ],
    pluie: [
      `Les averses restent plutôt douces malgré la pluie estivale.
Un imperméable léger ou une veste fine suffira pour éviter l’humidité prolongée.
Attention aux routes et trottoirs qui peuvent devenir glissants rapidement.`,

      `La pluie rafraîchit légèrement l’atmosphère, mais les températures restent confortables.
Privilégie des vêtements simples avec une protection légère contre l’eau.
Des chaussures adaptées peuvent être utiles si tu dois te déplacer longtemps.`,

      `Même sous la pluie, San Euphoria garde une certaine douceur estivale.
Un vêtement imperméable léger permettra de rester à l’aise sans avoir trop chaud.
Les zones proches de la côte peuvent devenir plus humides et désagréables.`
    ],
    brouillard: [
      `Le brouillard côtier apporte une sensation plus fraîche et humide ce matin.
Une veste légère peut être utile, surtout dans les quartiers proches de l’océan.
La visibilité réduite peut aussi rendre les déplacements plus délicats.`,

      `La brume matinale donne une ambiance plus fraîche malgré la saison estivale.
Des vêtements légers restent adaptés, mais une couche supplémentaire peut être appréciable.
L’humidité ambiante peut rendre l’air plus lourd qu’à l’habitude.`,

      `Le brouillard réduit légèrement la température ressentie dans certains secteurs.
Une tenue confortable avec une veste légère reste idéale pour cette météo.
Les conditions devraient progressivement s’améliorer au fil de la journée.`
    ],
    clair: [
      `Même durant l’été, les nuits de San Euphoria peuvent devenir plus fraîches.
Une veste légère ou un vêtement plus couvrant peut être utile en extérieur.
Les zones proches de la côte ressentent souvent davantage l’air marin.`,

      `La température baisse progressivement avec l’arrivée de la nuit.
Une tenue légère reste suffisante, mais prévois un vêtement supplémentaire pour les longues sorties.
L’ambiance reste agréable dans l’ensemble de la ville.`,

      `La nuit apporte une fraîcheur plus marquée après la chaleur de la journée.
Les déplacements nocturnes seront plus confortables avec une veste fine ou un pull léger.
L’air marin peut accentuer cette sensation de fraîcheur.`
    ]
  },

  printemps: {
    soleil: [
      `Le climat printanier offre une température agréable sur San Euphoria.
Une tenue légère suffit largement pour profiter de la journée dans de bonnes conditions.
Une veste fine reste utile si tu restes dehors jusqu’en soirée.`,

      `Le soleil apporte une ambiance douce et confortable sur l’ensemble de la ville.
Des vêtements respirants et simples sont adaptés pour les déplacements en extérieur.
En début ou fin de journée, une couche légère peut tout de même être appréciable.`,

      `Les températures restent modérées malgré un ciel bien dégagé.
Une tenue printanière légère est idéale pour circuler en ville ou près de la côte.
L’air reste globalement agréable, mais peut être plus frais dans les zones exposées au vent.`
    ],
    gris: [
      `Le ciel couvert apporte une atmosphère plus fraîche à San Euphoria.
Une veste légère ou un pull confortable peut être utile durant les déplacements.
L’air marin accentue parfois cette sensation de fraîcheur.`,

      `Même si la météo reste calme, les températures sont plus douces sous les nuages.
Des vêtements mi-saison seront les plus adaptés pour rester à l’aise.
Les quartiers proches de la côte peuvent paraître plus humides.`,

      `Le temps gris donne une ambiance tempérée et un peu plus fraîche à la ville.
Une tenue confortable avec une couche légère supplémentaire est recommandée.
Les conditions restent cependant agréables pour la plupart des activités.`
    ],
    pluie: [
      `La pluie apporte une certaine fraîcheur sur San Euphoria aujourd’hui.
Un manteau léger imperméable permettra de rester à l’aise malgré l’humidité.
Attention aussi aux sols glissants dans certaines zones.`,

      `Les averses rendent l’air plus frais et humide dans plusieurs quartiers.
Des vêtements adaptés à la pluie ainsi qu’une veste légère sont conseillés.
La circulation peut également devenir plus compliquée par endroits.`,

      `Le temps pluvieux crée une ambiance plus fraîche que la normale ce printemps.
Une tenue couvrante et confortable permettra de mieux supporter l’humidité.
Prends également de quoi te protéger de la pluie lors des déplacements.`
    ],
    brouillard: [
      `Le brouillard matinal apporte une fraîcheur humide sur San Euphoria.
Une veste légère reste recommandée durant les premières heures de la journée.
La visibilité peut également être réduite dans certaines zones.`,

      `La brume côtière crée une ambiance plus fraîche et calme ce matin.
Des vêtements confortables et légèrement couvrants permettront de rester à l’aise.
Les températures devraient remonter progressivement plus tard.`,

      `Le brouillard printanier réduit légèrement la température ressentie en ville.
Une couche légère supplémentaire peut être appréciable lors des déplacements matinaux.
Les conditions resteront relativement humides jusqu’à dissipation de la brume.`
    ],
    clair: [
      `La nuit printanière reste relativement fraîche sur San Euphoria.
Une veste légère ou un pull confortable peut être utile lors des sorties nocturnes.
L’air marin accentue parfois cette sensation de fraîcheur.`,

      `Les températures baissent progressivement avec l’arrivée de la nuit.
Une tenue légèrement plus couvrante est recommandée pour rester confortable.
L’ambiance générale reste cependant agréable dans la ville.`,

      `Le ciel dégagé permet à la fraîcheur nocturne de s’installer progressivement.
Prévois un vêtement plus chaud si tu comptes rester longtemps dehors.
Les quartiers proches de la mer ressentent davantage cette baisse de température.`
    ]
  },

  automne: {
    soleil: [
      `Le soleil reste agréable, mais les températures d’automne sont plus modérées.
Une tenue confortable avec une veste légère sera idéale pour la journée.
En fin d’après-midi, l’air peut rapidement devenir plus frais.`,

      `Même avec du soleil, San Euphoria garde une ambiance plus douce en automne.
Privilégie des vêtements mi-saison pour rester à l’aise tout au long de la journée.
Une couche supplémentaire peut être utile si tu restes dehors longtemps.`,

      `Le temps lumineux rend la ville agréable, mais la fraîcheur automnale reste présente.
Une veste fine ou un pull léger peut compléter une tenue simple.
Les zones côtières peuvent être plus fraîches à cause du vent marin.`
    ],
    gris: [
      `Le ciel gris renforce la sensation de fraîcheur sur San Euphoria.
Une veste ou un pull confortable est recommandé pour les déplacements.
L’humidité côtière peut rendre l’air plus frais qu’il n’y paraît.`,

      `Avec ce temps couvert, une tenue mi-saison est clairement préférable.
Prévois une couche supplémentaire si tu circules dans les quartiers exposés au vent.
L’ambiance reste douce, mais moins chaude qu’en pleine journée ensoleillée.`,

      `La couverture nuageuse donne une atmosphère plus fraîche et plus sérieuse à la ville.
Des vêtements confortables et légèrement chauds seront les plus adaptés.
Une veste fine peut suffire si tu ne restes pas longtemps dehors.`
    ],
    pluie: [
      `La pluie automnale apporte une humidité plus marquée dans les rues de San Euphoria.
Un imperméable ou une veste couvrante est fortement conseillé.
Des chaussures adaptées éviteront l’inconfort sur les sols humides.`,

      `Les averses rendent la ville plus fraîche et les routes plus glissantes.
Privilégie une tenue protégée de l’eau, surtout si tu dois beaucoup te déplacer.
Un parapluie peut être utile dans les zones très exposées.`,

      `L’automne pluvieux donne une sensation plus froide qu’une simple baisse de température.
Une veste imperméable et des vêtements confortables seront les meilleurs choix.
Évite les tenues trop légères si tu dois rester dehors longtemps.`
    ],
    brouillard: [
      `Le brouillard automnal peut rendre l’air particulièrement frais et humide.
Une veste chaude ou un pull épais léger peut être utile en matinée.
La visibilité réduite impose aussi de rester attentif lors des déplacements.`,

      `La brume donne à San Euphoria une atmosphère plus froide et silencieuse.
Des vêtements couvrants seront plus confortables, surtout près de la côte.
L’humidité peut s’accrocher aux vêtements si tu restes longtemps dehors.`,

      `Ce brouillard matinal renforce la fraîcheur typique de l’automne.
Une tenue plus chaude qu’à l’habitude est recommandée pour rester à l’aise.
Les conditions devraient s’améliorer progressivement si le temps se dégage.`
    ],
    clair: [
      `La nuit d’automne devient rapidement fraîche sur San Euphoria.
Une veste plus chaude ou un pull confortable est recommandé pour les sorties.
L’air marin peut accentuer la sensation de froid dans certains quartiers.`,

      `Même si le ciel est clair, les températures nocturnes baissent nettement.
Prévois une tenue couvrante si tu comptes rester dehors longtemps.
Les zones proches de l’océan peuvent être plus fraîches que le centre-ville.`,

      `L’ambiance nocturne reste agréable mais demande une tenue plus chaude.
Une veste ou un pull épais léger permettra de mieux supporter la fraîcheur.
La ville peut sembler plus humide après la tombée de la nuit.`
    ]
  },

  hiver: {
    soleil: [
      `Le soleil apporte une ambiance agréable, mais les températures restent hivernales.
Une veste légère à moyenne est recommandée pour rester confortable dehors.
Les zones ombragées et proches de la côte peuvent rester fraîches.`,

      `Même avec un ciel dégagé, l’air reste plus frais en hiver sur San Euphoria.
Une tenue couvrante est préférable, surtout en matinée ou en fin de journée.
Le soleil rend l’ambiance plus douce sans supprimer totalement la fraîcheur.`,

      `Le temps ensoleillé donne une impression agréable, mais la saison reste fraîche.
Prévois une veste ou un pull selon la durée de tes déplacements.
La température peut baisser rapidement lorsque le soleil commence à descendre.`
    ],
    gris: [
      `Le ciel gris accentue la fraîcheur hivernale dans la ville.
Une veste chaude ou un pull épais est conseillé pour les déplacements.
L’humidité côtière peut rendre l’air plus froid qu’indiqué par la température.`,

      `Avec ce temps couvert, San Euphoria prend une ambiance plus froide et calme.
Privilégie des vêtements chauds et confortables pour rester à l’aise.
Une couche supplémentaire peut être utile si tu restes longtemps dehors.`,

      `La couverture nuageuse limite la chaleur du soleil et garde l’air frais.
Une tenue hivernale légère mais couvrante sera le choix le plus adapté.
Les zones proches de l’océan peuvent être plus humides et fraîches.`
    ],
    pluie: [
      `La pluie hivernale rend les rues plus froides et plus humides.
Un manteau imperméable ou une veste chaude résistante à l’eau est recommandé.
Des chaussures adaptées seront utiles pour éviter l’inconfort sur les sols mouillés.`,

      `Les averses accentuent la sensation de froid sur San Euphoria.
Prévois une tenue chaude, couvrante et protégée de l’humidité.
La circulation peut aussi devenir plus délicate sur les routes glissantes.`,

      `Le temps pluvieux donne une ambiance hivernale plus lourde à la ville.
Une veste chaude et imperméable permettra de mieux supporter les conditions.
Évite les vêtements trop légers si tu dois rester dehors longtemps.`
    ],
    brouillard: [
      `Le brouillard hivernal apporte une sensation froide et humide en matinée.
Une veste chaude ou un manteau léger est conseillé pour rester confortable.
La visibilité réduite impose aussi plus de prudence lors des déplacements.`,

      `La brume froide donne à San Euphoria une atmosphère plus silencieuse et pesante.
Privilégie des vêtements couvrants pour mieux supporter l’humidité.
Les zones proches de la côte peuvent être particulièrement fraîches.`,

      `Ce brouillard renforce nettement la fraîcheur ressentie dans la ville.
Une tenue chaude et une couche supplémentaire seront appréciables en extérieur.
Les conditions peuvent rester humides jusqu’à la fin de matinée.`
    ],
    clair: [
      `Les nuits d’hiver sont fraîches sur San Euphoria, même sous un ciel dégagé.
Une veste chaude ou un pull épais est recommandé pour les sorties prolongées.
L’air marin peut rendre certains quartiers encore plus froids.`,

      `Le ciel clair favorise une baisse nette des températures pendant la nuit.
Prévois une tenue chaude si tu comptes circuler dehors longtemps.
Les zones ouvertes et côtières ressentent davantage la fraîcheur nocturne.`,

      `La nuit hivernale demande une tenue plus couvrante que le reste de la journée.
Un manteau léger ou une veste chaude sera beaucoup plus confortable.
L’ambiance reste calme, mais l’air peut être particulièrement frais.`
    ]
  }
};

function getClothingAdvice(season, weather, period, temp) {
  const seasonData = clothingAdvices[season] || clothingAdvices.printemps;
  const weatherData = seasonData[weather] || seasonData.soleil;

  let advice = weatherData[Math.floor(Math.random() * weatherData.length)];

  if (temp >= 35) {
    advice += `

🔥 Une forte chaleur est actuellement présente sur San Euphoria.
Évite les efforts physiques prolongés et pense à boire régulièrement de l’eau tout au long de la journée.`;
  }

  return advice;
}

// 💡 CONSEILS RP LONGS
const rpTips = {
  lever: [
    `La ville sort lentement du silence de la nuit pendant que les premières lumières apparaissent sur la côte.
Les rues sont encore calmes, les commerces commencent à ouvrir et les habitants les plus matinaux reprennent leur routine.
C’est un moment idéal pour lancer des scènes posées, discrètes ou liées au début d’une nouvelle journée.`,

    `Les premiers rayons traversent San Euphoria et donnent à la ville une ambiance douce, presque fragile.
Les quartiers résidentiels s’éveillent progressivement tandis que le centre reste encore relativement calme.
Cette période se prête parfaitement aux scènes d’introduction, aux départs au travail ou aux rencontres inattendues.`,

    `Le lever du soleil installe une atmosphère plus légère sur San Euphoria.
Les plages commencent à accueillir les premiers promeneurs pendant que les grandes avenues restent encore peu fréquentées.
C’est une bonne occasion de créer des scènes calmes avant que la ville ne devienne plus active.`,

    `San Euphoria s’éveille peu à peu sous une lumière encore douce.
Les cafés, commerces et services commencent à reprendre vie tandis que les rues gardent une certaine tranquillité.
Ce moment est parfait pour des scènes quotidiennes, professionnelles ou familiales.`,

    `La ville retrouve doucement son rythme après la nuit.
Les premiers véhicules apparaissent sur les grands axes, mais l’ambiance reste encore loin de l’agitation de la journée.
C’est une période idéale pour des interactions simples, réalistes et naturelles.`,

    `Le soleil commence à se lever sur les hauteurs et les façades de San Euphoria.
La lumière du matin donne une atmosphère agréable aux quartiers proches de la mer.
Les scènes peuvent facilement tourner autour d’un réveil, d’un trajet matinal ou d’une ouverture de commerce.`,

    `Les habitants les plus matinaux commencent déjà à occuper les rues.
La ville garde une ambiance paisible, mais les premiers signes d’activité se font sentir.
C’est un bon moment pour jouer des scènes discrètes, des retrouvailles ou des départs importants.`,

    `San Euphoria prend lentement vie avec le lever du soleil.
Le port, les routes et les zones commerciales commencent à s’activer sans encore être saturés.
Une excellente période pour poser une ambiance de transition entre la nuit et la journée.`,

    `La lumière matinale révèle progressivement les bâtiments, les plages et les grandes avenues.
L’ambiance est encore douce, ce qui donne aux scènes un côté plus intime et réaliste.
Idéal pour commencer une intrigue ou préparer un événement à venir.`,

    `Le lever du soleil marque le début d’une nouvelle journée à San Euphoria.
La ville semble encore hésiter entre calme nocturne et activité urbaine.
C’est un moment parfait pour des scènes d’observation, de préparation ou de déplacement tranquille.`,

    `Les premières heures du jour donnent une atmosphère particulière à San Euphoria.
Les rues sont moins bruyantes, les lumières artificielles s’éteignent peu à peu et la ville reprend son souffle.
Profitez de cette période pour des scènes plus lentes et immersives.`,

    `Le jour se lève sur San Euphoria avec une ambiance douce et progressive.
Les quartiers commencent à se remplir, mais la ville reste encore assez calme pour laisser place à des moments plus personnels.
C’est une période parfaite pour installer une ambiance avant l’agitation de la journée.`
  ],

  matin: [
    `La matinée installe un rythme plus clair dans les rues de San Euphoria.
Les commerces ouvrent, les premiers rendez-vous commencent et la circulation augmente progressivement.
C’est une période idéale pour jouer des scènes de travail, de trajet ou de rencontre en ville.`,

    `La ville est maintenant réveillée, mais garde encore une énergie relativement calme.
Les quartiers proches de la côte profitent souvent d’une ambiance fraîche et légèrement humide.
Ce moment convient très bien aux scènes réalistes du quotidien ou aux débuts d’intrigue.`,

    `Les rues de San Euphoria se remplissent doucement à mesure que la matinée avance.
Les habitants sortent, les entreprises reprennent leur activité et les services publics s’organisent.
C’est une bonne période pour des scènes administratives, professionnelles ou sociales.`,

    `Le matin donne à San Euphoria une atmosphère équilibrée entre calme et activité.
Les grandes avenues commencent à être fréquentées sans atteindre la densité de la journée.
Idéal pour des interactions naturelles, des déplacements ou des rendez-vous discrets.`,

    `La ville prend progressivement son rythme de croisière.
Les cafés, restaurants et commerces commencent à accueillir plus de monde, tandis que les quartiers résidentiels se vident peu à peu.
C’est un bon moment pour lancer des scènes liées à la vie quotidienne.`,

    `La matinée apporte une ambiance réaliste et active à San Euphoria.
Les véhicules circulent davantage, les piétons apparaissent dans les zones commerciales et les plages commencent à vivre.
Ce moment peut servir de transition parfaite vers des scènes plus dynamiques.`,

    `Les activités de la ville s’organisent autour des premières heures pleinement actives.
La météo du matin peut influencer la circulation, l’ambiance des quartiers et les déplacements des habitants.
C’est une excellente période pour créer du mouvement sans rendre la ville trop chaotique.`,

    `San Euphoria conserve encore une certaine fraîcheur en matinée.
Les scènes peuvent facilement s’ancrer dans un contexte réaliste : travail, préparation, rendez-vous ou déplacement.
Cette période donne un ton crédible et naturel à vos interactions.`,

    `La matinée est souvent le moment où les détails de la ville deviennent les plus visibles.
Les rues s’animent, les services se mettent en place et les habitants commencent à occuper les lieux publics.
Idéal pour des scènes posées mais vivantes.`,

    `L’ambiance matinale permet d’installer des scènes calmes tout en gardant une ville active.
Les personnages peuvent se croiser au travail, dans les rues, près du port ou autour des commerces.
C’est un moment parfait pour faire avancer une intrigue sans pression excessive.`,

    `San Euphoria respire pleinement en matinée.
Les quartiers sont accessibles, les lieux publics commencent à se remplir et la ville semble prête à basculer vers une journée plus dense.
Une bonne période pour préparer des événements ou introduire de nouveaux personnages.`,

    `Le matin offre un équilibre intéressant entre tranquillité et mouvement.
La ville n’est plus endormie, mais elle n’a pas encore atteint son pic d’activité.
C’est une fenêtre idéale pour des scènes fluides, réalistes et immersives.`
  ],

  jour: [
    `La journée bat son plein dans San Euphoria et l’activité se fait sentir dans tous les quartiers.
Les plages, les commerces et les grands axes attirent davantage de monde, rendant la ville plus vivante.
C’est une période idéale pour des scènes dynamiques, sociales ou liées aux événements publics.`,

    `San Euphoria est pleinement active à cette heure de la journée.
La circulation peut devenir plus dense, les lieux publics se remplissent et les interactions sont naturellement plus fréquentes.
Profitez de cette ambiance pour créer des scènes animées et visibles.`,

    `La ville montre son visage le plus vivant pendant la journée.
Les entreprises fonctionnent, les habitants circulent et les quartiers centraux deviennent plus bruyants.
C’est le moment parfait pour les scènes de travail, de commerce ou de confrontation publique.`,

    `L’ambiance de journée donne beaucoup d’énergie aux scènes RP.
Les personnages peuvent facilement se croiser dans les rues, les restaurants, les plages ou les zones commerciales.
Cette période favorise les interactions spontanées et les situations imprévues.`,

    `San Euphoria est en pleine activité, avec une atmosphère plus rapide et plus ouverte.
Les scènes en extérieur prennent plus d’importance, surtout autour des lieux fréquentés.
C’est une bonne occasion de jouer des rencontres, des déplacements ou des événements visibles.`,

    `La journée rend la ville plus dense et plus exposée.
Les actions entreprises à cette heure peuvent facilement attirer l’attention des passants, des autorités ou des autres personnages.
Idéal pour des scènes publiques, officielles ou commerciales.`,

    `Les rues principales de San Euphoria sont plus animées en journée.
Les plages et terrasses peuvent devenir des points de rencontre naturels selon la météo.
Cette période convient très bien aux scènes sociales, aux discussions importantes ou aux activités urbaines.`,

    `La lumière de la journée met en valeur chaque quartier de San Euphoria.
Les scènes peuvent être plus visibles, plus directes et plus dynamiques qu’en soirée ou la nuit.
C’est un moment parfait pour donner du rythme au serveur.`,

    `La ville fonctionne à plein régime et chaque quartier peut devenir un lieu d’interaction.
Les déplacements sont plus nombreux, les commerces actifs et les lieux publics plus fréquentés.
Cette période est idéale pour faire avancer plusieurs intrigues en parallèle.`,

    `La journée permet de jouer une San Euphoria ouverte, vivante et en mouvement.
Les personnages ont plus de raisons de sortir, travailler, négocier ou se retrouver.
C’est un excellent créneau pour les scènes collectives.`,

    `L’activité de la ville crée une ambiance réaliste et parfois imprévisible.
Les conditions météo peuvent influencer les déplacements, la fréquentation des lieux et le ton général des scènes.
Utilisez ce contexte pour rendre vos actions plus crédibles.`,

    `San Euphoria est pleinement éveillée, avec tout ce que cela implique : bruit, mouvement, rencontres et opportunités.
Les scènes peuvent naturellement devenir plus rapides, plus sociales ou plus tendues.
C’est la période idéale pour donner de l’ampleur à vos actions.`
  ],

  coucher: [
    `Le coucher du soleil donne à San Euphoria une ambiance plus chaude et plus cinématographique.
Les lumières de la ville commencent à prendre le relais pendant que les rues changent progressivement de rythme.
C’est un moment parfait pour des scènes marquantes, élégantes ou plus émotionnelles.`,

    `La journée touche à sa fin et la ville entre doucement dans une atmosphère de transition.
Les commerces ralentissent, les terrasses se remplissent et les quartiers nocturnes commencent à s’animer.
C’est une période idéale pour préparer des scènes de soirée.`,

    `Le coucher du soleil transforme l’ambiance de San Euphoria.
La lumière devient plus douce, les rues changent de couleur et la ville semble plus calme malgré l’activité restante.
Parfait pour des rencontres importantes ou des scènes plus posées.`,

    `San Euphoria passe lentement de l’agitation de la journée à l’ambiance de la nuit.
Les personnages peuvent profiter de cette transition pour se retrouver, discuter ou préparer la suite.
C’est un moment très fort pour les scènes visuelles et émotionnelles.`,

    `Les dernières lumières du jour donnent une atmosphère particulière à la ville.
Les plages, les routes côtières et les quartiers lumineux deviennent des décors parfaits pour le RP.
Cette période favorise les scènes calmes, tendues ou romantiques.`,

    `Le coucher du soleil marque un changement de rythme dans San Euphoria.
Les habitants rentrent, sortent ou se dirigent vers les zones plus animées de la ville.
C’est une bonne période pour croiser différents personnages dans une ambiance naturelle.`,

    `La ville commence à ralentir sans devenir silencieuse.
Les éclairages publics s’allument progressivement et les lieux de sortie prennent de l’importance.
Idéal pour lancer des scènes de soirée ou des intrigues plus discrètes.`,

    `Le ciel se colore au-dessus de San Euphoria et donne une atmosphère très immersive.
Les scènes à cette heure peuvent facilement prendre un ton plus important ou plus symbolique.
C’est un bon moment pour les décisions, les retrouvailles ou les tensions.`,

    `Le coucher du soleil donne à la ville une ambiance entre calme et attente.
Certaines rues se vident tandis que d’autres commencent à s’animer.
Cette transition crée un excellent contexte pour des scènes variées et crédibles.`,

    `San Euphoria change de visage à mesure que le soleil descend.
Les quartiers centraux, le port et les lieux de sortie deviennent plus attractifs.
C’est une période idéale pour passer d’un RP quotidien à une ambiance plus nocturne.`,

    `Les lumières de la ville commencent à se refléter sur les routes et les façades.
La météo peut rendre cette période encore plus immersive, surtout avec un ciel couvert ou pluvieux.
Utilisez cette ambiance pour renforcer le ton de vos scènes.`,

    `Le coucher de soleil installe une atmosphère plus douce mais aussi plus mystérieuse.
La ville semble se préparer à une nouvelle phase de la journée, plus calme ou plus intense selon les quartiers.
C’est un excellent moment pour lancer une soirée RP.`
  ],

  nuit: [
    `La nuit enveloppe San Euphoria et transforme complètement l’ambiance de la ville.
Les rues se vident dans certains quartiers tandis que d’autres deviennent plus vivants et lumineux.
C’est une période idéale pour des scènes discrètes, tendues ou plus intimes.`,

    `San Euphoria prend une atmosphère plus calme une fois la nuit installée.
Les lumières urbaines remplacent le soleil et les déplacements deviennent plus rares.
Cette période convient très bien aux scènes confidentielles ou aux rencontres nocturnes.`,

    `La ville semble plus mystérieuse durant la nuit.
Les quartiers proches du centre restent actifs, tandis que les zones résidentielles deviennent plus silencieuses.
C’est un bon moment pour développer des intrigues plus privées ou imprévues.`,

    `La nuit apporte une ambiance plus lourde et plus cinématographique à San Euphoria.
Les sons de la ville changent, les rues se font plus calmes et les lumières deviennent plus présentes.
Idéal pour des scènes dramatiques, calmes ou secrètes.`,

    `San Euphoria ne dort jamais complètement.
Même si certains quartiers ralentissent, d’autres continuent de vivre sous les néons et les éclairages urbains.
Cette période ouvre la porte à des scènes plus nocturnes, sociales ou risquées.`,

    `L’ambiance nocturne permet de jouer une ville différente, plus silencieuse mais pas forcément vide.
Les interactions prennent souvent un ton plus sérieux ou plus personnel.
C’est une période parfaite pour des discussions importantes ou des événements discrets.`,

    `Les rues de San Euphoria deviennent plus espacées et plus calmes à cette heure.
Les déplacements peuvent sembler plus isolés, surtout selon la météo du moment.
C’est un excellent contexte pour des scènes d’observation, de tension ou de transition.`,

    `La nuit donne une autre dimension aux lieux familiers de San Euphoria.
Un simple trajet, une rencontre ou une attente peuvent devenir beaucoup plus immersifs.
Profitez de cette ambiance pour créer des scènes plus profondes.`,

    `Les lumières des bâtiments, des routes et des quartiers animés dominent désormais la ville.
L’atmosphère nocturne peut rendre les scènes plus élégantes, plus sombres ou plus imprévisibles.
C’est une excellente période pour varier le ton du RP.`,

    `San Euphoria ralentit, mais certaines zones gagnent en intensité.
Les lieux de sortie, les quartiers d’affaires et les endroits isolés peuvent devenir des décors très différents.
La nuit permet de créer une vraie diversité d’ambiance.`,

    `La fraîcheur nocturne s’installe progressivement sur la ville.
Les personnages peuvent adapter leurs déplacements, leurs tenues et leurs interactions à cette ambiance plus calme.
C’est un moment idéal pour des scènes posées ou introspectives.`,

    `La nuit recouvre San Euphoria d’une atmosphère plus silencieuse et plus urbaine.
Les actions peuvent paraître plus importantes, car la ville semble moins distraite par l’agitation du jour.
C’est une période parfaite pour les scènes à fort impact narratif.`
  ]
};

function getRandomRpTip(period) {
  const list = rpTips[period] || rpTips.jour;
  return list[Math.floor(Math.random() * list.length)];
}

function getWeightedWeather(period, season) {
  if (period === 'lever') return ['soleil', 'soleil', 'gris', 'pluie'];

  if (period === 'matin') {
    if (season === 'ete') return ['soleil', 'soleil', 'soleil', 'gris', 'pluie'];
    if (season === 'automne') return ['gris', 'pluie', 'brouillard', 'brouillard', 'soleil'];
    if (season === 'hiver') return ['gris', 'pluie', 'brouillard', 'soleil'];
    return ['soleil', 'gris', 'pluie', 'brouillard'];
  }

  if (period === 'jour') {
    if (season === 'ete') return ['soleil', 'soleil', 'soleil', 'gris', 'pluie'];
    if (season === 'automne') return ['gris', 'pluie', 'pluie', 'soleil'];
    if (season === 'hiver') return ['gris', 'pluie', 'soleil'];
    return ['soleil', 'gris', 'pluie'];
  }

  if (period === 'coucher') return ['soleil', 'soleil', 'gris', 'pluie'];

  return ['clair', 'clair', 'gris', 'pluie'];
}

function createWeatherEmbed(period, weatherKey, specialTitle = null) {
  const season = getSeason();
  const seasonLabel = SEASONS[season].label;
  const data = weatherTexts[weatherKey];

  const temp = getTemperature(season, weatherKey, period);
  const clothingAdvice = getClothingAdvice(season, weatherKey, period, temp);

  const imgPath = randomImage(period, weatherKey);
  const weatherFile = new AttachmentBuilder(imgPath);
  const lunaFile = new AttachmentBuilder('./images/luna.png');

  const text = data.texts[Math.floor(Math.random() * data.texts.length)];
  const rpTip = getRandomRpTip(period);

  const periodLabels = {
    lever: '🌅 Lever du soleil',
    matin: '🌄 Matin',
    jour: '☀️ Journée',
    coucher: '🌇 Coucher du soleil',
    nuit: '🌙 Nuit'
  };

  const heatAlert = temp >= 35
    ? '\n\n🔥 **Alerte chaleur :** forte chaleur sur San Euphoria, pensez à boire de l’eau régulièrement.'
    : '';

  const embed = new EmbedBuilder()
    .setTitle(specialTitle || '🌴📺 MISS MÉTÉO — SAN EUPHORIA')
    .setDescription(
      `👩 Ici **Luna Reyes**, en direct de San Euphoria.\n\n` +
      `📅 **Saison :** ${seasonLabel}\n` +
      `🕒 **Période :** ${periodLabels[period]}\n` +
      `🌡️ **Température :** ${temp}°C\n` +
      `🌦️ **Météo :** ${data.label}\n\n` +
      `${text}\n\n` +
      `👕 **Conseil :**\n\n${clothingAdvice}${heatAlert}\n\n` +
      `💡 **Conseil RP :**\n\n${rpTip}`
    )
    .setColor(data.color)
    .setThumbnail('attachment://luna.png')
    .setImage(`attachment://${imgPath.split('/').pop()}`)
    .setFooter({ text: 'San Euphoria Weather System' })
    .setTimestamp();

  return { embed, files: [weatherFile, lunaFile] };
}

const commands = [
  new SlashCommandBuilder()
    .setName('forcemeteo')
    .setDescription('Forcer une météo RP')
    .addStringOption(opt =>
      opt.setName('periode')
        .setDescription('Choisir la période')
        .setRequired(true)
        .addChoices(
          { name: 'Lever', value: 'lever' },
          { name: 'Matin', value: 'matin' },
          { name: 'Journée', value: 'jour' },
          { name: 'Coucher', value: 'coucher' },
          { name: 'Nuit', value: 'nuit' }
        )
    )
    .addStringOption(opt =>
      opt.setName('meteo')
        .setDescription('Choisir la météo')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Gris', value: 'gris' },
          { name: 'Pluie', value: 'pluie' },
          { name: 'Brouillard', value: 'brouillard' },
          { name: 'Clair nuit', value: 'clair' }
        )
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('✅ Commandes enregistrées');
})();

async function sendAutoWeather() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  const period = getPeriod();
  const season = getSeason();
  const pool = getWeightedWeather(period, season);
  const weatherKey = pool[Math.floor(Math.random() * pool.length)];

  const { embed, files } = createWeatherEmbed(period, weatherKey);

  await channel.send({ embeds: [embed], files });

  const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
  setTimeout(sendAutoWeather, delay);
}

let lastSunriseAnnouncement = null;
let lastSunsetAnnouncement = null;

async function checkSunAnnouncements() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  const nowDate = getFranceDate();
  const today = nowDate.toISOString().split('T')[0];

  const season = getSeason();
  const now = getFranceMinutes();

  const sunrise = timeToMinutes(SEASONS[season].sunrise);
  const sunset = timeToMinutes(SEASONS[season].sunset);

  if (now === sunrise && lastSunriseAnnouncement !== today) {
    lastSunriseAnnouncement = today;

    const { embed, files } = createWeatherEmbed(
      'lever',
      'soleil',
      '🌅 LEVER DU SOLEIL — SAN EUPHORIA'
    );

    await channel.send({ embeds: [embed], files });
  }

  if (now === sunset && lastSunsetAnnouncement !== today) {
    lastSunsetAnnouncement = today;

    const { embed, files } = createWeatherEmbed(
      'coucher',
      'soleil',
      '🌇 COUCHER DU SOLEIL — SAN EUPHORIA'
    );

    await channel.send({ embeds: [embed], files });
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'forcemeteo') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Commande réservée aux admins.',
        ephemeral: true
      });
    }

    const period = interaction.options.getString('periode');
    const weatherKey = interaction.options.getString('meteo');

    const allowed = getWeightedWeather(period, getSeason());

    if (!allowed.includes(weatherKey)) {
      return interaction.reply({
        content: '❌ Cette météo n’est pas disponible pour cette période.',
        ephemeral: true
      });
    }

    const { embed, files } = createWeatherEmbed(period, weatherKey);
    const channel = await client.channels.fetch(CHANNEL_ID);

    await channel.send({ embeds: [embed], files });

    return interaction.reply({
      content: '✅ Météo forcée envoyée.',
      ephemeral: true
    });
  }
});

client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);

  sendAutoWeather();
  setInterval(checkSunAnnouncements, 60 * 1000);
});

client.login(TOKEN);
