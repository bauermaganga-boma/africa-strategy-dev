(function () {
  'use strict';

  var WA_NUMBER = '221776381080';
  var chat = document.getElementById('chat');
  var toggle = document.getElementById('chat-toggle');
  var body = document.getElementById('chat-body');
  var chipsBox = document.getElementById('chat-chips');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var fab = document.getElementById('fab');
  var started = false;

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }
  function waButton(text, label) {
    return '<a class="chat__cta" href="' + waLink(text) + '" target="_blank" rel="noopener">' + (label || 'Continuer sur WhatsApp') + '</a>';
  }
  var DEVIS_WA = "Bonjour Africa Strategy, je souhaite un rendez-vous pour présenter un projet.";

  // Base de connaissances issue de la présentation du cabinet
  var KB = [
    { id: 'bonjour', keys: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'bjr'],
      answer: "Bonjour et bienvenue chez <strong>Africa Strategy</strong> ! Je peux vous renseigner sur nos expertises, nos secteurs d'intervention, notre réseau ou vous aider à contacter l'équipe. Que puis-je faire pour vous ?" },
    { id: 'cabinet', keys: ['qui etes', 'qui sommes', 'presentation', 'cabinet', 'africa dev', 'africa strategy', 'histoire', 'creation', 'mission', 'vision'],
      answer: "<strong>Africa Strategy – Development &amp; Technology</strong> (Africa Dev) est un cabinet de <strong>conseil et d'ingénierie financière</strong>, société de droit sénégalais établie à Dakar. Il accompagne les États, les institutions, les entreprises privées et les investisseurs dans la conception, la structuration et la sécurisation de projets à fort impact. Notre signature : <em>« Là où stratégie, finance et impact se rencontrent. »</em>",
      chips: ['Nos expertises', 'Secteurs', 'Contact'] },
    { id: 'services', keys: ['service', 'prestation', 'metier', 'que faites', 'activite', 'expertise', 'domaine', 'proposez', 'offre', 'competence', 'accompagn'],
      answer: "Nos expertises couvrent <strong>six pôles</strong> :<ul><li>Conseil stratégique &amp; attractivité économique</li><li>Ingénierie financière &amp; mobilisation de financements</li><li>Finance d'entreprise &amp; fiscalité stratégique</li><li>Projets publics &amp; relations institutionnelles</li><li>Transformation numérique &amp; services à valeur ajoutée</li><li>Redressement, restructuration &amp; croissance</li></ul>Sur quel sujet puis-je préciser ?",
      chips: ['Ingénierie financière', 'Levée de fonds', 'PPP / projets publics', 'Numérique'] },
    { id: 'conseil', keys: ['conseil', 'strategi', 'diagnostic', 'faisabilite', 'pilotage', 'arbitrage', 'attractivite', 'politique d investissement', 'zone d investissement'],
      answer: "Nous accompagnons les décideurs publics et privés dans la définition d'orientations économiques créatrices de valeur : <strong>diagnostics approfondis, analyses de faisabilité</strong>, arbitrages structurants, anticipation des risques et pilotage de la performance à long terme. Nous aidons aussi à révéler et structurer le potentiel des territoires pour attirer les investissements directs.",
      chips: ['Demander un rendez-vous', 'Nos expertises'] },
    { id: 'ingenierie', keys: ['ingenierie', 'financement', 'montage', 'bancable', 'structuration', 'structurer', 'architecture', 'project finance', 'dette'],
      answer: "Notre <strong>ingénierie financière</strong> conçoit des schémas sur mesure pour des projets complexes : montages innovants, <strong>partenariats public-privé</strong>, project finance, garanties, structuration durable des financements — pour des dispositifs bancables et conformes aux standards des investisseurs et institutions financières internationales.",
      chips: ['Levée de fonds', 'PPP / projets publics', 'Demander un rendez-vous'] },
    { id: 'levee', keys: ['levee', 'lever des fonds', 'capitaux', 'investisseur', 'fonds souverain', 'bailleur', 'multilater', 'mobilisation', 'mobiliser'],
      answer: "Nous jouons un rôle de facilitateur pour l'<strong>accès aux capitaux nationaux et internationaux</strong> : accompagnement des levées de fonds, relations avec les fonds souverains et investisseurs institutionnels, optimisation des mécanismes multilatéraux — avec pour objectif de maximiser le rendement du capital tout en maîtrisant l'exposition financière.",
      chips: ['Demander un rendez-vous', 'Réseau'] },
    { id: 'entreprise', keys: ['finance d entreprise', 'capitalistique', 'valorisation', 'recapitalisation', 'transmission', 'desengagement', 'fiscal', 'patrimon', 'redressement', 'restructuration', 'difficulte', 'croissance', 'expansion', 'plan d affaires', 'business plan'],
      answer: "En <strong>finance d'entreprise</strong>, nous intervenons sur les étapes critiques du cycle de vie : valorisation, recapitalisation, transmission ou désengagement. Nous concevons aussi des <strong>schémas fiscaux optimisés</strong>, des plans de redressement et de restructuration, des stratégies d'expansion maîtrisée et des plans d'affaires structurés.",
      chips: ['Demander un rendez-vous', 'Contact'] },
    { id: 'public', keys: ['public', 'etat', 'gouvernement', 'ppp', 'partenariat', 'institution', 'ministere', 'negociation', 'gre a gre', 'autorite'],
      answer: "Nous structurons et sécurisons les <strong>initiatives publiques majeures</strong> : dispositifs contractuels, accords de gré à gré, négociations avec les autorités compétentes, dialogue entre États, investisseurs et bailleurs. L'objectif : un alignement juridique, réglementaire et financier solide.",
      chips: ['Ingénierie financière', 'Demander un rendez-vous'] },
    { id: 'numerique', keys: ['numerique', 'digital', 'technologi', 'donnee', 'data', 'intelligence artificielle', 'cyber', 'modernisation', 'innovation'],
      answer: "La technologie est un levier de performance et de gouvernance : nous accompagnons la <strong>digitalisation des processus</strong>, le déploiement de solutions intelligentes et l'exploitation stratégique des données, pour plus de transparence et d'efficacité opérationnelle. Nous structurons aussi des véhicules d'investissement dans les <strong>data centers</strong> et infrastructures numériques.",
      chips: ['Secteurs', 'Demander un rendez-vous'] },
    { id: 'secteurs', keys: ['secteur', 'infrastructure', 'energie', 'petrole', 'gaz', 'mine', 'minier', 'agricultur', 'elevage', 'sante', 'immobilier', 'hotel', 'transport', 'environnement', 'media', 'communication', 'logistique', 'route', 'solaire', 'education'],
      answer: "Nous intervenons dans <strong>douze secteurs</strong> :<ul><li>Infrastructures publiques</li><li>Pétrole et gaz</li><li>Construction immobilière et hôtellerie</li><li>Agriculture et élevage</li><li>Énergie</li><li>Santé</li><li>Mines</li><li>Technologie et data centers</li><li>Environnement</li><li>Médias et communication</li><li>Transports</li><li>Éducation, formation, industrie et autres</li></ul><a class=\"chat__link\" href=\"#secteurs\" data-close>Voir le détail par secteur</a>",
      chips: ['Demander un rendez-vous', 'Nos expertises'] },
    { id: 'reseau', keys: ['reseau', 'partenaire', 'chine', 'europe', 'moyen orient', 'asie', 'international', 'expert'],
      answer: "Nous collaborons avec des <strong>institutions financières de premier plan</strong>, des entreprises leaders mondiales et des fonds souverains, et entretenons un réseau stratégique en <strong>Europe, en Chine et au Moyen-Orient</strong>, ainsi que sur l'Afrique et l'Asie. Des experts en finance, ingénierie, énergie, infrastructures, technologie et environnement sont mobilisés selon chaque mission.",
      chips: ['Pourquoi vous choisir ?', 'Contact'] },
    { id: 'pourquoi', keys: ['pourquoi', 'avantage', 'difference', 'atout', 'credibilite', 'confiance', 'ethique', 'transparence', 'transfert de competence', 'qualite', 'garantie', 'valeur'],
      answer: "Choisir Africa Strategy, c'est un partenaire à la <strong>crédibilité établie</strong> auprès des institutions financières et fonds souverains, capable de <strong>mobiliser rapidement</strong> des ressources locales et internationales, avec une démarche d'éthique et de <strong>transparence totale</strong>, et un transfert de compétences qui renforce l'autonomie des équipes locales.",
      chips: ['Réseau', 'Demander un rendez-vous'] },
    { id: 'devis', keys: ['devis', 'prix', 'tarif', 'cout', 'combien', 'budget', 'honoraire', 'rendez vous', 'rdv', 'rencontrer', 'premier contact', 'proposition'],
      answer: "Chaque mission est <strong>pensée sur mesure</strong> : nos conditions dépendent de la nature du projet, des enjeux sectoriels et des contraintes réglementaires. Présentez-nous votre projet et nous reviendrons vers vous :<br>" + waButton(DEVIS_WA, 'Demander un rendez-vous sur WhatsApp') + '<a class="chat__link" href="#contact" data-close>ou remplir le formulaire</a>' },
    { id: 'delai', keys: ['delai', 'combien de temps', 'duree', 'quand', 'rapide', 'planning', 'date'],
      answer: "Les délais dépendent de la nature et de l'ampleur de la mission. Le cabinet s'appuie sur sa <strong>capacité à mobiliser rapidement</strong> des ressources financières et sur sa disponibilité permanente. Décrivez-nous votre projet pour obtenir un calendrier.",
      chips: ['Demander un rendez-vous'] },
    { id: 'zone', keys: ['ou etes', 'etes ou', 'c est ou', 'ou se trouve', 'trouver', 'adresse', 'situe', 'localisation', 'siege', 'bureau', 'bases', 'implante', 'front de terre', 'afrique', 'pays', 'intervenez'],
      answer: "Notre siège est à <strong>Front de Terre, Dakar (Sénégal)</strong>. Le cabinet accompagne des projets sur l'ensemble du continent africain, en lien avec un réseau en Europe, en Chine et au Moyen-Orient.",
      chips: ['Contact', 'Réseau'] },
    { id: 'contact', keys: ['contact', 'telephone', 'numero', 'appeler', 'joindre', 'mail', 'email', 'courriel', 'whatsapp', 'parler', 'humain', 'conseiller', 'rappeler'],
      answer: "Vous pouvez nous joindre :<ul><li>Tél. : <a href=\"tel:+221338670645\">33 867 06 45</a> / <a href=\"tel:+221776381080\">77 638 10 80</a> / <a href=\"tel:+221776755908\">77 675 59 08</a></li><li>E-mail : <a href=\"mailto:contact@africadev.sn\">contact@africadev.sn</a></li><li>Adresse : Front de Terre, Dakar</li></ul>" + waButton("Bonjour Africa Strategy, je souhaite être recontacté.", 'Écrire sur WhatsApp') },
    { id: 'direction', keys: ['directeur', 'dg ', 'ceo', 'patron', 'dirigeant', 'responsable', 'fondateur', 'equipe', 'personnel'],
      answer: "Pour échanger avec la direction ou un membre de l'équipe, le plus simple est de nous écrire : notre équipe vous mettra en relation avec la personne la plus à même de vous répondre.",
      chips: ['Contact'] },
    { id: 'references', keys: ['reference', 'realisation', 'client', 'deja fait', 'exemple', 'portfolio', 'etude de cas'],
      answer: "Le cabinet intervient auprès des États, institutions publiques, entreprises privées et investisseurs internationaux. Pour des exemples de missions adaptés à votre secteur, l'équipe peut vous les présenter lors d'un échange :",
      chips: ['Demander un rendez-vous', 'Contact'] },
    { id: 'emploi', keys: ['emploi', 'recrut', 'stage', 'cv', 'candidature', 'travailler chez', 'job', 'poste'],
      answer: "Pour une candidature ou un stage, vous pouvez adresser votre CV et une lettre de motivation à <a href=\"mailto:contact@africadev.sn\">contact@africadev.sn</a>." },
    { id: 'plaquette', keys: ['plaquette', 'brochure', 'pdf', 'document', 'catalogue', 'telecharg'],
      answer: "Voici la présentation complète du cabinet : <a class=\"chat__link\" href=\"Africa_Strategy_Presentation.pdf\" download>Télécharger le PDF</a>" },
    { id: 'merci', keys: ['merci', 'au revoir', 'bye', 'a bientot', 'parfait', 'super', 'ok merci'],
      answer: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. À bientôt chez Africa Strategy." }
  ];

  var CHIP_MAP = {
    'Nos expertises': 'services', 'Secteurs': 'secteurs', 'Ingénierie financière': 'ingenierie', 'Levée de fonds': 'levee',
    'PPP / projets publics': 'public', 'Numérique': 'numerique', 'Demander un rendez-vous': 'devis', 'Réseau': 'reseau',
    'Pourquoi vous choisir ?': 'pourquoi', 'Contact': 'contact', 'Où êtes-vous ?': 'zone'
  };
  var DEFAULT_CHIPS = ['Nos expertises', 'Secteurs', 'Demander un rendez-vous', 'Où êtes-vous ?', 'Contact'];

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ');
  }

  function findAnswer(q) {
    var t = ' ' + norm(q) + ' ';
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0;
      e.keys.forEach(function (k) { if (t.indexOf(' ' + k) !== -1) score += k.length > 5 ? 2 : 1; });
      // Les salutations ne l'emportent que si la question ne contient rien d'autre
      if (e.id === 'bonjour' && score) score = 0.5;
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return best;
  }

  function addMsg(html, who) {
    var m = document.createElement('div');
    m.className = 'chat__msg chat__msg--' + who;
    m.innerHTML = html;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function setChips(list) {
    chipsBox.innerHTML = '';
    (list || DEFAULT_CHIPS).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat__chip';
      b.textContent = c;
      b.addEventListener('click', function () { ask(c, CHIP_MAP[c]); });
      chipsBox.appendChild(b);
    });
  }

  function botReply(html, chips) {
    var typing = addMsg('<span class="chat__typing"><i></i><i></i><i></i></span>', 'bot');
    setTimeout(function () {
      typing.innerHTML = html;
      body.scrollTop = body.scrollHeight;
      setChips(chips);
    }, 550 + Math.min(html.length, 400));
  }

  function ask(text, forcedId) {
    addMsg(text.replace(/</g, '&lt;'), 'user');
    var entry = null;
    if (forcedId) KB.forEach(function (e) { if (e.id === forcedId) entry = e; });
    if (!entry) entry = findAnswer(text);
    if (entry) {
      botReply(entry.answer, entry.chips);
    } else {
      botReply("Je n'ai pas la réponse précise à cette question, mais notre équipe peut vous répondre directement :<br>" +
        waButton("Bonjour Africa Strategy, j'ai une question : " + text, 'Poser ma question sur WhatsApp'));
    }
  }

  function open() {
    chat.classList.add('is-open');
    fab.classList.add('is-chat-open');
    chat.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      botReply("Bonjour 👋 Je suis l'assistant d'<strong>Africa Strategy</strong>. Posez-moi vos questions sur nos expertises, nos secteurs d'intervention ou votre projet — je vous réponds tout de suite.");
    }
    setTimeout(function () { input.focus(); }, 300);
  }
  function close() {
    chat.classList.remove('is-open');
    fab.classList.remove('is-chat-open');
    chat.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () { chat.classList.contains('is-open') ? close() : open(); });
  document.getElementById('chat-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chat.classList.contains('is-open')) close(); });
  body.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-close]');
    if (a) close();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  // Invitation discrète après quelques secondes, une seule fois par visite
  setTimeout(function () {
    try { if (sessionStorage.getItem('asChatHint')) return; sessionStorage.setItem('asChatHint', '1'); } catch (e) {}
    if (!chat.classList.contains('is-open')) fab.classList.add('is-hint');
    setTimeout(function () { fab.classList.remove('is-hint'); }, 6000);
  }, 5000);
})();
