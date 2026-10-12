/* Espace de gestion — Africa Strategy
   Suivi des dossiers (missions / clients) et des sujets (tâches, points à traiter).
   Les données sont enregistrées dans le navigateur (localStorage) : export / import JSON dans l'onglet « Données ». */
(function () {
  'use strict';

  var KEY = 'africa-strategy-gestion-v1';

  var SECTEURS = ['Infrastructures publiques', 'Pétrole et gaz', 'Immobilier et hôtellerie', 'Agriculture et élevage', 'Énergie', 'Santé',
    'Mines', 'Technologie et data centers', 'Environnement', 'Médias et communication', 'Transports', 'Éducation, industrie et autres'];
  var SERVICES = ['Conseil stratégique et attractivité', 'Ingénierie financière et financements', 'Finance d\'entreprise et fiscalité',
    'Projets publics et relations institutionnelles', 'Transformation numérique et services', 'Redressement et croissance'];
  var TYPES_CLIENT = ['État / collectivité', 'Institution publique', 'Entreprise privée', 'Investisseur / fonds', 'Bailleur / institution multilatérale', 'Autre'];
  var STATUTS_D = ['Prospect', 'Qualification', 'Proposition', 'Négociation', 'En cours', 'Clôturé', 'Abandonné'];
  var STATUTS_S = ['À faire', 'En cours', 'En attente', 'Terminé'];
  var PRIO = ['Haute', 'Normale', 'Basse'];
  var CATS = ['Analyse / étude', 'Financement', 'Juridique et fiscal', 'Relation institutionnelle', 'Commercial', 'Veille', 'Administratif', 'Autre'];
  var DEVISES = ['FCFA', 'EUR', 'USD'];
  var DONE_D = ['Clôturé', 'Abandonné'];

  var state = load();
  var ui = { view: 'dashboard', dq: '', df: { statut: '', secteur: '', resp: '', prio: '' }, dmode: 'liste',
    sq: '', sf: { statut: '', dossier: '', resp: '', cat: '' }, smode: 'kanban', open: null };

  /* ---------- Utilitaires ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function iso(d) { var m = d.getMonth() + 1, j = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (j < 10 ? '0' : '') + j; }
  function today() { return iso(new Date()); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function daysTo(s) { if (!s) return null; return Math.round((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000); }
  function fmtDate(s) { if (!s) return '—'; var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fmtMoney(n, dev) { if (n === '' || n == null || isNaN(n)) return '—'; return Number(n).toLocaleString('fr-FR') + ' ' + (dev || 'FCFA'); }
  function opts(list, sel, blank) {
    return (blank ? '<option value="">' + esc(blank) + '</option>' : '') + list.map(function (v) {
      return '<option' + (v === sel ? ' selected' : '') + '>' + esc(v) + '</option>';
    }).join('');
  }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }
  function active(d) { return DONE_D.indexOf(d.statut) === -1; }
  function dossierById(id) { return state.dossiers.filter(function (d) { return d.id === id; })[0]; }
  function sujetsOf(id) { return state.sujets.filter(function (s) { return s.dossierId === id; }); }

  /* ---------- Stockage ---------- */
  function empty() { return { v: 1, seq: 0, dossiers: [], sujets: [] }; }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var s = JSON.parse(raw); if (s && Array.isArray(s.dossiers) && Array.isArray(s.sujets)) { s.seq = s.seq || s.dossiers.length; return s; } }
    } catch (e) {}
    return empty();
  }
  var storageOk = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
    catch (e) { storageOk = false; toast('Enregistrement impossible dans ce navigateur : pensez à exporter vos données.'); }
  }
  function nextRef() {
    state.seq = (state.seq || 0) + 1;
    return 'AD-' + new Date().getFullYear() + '-' + ('00' + state.seq).slice(-3);
  }
  function log(d, text) { d.journal = d.journal || []; d.journal.unshift({ d: new Date().toISOString(), t: text }); }

  /* ---------- Exemples fictifs ---------- */
  function loadExamples() {
    var a = { id: uid(), ref: nextRef(), titre: '[Exemple] Centrale solaire 50 MW', client: 'Société énergétique (fictive)', typeClient: 'Entreprise privée', pays: 'Sénégal', secteur: 'Énergie',
      service: SERVICES[1], statut: 'Proposition', priorite: 'Haute', responsable: 'À définir', ouverture: plusDays(-30), montant: 45000000000, devise: 'FCFA', echeance: plusDays(12),
      notes: 'Dossier fictif pour illustrer l\'outil : structuration du financement, accord d\'achat d\'électricité, recherche d\'investisseurs.', journal: [] };
    var b = { id: uid(), ref: nextRef(), titre: '[Exemple] Programme de logements sociaux', client: 'Ministère (fictif)', typeClient: 'État / collectivité', pays: 'Sénégal', secteur: 'Immobilier et hôtellerie',
      service: SERVICES[3], statut: 'En cours', priorite: 'Normale', responsable: 'À définir', ouverture: plusDays(-90), montant: 12000000, devise: 'EUR', echeance: plusDays(60),
      notes: 'Dossier fictif : montage PPP et recherche de bailleurs.', journal: [] };
    var c = { id: uid(), ref: nextRef(), titre: '[Exemple] Plateforme de données sécurisée', client: 'Opérateur numérique (fictif)', typeClient: 'Entreprise privée', pays: 'Côte d\'Ivoire', secteur: 'Technologie et data centers',
      service: SERVICES[4], statut: 'Qualification', priorite: 'Normale', responsable: 'À définir', ouverture: plusDays(-7), montant: '', devise: 'USD', echeance: '',
      notes: 'Dossier fictif : cadrage du besoin avant proposition.', journal: [] };
    var d = { id: uid(), ref: nextRef(), titre: '[Exemple] Restructuration d\'un groupe agro-industriel', client: 'Groupe agro-industriel (fictif)', typeClient: 'Entreprise privée', pays: 'Mali', secteur: 'Agriculture et élevage',
      service: SERVICES[5], statut: 'Prospect', priorite: 'Basse', responsable: 'À définir', ouverture: plusDays(-3), montant: 3000000, devise: 'EUR', echeance: plusDays(30),
      notes: 'Dossier fictif.', journal: [] };
    [a, b, c, d].forEach(function (x) { log(x, 'Dossier créé (exemple)'); });
    state.dossiers.push(a, b, c, d);
    function s(t, dos, cat, st, pr, ech) { state.sujets.push({ id: uid(), titre: t, dossierId: dos ? dos.id : '', categorie: cat, statut: st, priorite: pr, assigne: 'À définir', echeance: ech, notes: '' }); }
    s('[Exemple] Finaliser la note d\'information investisseurs', a, 'Financement', 'En cours', 'Haute', plusDays(5));
    s('[Exemple] Valider le modèle financier', a, 'Analyse / étude', 'À faire', 'Haute', plusDays(-2));
    s('[Exemple] Relire le projet de contrat d\'achat d\'électricité', a, 'Juridique et fiscal', 'En attente', 'Normale', plusDays(9));
    s('[Exemple] Réunion de cadrage avec le ministère', b, 'Relation institutionnelle', 'À faire', 'Normale', plusDays(3));
    s('[Exemple] Cartographier les bailleurs potentiels', b, 'Financement', 'Terminé', 'Normale', plusDays(-10));
    s('[Exemple] Recueillir le besoin détaillé du client', c, 'Commercial', 'En cours', 'Normale', plusDays(6));
    s('[Exemple] Préparer la proposition d\'accompagnement', d, 'Commercial', 'À faire', 'Basse', plusDays(14));
    s('[Exemple] Veille : nouveaux mécanismes de garantie en Afrique de l\'Ouest', null, 'Veille', 'En cours', 'Basse', '');
    s('[Exemple] Mettre à jour la présentation du cabinet', null, 'Administratif', 'À faire', 'Basse', plusDays(20));
    save();
  }

  /* ---------- Navigation ---------- */
  function setView(v) {
    ui.view = v;
    $$('.view').forEach(function (s) { s.hidden = s.id !== 'view-' + v; });
    $$('#tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.view === v); });
    try { history.replaceState(null, '', '#' + v); } catch (e) {}
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- Rendu ---------- */
  function render() {
    $('#n-dossiers').textContent = state.dossiers.length;
    $('#n-sujets').textContent = state.sujets.filter(function (s) { return s.statut !== 'Terminé'; }).length;
    var people = {};
    state.dossiers.forEach(function (d) { if (d.responsable) people[d.responsable] = 1; });
    state.sujets.forEach(function (s) { if (s.assigne) people[s.assigne] = 1; });
    $('#dl-resp').innerHTML = Object.keys(people).sort().map(function (p) { return '<option value="' + esc(p) + '">'; }).join('');
    if (ui.view === 'dashboard') renderDashboard();
    else if (ui.view === 'dossiers') renderDossiers();
    else if (ui.view === 'sujets') renderSujets();
    else renderDonnees();
    if (ui.open) renderDrawer();
  }

  function badge(txt, kind) { return '<span class="b b--' + esc(kind || slug(txt)) + '">' + esc(txt) + '</span>'; }
  function dueTag(s, doneFlag) {
    if (!s) return '<span class="muted">—</span>';
    var n = daysTo(s), cls = '', hint = '';
    if (!doneFlag) {
      if (n < 0) { cls = ' due--late'; hint = ' · retard ' + (-n) + ' j'; }
      else if (n <= 7) { cls = ' due--soon'; hint = n === 0 ? ' · aujourd\'hui' : ' · dans ' + n + ' j'; }
    }
    return '<span class="due' + cls + '">' + fmtDate(s) + esc(hint) + '</span>';
  }
  function emptyBlock(title, text, btn) {
    return '<div class="empty"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (btn || '') + '</div>';
  }

  /* --- Tableau de bord --- */
  function renderDashboard() {
    var el = $('#view-dashboard');
    if (!state.dossiers.length && !state.sujets.length) {
      el.innerHTML = '<div class="head"><h1>Tableau de bord</h1></div>' + emptyBlock('Bienvenue dans votre espace de suivi',
        'Créez votre premier dossier (une mission, un client, une opération) puis ajoutez les sujets à traiter. Vous pouvez aussi charger quelques exemples fictifs pour découvrir l\'outil.',
        '<div class="empty__actions"><button class="btn btn--brown" data-action="new-dossier">Créer un dossier</button><button class="btn btn--line" data-action="examples">Charger des exemples</button></div>');
      return;
    }
    var actifs = state.dossiers.filter(active);
    var sujOuverts = state.sujets.filter(function (s) { return s.statut !== 'Terminé'; });
    var retard = sujOuverts.filter(function (s) { return s.echeance && daysTo(s.echeance) < 0; });
    var proches = sujOuverts.filter(function (s) { var n = daysTo(s.echeance); return s.echeance && n >= 0 && n <= 7; });
    var pipe = {};
    actifs.forEach(function (d) { if (d.montant !== '' && d.montant != null) pipe[d.devise || 'FCFA'] = (pipe[d.devise || 'FCFA'] || 0) + Number(d.montant); });
    var pipeTxt = Object.keys(pipe).map(function (k) { return fmtMoney(pipe[k], k); }).join('<br>') || '—';

    var byStatut = STATUTS_D.map(function (st) { return [st, state.dossiers.filter(function (d) { return d.statut === st; }).length]; });
    var maxS = Math.max.apply(null, byStatut.map(function (x) { return x[1]; }).concat([1]));
    var secMap = {};
    actifs.forEach(function (d) { var k = d.secteur || 'Non précisé'; secMap[k] = (secMap[k] || 0) + 1; });
    var bySect = Object.keys(secMap).map(function (k) { return [k, secMap[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var maxK = Math.max.apply(null, bySect.map(function (x) { return x[1]; }).concat([1]));

    var urgents = sujOuverts.filter(function (s) { return s.echeance && daysTo(s.echeance) <= 7; })
      .sort(function (a, b) { return a.echeance < b.echeance ? -1 : 1; }).slice(0, 7);
    var dosEch = actifs.filter(function (d) { return d.echeance && daysTo(d.echeance) <= 30; })
      .sort(function (a, b) { return a.echeance < b.echeance ? -1 : 1; }).slice(0, 5);
    var recents = [];
    state.dossiers.forEach(function (d) { (d.journal || []).slice(0, 3).forEach(function (j) { recents.push({ d: d, j: j }); }); });
    recents.sort(function (a, b) { return a.j.d < b.j.d ? 1 : -1; });
    recents = recents.slice(0, 7);

    el.innerHTML =
      '<div class="head"><h1>Tableau de bord</h1><p class="muted">Vue d\'ensemble au ' + fmtDate(today()) + '</p></div>' +
      '<div class="kpis">' +
        kpi('Dossiers actifs', actifs.length, state.dossiers.length + ' au total', '') +
        kpi('Sujets ouverts', sujOuverts.length, (state.sujets.length - sujOuverts.length) + (state.sujets.length - sujOuverts.length > 1 ? ' terminés' : ' terminé'), '') +
        kpi('En retard', retard.length, retard.length ? 'à traiter en priorité' : 'rien en retard', retard.length ? 'kpi--alert' : 'kpi--ok') +
        kpi('Échéances sous 7 jours', proches.length, 'sujets à échoir', proches.length ? 'kpi--warn' : '') +
        '<div class="kpi kpi--wide"><span>Montant des dossiers actifs</span><strong class="kpi__money">' + pipeTxt + '</strong><small>estimations saisies, par devise</small></div>' +
      '</div>' +
      '<div class="grid2">' +
        '<section class="card"><h2>Dossiers par statut</h2>' +
          byStatut.map(function (x) { return bar(x[0], x[1], maxS, 'st-' + slug(x[0]), 'dossiers', x[0]); }).join('') + '</section>' +
        '<section class="card"><h2>Dossiers actifs par secteur</h2>' +
          (bySect.length ? bySect.map(function (x) { return bar(x[0], x[1], maxK, 'sect'); }).join('') : '<p class="muted">Aucun dossier actif.</p>') + '</section>' +
      '</div>' +
      '<div class="grid2">' +
        '<section class="card"><h2>Sujets à surveiller</h2>' +
          (urgents.length ? '<ul class="list">' + urgents.map(function (s) {
            var d = dossierById(s.dossierId);
            return '<li><div><a href="#" data-action="edit-sujet" data-id="' + s.id + '">' + esc(s.titre) + '</a><small>' + (d ? esc(d.ref) + ' · ' + esc(d.titre) : 'Hors dossier') + '</small></div>' + dueTag(s.echeance) + '</li>';
          }).join('') + '</ul>' : '<p class="muted">Aucun sujet en retard ni à échéance proche.</p>') + '</section>' +
        '<section class="card"><h2>Dossiers : échéances à 30 jours</h2>' +
          (dosEch.length ? '<ul class="list">' + dosEch.map(function (d) {
            return '<li><div><a href="#" data-action="open" data-id="' + d.id + '">' + esc(d.titre) + '</a><small>' + esc(d.ref) + ' · ' + esc(d.client) + '</small></div>' + dueTag(d.echeance) + '</li>';
          }).join('') + '</ul>' : '<p class="muted">Aucune échéance de dossier dans les 30 jours.</p>') + '</section>' +
      '</div>' +
      '<section class="card"><h2>Derniers mouvements</h2>' +
        (recents.length ? '<ul class="list">' + recents.map(function (r) {
          return '<li><div><a href="#" data-action="open" data-id="' + r.d.id + '">' + esc(r.d.titre) + '</a><small>' + esc(r.j.t) + '</small></div><span class="muted">' + fmtDate(r.j.d.slice(0, 10)) + '</span></li>';
        }).join('') + '</ul>' : '<p class="muted">Aucun mouvement enregistré.</p>') + '</section>';
  }
  function kpi(label, val, sub, cls) { return '<div class="kpi ' + cls + '"><span>' + esc(label) + '</span><strong>' + val + '</strong><small>' + esc(sub) + '</small></div>'; }
  function bar(label, n, max, cls, goView, filterVal) {
    var attrs = goView ? ' data-action="goto-statut" data-statut="' + esc(filterVal) + '"' : '';
    return '<div class="bar-row"' + attrs + '><span class="bar-row__l">' + esc(label) + '</span><div class="bar-row__t"><i class="' + (cls || '') + '" style="width:' + Math.round(n / max * 100) + '%"></i></div><b>' + n + '</b></div>';
  }

  /* --- Dossiers --- */
  function filteredDossiers() {
    var q = ui.dq.trim().toLowerCase(), f = ui.df;
    return state.dossiers.filter(function (d) {
      if (f.statut && d.statut !== f.statut) return false;
      if (f.secteur && d.secteur !== f.secteur) return false;
      if (f.resp && d.responsable !== f.resp) return false;
      if (f.prio && d.priorite !== f.prio) return false;
      if (q && (d.titre + ' ' + d.client + ' ' + d.ref + ' ' + d.pays + ' ' + d.notes).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function respList() {
    var p = {}; state.dossiers.forEach(function (d) { if (d.responsable) p[d.responsable] = 1; });
    return Object.keys(p).sort();
  }
  function progress(d) {
    var l = sujetsOf(d.id); if (!l.length) return '<span class="muted">—</span>';
    var done = l.filter(function (s) { return s.statut === 'Terminé'; }).length;
    return '<span class="prog"><i style="width:' + Math.round(done / l.length * 100) + '%"></i></span><small>' + done + '/' + l.length + '</small>';
  }
  function renderDossiers() {
    var el = $('#view-dossiers');
    var list = filteredDossiers();
    var html = '<div class="head"><h1>Dossiers</h1><div class="seg">' +
      '<button data-action="dmode" data-mode="liste" class="' + (ui.dmode === 'liste' ? 'is-on' : '') + '">Liste</button>' +
      '<button data-action="dmode" data-mode="pipeline" class="' + (ui.dmode === 'pipeline' ? 'is-on' : '') + '">Pipeline</button></div></div>' +
      '<div class="filters">' +
        '<input type="search" id="dq" placeholder="Rechercher un dossier, un client, une référence…" value="' + esc(ui.dq) + '" aria-label="Rechercher">' +
        '<select data-filter="d:statut" aria-label="Statut">' + opts(STATUTS_D, ui.df.statut, 'Tous les statuts') + '</select>' +
        '<select data-filter="d:secteur" aria-label="Secteur">' + opts(SECTEURS, ui.df.secteur, 'Tous les secteurs') + '</select>' +
        '<select data-filter="d:resp" aria-label="Responsable">' + opts(respList(), ui.df.resp, 'Tous les responsables') + '</select>' +
        '<select data-filter="d:prio" aria-label="Priorité">' + opts(PRIO, ui.df.prio, 'Toutes priorités') + '</select>' +
        '<button class="btn btn--line btn--sm" data-action="reset-d">Réinitialiser</button></div>';
    if (!state.dossiers.length) {
      el.innerHTML = html + emptyBlock('Aucun dossier pour le moment', 'Un dossier regroupe une mission, un client ou une opération, avec ses sujets à traiter et son journal de suivi.',
        '<div class="empty__actions"><button class="btn btn--brown" data-action="new-dossier">Créer un dossier</button><button class="btn btn--line" data-action="examples">Charger des exemples</button></div>');
      return bindSearch();
    }
    if (!list.length) { el.innerHTML = html + emptyBlock('Aucun résultat', 'Aucun dossier ne correspond à ces critères.', '<button class="btn btn--line" data-action="reset-d">Réinitialiser les filtres</button>'); return bindSearch(); }

    if (ui.dmode === 'liste') {
      html += '<div class="tablewrap"><table class="tbl"><thead><tr><th>Référence</th><th>Dossier</th><th>Secteur</th><th>Statut</th><th>Priorité</th><th>Responsable</th><th class="r">Montant</th><th>Échéance</th><th>Sujets</th></tr></thead><tbody>' +
        list.map(function (d) {
          return '<tr data-action="open" data-id="' + d.id + '" tabindex="0"><td class="mono">' + esc(d.ref) + '</td>' +
            '<td><strong>' + esc(d.titre) + '</strong><small>' + esc(d.client) + (d.pays ? ' · ' + esc(d.pays) : '') + '</small></td>' +
            '<td>' + esc(d.secteur || '—') + '</td><td>' + badge(d.statut, 'st-' + slug(d.statut)) + '</td><td>' + badge(d.priorite, 'p-' + slug(d.priorite)) + '</td>' +
            '<td>' + esc(d.responsable || '—') + '</td><td class="r">' + fmtMoney(d.montant, d.devise) + '</td><td>' + dueTag(d.echeance, !active(d)) + '</td><td class="nowrap">' + progress(d) + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="count">' + list.length + ' dossier' + (list.length > 1 ? 's' : '') + ' affiché' + (list.length > 1 ? 's' : '') + '</p>';
    } else {
      html += '<div class="kanban">' + STATUTS_D.map(function (st) {
        var col = list.filter(function (d) { return d.statut === st; });
        return '<div class="col" data-drop="d" data-statut="' + esc(st) + '"><header><b>' + esc(st) + '</b><i>' + col.length + '</i></header>' +
          col.map(function (d) {
            return '<article class="card-k" draggable="true" data-drag="d" data-id="' + d.id + '">' +
              '<a href="#" data-action="open" data-id="' + d.id + '"><strong>' + esc(d.titre) + '</strong></a><small>' + esc(d.client) + '</small>' +
              '<div class="card-k__meta">' + badge(d.priorite, 'p-' + slug(d.priorite)) + dueTag(d.echeance, !active(d)) + '</div>' +
              '<div class="card-k__foot"><span>' + fmtMoney(d.montant, d.devise) + '</span>' +
              '<select data-action="move-d" data-id="' + d.id + '" aria-label="Changer le statut">' + opts(STATUTS_D, d.statut) + '</select></div></article>';
          }).join('') + '</div>';
      }).join('') + '</div><p class="count">Glissez-déposez une carte pour changer son statut (ou utilisez la liste déroulante).</p>';
    }
    el.innerHTML = html;
    bindSearch();
  }

  /* --- Sujets --- */
  function filteredSujets() {
    var q = ui.sq.trim().toLowerCase(), f = ui.sf;
    return state.sujets.filter(function (s) {
      if (f.statut && s.statut !== f.statut) return false;
      if (f.dossier === '__none' && s.dossierId) return false;
      if (f.dossier && f.dossier !== '__none' && s.dossierId !== f.dossier) return false;
      if (f.resp && s.assigne !== f.resp) return false;
      if (f.cat && s.categorie !== f.cat) return false;
      if (q) { var d = dossierById(s.dossierId); if ((s.titre + ' ' + s.notes + ' ' + (d ? d.titre + ' ' + d.ref : '')).toLowerCase().indexOf(q) === -1) return false; }
      return true;
    });
  }
  function sujetRef(s) { var d = dossierById(s.dossierId); return d ? '<a href="#" data-action="open" data-id="' + d.id + '">' + esc(d.ref) + '</a>' : '<span class="muted">Hors dossier</span>'; }
  function renderSujets() {
    var el = $('#view-sujets');
    var list = filteredSujets();
    var people = {}; state.sujets.forEach(function (s) { if (s.assigne) people[s.assigne] = 1; });
    var html = '<div class="head"><h1>Sujets</h1><div class="seg">' +
      '<button data-action="smode" data-mode="kanban" class="' + (ui.smode === 'kanban' ? 'is-on' : '') + '">Tableau</button>' +
      '<button data-action="smode" data-mode="liste" class="' + (ui.smode === 'liste' ? 'is-on' : '') + '">Liste</button></div></div>' +
      '<div class="filters">' +
        '<input type="search" id="sq" placeholder="Rechercher un sujet…" value="' + esc(ui.sq) + '" aria-label="Rechercher">' +
        '<select data-filter="s:statut" aria-label="Statut">' + opts(STATUTS_S, ui.sf.statut, 'Tous les statuts') + '</select>' +
        '<select data-filter="s:dossier" aria-label="Dossier"><option value="">Tous les dossiers</option><option value="__none"' + (ui.sf.dossier === '__none' ? ' selected' : '') + '>Hors dossier</option>' +
          state.dossiers.map(function (d) { return '<option value="' + d.id + '"' + (ui.sf.dossier === d.id ? ' selected' : '') + '>' + esc(d.ref + ' — ' + d.titre) + '</option>'; }).join('') + '</select>' +
        '<select data-filter="s:resp" aria-label="Assigné">' + opts(Object.keys(people).sort(), ui.sf.resp, 'Tous les assignés') + '</select>' +
        '<select data-filter="s:cat" aria-label="Catégorie">' + opts(CATS, ui.sf.cat, 'Toutes catégories') + '</select>' +
        '<button class="btn btn--line btn--sm" data-action="reset-s">Réinitialiser</button></div>';
    if (!state.sujets.length) {
      el.innerHTML = html + emptyBlock('Aucun sujet pour le moment', 'Un sujet est un point à traiter : une analyse, une relance, une réunion, une veille. Il peut être rattaché à un dossier ou rester indépendant.',
        '<div class="empty__actions"><button class="btn btn--brown" data-action="new-sujet">Créer un sujet</button><button class="btn btn--line" data-action="examples">Charger des exemples</button></div>');
      return bindSearch();
    }
    if (!list.length) { el.innerHTML = html + emptyBlock('Aucun résultat', 'Aucun sujet ne correspond à ces critères.', '<button class="btn btn--line" data-action="reset-s">Réinitialiser les filtres</button>'); return bindSearch(); }

    if (ui.smode === 'liste') {
      html += '<div class="tablewrap"><table class="tbl"><thead><tr><th></th><th>Sujet</th><th>Dossier</th><th>Catégorie</th><th>Statut</th><th>Priorité</th><th>Assigné</th><th>Échéance</th></tr></thead><tbody>' +
        list.slice().sort(function (a, b) { return (a.echeance || '9999') < (b.echeance || '9999') ? -1 : 1; }).map(function (s) {
          return '<tr><td><input type="checkbox" data-action="toggle-s" data-id="' + s.id + '"' + (s.statut === 'Terminé' ? ' checked' : '') + ' aria-label="Marquer comme terminé"></td>' +
            '<td><a href="#" class="strong' + (s.statut === 'Terminé' ? ' done' : '') + '" data-action="edit-sujet" data-id="' + s.id + '">' + esc(s.titre) + '</a></td><td>' + sujetRef(s) + '</td><td>' + esc(s.categorie) + '</td>' +
            '<td>' + badge(s.statut, 'ss-' + slug(s.statut)) + '</td><td>' + badge(s.priorite, 'p-' + slug(s.priorite)) + '</td><td>' + esc(s.assigne || '—') + '</td><td>' + dueTag(s.echeance, s.statut === 'Terminé') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="count">' + list.length + ' sujet' + (list.length > 1 ? 's' : '') + '</p>';
    } else {
      html += '<div class="kanban kanban--4">' + STATUTS_S.map(function (st) {
        var col = list.filter(function (s) { return s.statut === st; });
        return '<div class="col" data-drop="s" data-statut="' + esc(st) + '"><header><b>' + esc(st) + '</b><i>' + col.length + '</i></header>' +
          col.map(function (s) {
            return '<article class="card-k" draggable="true" data-drag="s" data-id="' + s.id + '">' +
              '<a href="#" data-action="edit-sujet" data-id="' + s.id + '"><strong>' + esc(s.titre) + '</strong></a>' +
              '<small>' + sujetRef(s) + (s.assigne ? ' · ' + esc(s.assigne) : '') + '</small>' +
              '<div class="card-k__meta">' + badge(s.priorite, 'p-' + slug(s.priorite)) + dueTag(s.echeance, s.statut === 'Terminé') + '</div>' +
              '<div class="card-k__foot"><span>' + esc(s.categorie) + '</span><select data-action="move-s" data-id="' + s.id + '" aria-label="Changer le statut">' + opts(STATUTS_S, s.statut) + '</select></div></article>';
          }).join('') + '</div>';
      }).join('') + '</div><p class="count">Glissez-déposez une carte pour changer son statut (ou utilisez la liste déroulante).</p>';
    }
    el.innerHTML = html;
    bindSearch();
  }

  /* --- Données --- */
  function renderDonnees() {
    $('#view-donnees').innerHTML =
      '<div class="head"><h1>Données</h1></div>' +
      '<div class="note"><strong>Où sont enregistrées les données ?</strong> Dans ce navigateur, sur cet appareil (stockage local). Elles ne sont envoyées nulle part. ' +
        'Pour les sauvegarder, les transférer sur un autre appareil ou les partager, utilisez l\'export ci-dessous. Vider les données du navigateur les efface : exportez régulièrement.' +
        (storageOk ? '' : ' <b>Attention : l\'enregistrement local est indisponible dans ce navigateur.</b>') + '</div>' +
      '<div class="grid2">' +
        '<section class="card"><h2>Sauvegarde</h2><p class="muted">Un fichier JSON contenant tous les dossiers, sujets et journaux.</p><div class="row">' +
          '<button class="btn btn--brown" data-action="export-json">Exporter (JSON)</button>' +
          '<button class="btn btn--line" data-action="import-json">Importer un fichier…</button></div>' +
          '<p class="muted small">L\'import remplace les données actuelles.</p></section>' +
        '<section class="card"><h2>Pour Excel</h2><p class="muted">Deux fichiers CSV (séparateur « ; », accents conservés) à ouvrir dans Excel ou Google Sheets.</p><div class="row">' +
          '<button class="btn btn--line" data-action="export-csv-d">Dossiers (CSV)</button>' +
          '<button class="btn btn--line" data-action="export-csv-s">Sujets (CSV)</button></div></section>' +
      '</div>' +
      '<section class="card"><h2>Contenu actuel</h2><p>' + state.dossiers.length + ' dossier(s) · ' + state.sujets.length + ' sujet(s).</p><div class="row">' +
        '<button class="btn btn--line" data-action="examples">Ajouter des exemples fictifs</button>' +
        '<button class="btn btn--danger" data-action="wipe">Tout effacer</button></div></section>';
  }

  /* --- Fiche dossier --- */
  function renderDrawer() {
    var d = dossierById(ui.open), dr = $('#drawer');
    if (!d) { closeDrawer(); return; }
    var ss = sujetsOf(d.id);
    var steps = STATUTS_D.slice(0, 6);
    var idx = steps.indexOf(d.statut);
    dr.innerHTML =
      '<header class="dr__head"><div><span class="mono">' + esc(d.ref) + '</span><h2>' + esc(d.titre) + '</h2><p>' + esc(d.client) + (d.pays ? ' · ' + esc(d.pays) : '') + '</p></div>' +
      '<button class="x" data-action="close-drawer" aria-label="Fermer">&times;</button></header>' +
      '<div class="dr__body">' +
        '<div class="steps">' + steps.map(function (s, i) {
          return '<button data-action="set-statut" data-statut="' + esc(s) + '" class="' + (i < idx ? 'is-past ' : '') + (i === idx ? 'is-now' : '') + '">' + esc(s) + '</button>';
        }).join('') + '</div>' +
        '<div class="dr__tags">' + badge(d.statut, 'st-' + slug(d.statut)) + badge(d.priorite, 'p-' + slug(d.priorite)) +
          '<button class="link" data-action="set-statut" data-statut="Abandonné">Abandonné</button></div>' +
        '<dl class="dl">' +
          '<div><dt>Type de client</dt><dd>' + esc(d.typeClient || '—') + '</dd></div><div><dt>Secteur</dt><dd>' + esc(d.secteur || '—') + '</dd></div>' +
          '<div><dt>Service</dt><dd>' + esc(d.service || '—') + '</dd></div><div><dt>Responsable</dt><dd>' + esc(d.responsable || '—') + '</dd></div>' +
          '<div><dt>Montant estimé</dt><dd>' + fmtMoney(d.montant, d.devise) + '</dd></div><div><dt>Ouverture</dt><dd>' + fmtDate(d.ouverture) + '</dd></div>' +
          '<div><dt>Échéance</dt><dd>' + dueTag(d.echeance, !active(d)) + '</dd></div></dl>' +
        (d.notes ? '<h3>Description</h3><p class="pre">' + esc(d.notes) + '</p>' : '') +
        '<h3>Sujets du dossier <button class="link" data-action="new-sujet-for" data-id="' + d.id + '">+ Ajouter</button></h3>' +
        (ss.length ? '<ul class="list list--s">' + ss.map(function (s) {
          return '<li><label><input type="checkbox" data-action="toggle-s" data-id="' + s.id + '"' + (s.statut === 'Terminé' ? ' checked' : '') + '><span class="' + (s.statut === 'Terminé' ? 'done' : '') + '">' +
            '<a href="#" data-action="edit-sujet" data-id="' + s.id + '">' + esc(s.titre) + '</a></span></label>' + dueTag(s.echeance, s.statut === 'Terminé') + '</li>';
        }).join('') + '</ul>' : '<p class="muted">Aucun sujet rattaché à ce dossier.</p>') +
        '<h3>Journal de suivi</h3>' +
        '<form class="note-form" data-action="add-note"><textarea name="t" rows="2" placeholder="Compte rendu d\'appel, décision, prochaine étape…" aria-label="Nouvelle note"></textarea><button class="btn btn--brown btn--sm" type="submit">Ajouter</button></form>' +
        ((d.journal || []).length ? '<ul class="journal">' + d.journal.map(function (j) {
          return '<li><time>' + fmtDate(j.d.slice(0, 10)) + '</time><p>' + esc(j.t) + '</p></li>';
        }).join('') + '</ul>' : '<p class="muted">Aucune note pour le moment.</p>') +
      '</div>' +
      '<footer class="dr__foot"><button class="btn btn--danger btn--sm" data-action="del-dossier" data-id="' + d.id + '">Supprimer</button>' +
        '<button class="btn btn--brown" data-action="edit-dossier" data-id="' + d.id + '">Modifier le dossier</button></footer>';
  }
  function openDrawer(id) {
    ui.open = id; $('#drawer').classList.add('is-open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').hidden = false; document.body.classList.add('no-scroll');
    renderDrawer();
  }
  function closeDrawer() {
    ui.open = null; $('#drawer').classList.remove('is-open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').hidden = true; document.body.classList.remove('no-scroll');
  }

  /* ---------- Formulaires ---------- */
  var fD = $('#f-dossier'), fS = $('#f-sujet');
  function fillSelects() {
    fD.typeClient.innerHTML = opts(TYPES_CLIENT); fD.secteur.innerHTML = opts(SECTEURS, '', '— Non précisé —'); fD.service.innerHTML = opts(SERVICES, '', '— Non précisé —');
    fD.statut.innerHTML = opts(STATUTS_D); fD.priorite.innerHTML = opts(PRIO, 'Normale'); fD.devise.innerHTML = opts(DEVISES);
    fS.categorie.innerHTML = opts(CATS); fS.statut.innerHTML = opts(STATUTS_S); fS.priorite.innerHTML = opts(PRIO, 'Normale');
  }
  function openDossierForm(id) {
    fillSelects(); $('#err-dossier').textContent = '';
    var d = id ? dossierById(id) : null;
    $('#dlg-dossier-title').textContent = d ? 'Modifier le dossier' : 'Nouveau dossier';
    var base = d || { id: '', titre: '', client: '', typeClient: TYPES_CLIENT[2], pays: '', secteur: '', service: '', statut: 'Prospect', priorite: 'Normale', responsable: '', ouverture: today(), montant: '', devise: 'FCFA', echeance: '', notes: '' };
    ['id', 'titre', 'client', 'typeClient', 'pays', 'secteur', 'service', 'statut', 'priorite', 'responsable', 'ouverture', 'montant', 'devise', 'echeance', 'notes'].forEach(function (k) { fD[k].value = base[k] == null ? '' : base[k]; });
    $('#dlg-dossier').showModal(); fD.titre.focus();
  }
  function openSujetForm(id, dossierId) {
    fillSelects(); $('#err-sujet').textContent = '';
    var s = id ? state.sujets.filter(function (x) { return x.id === id; })[0] : null;
    $('#dlg-sujet-title').textContent = s ? 'Modifier le sujet' : 'Nouveau sujet';
    fS.dossierId.innerHTML = '<option value="">— Aucun (sujet indépendant) —</option>' + state.dossiers.map(function (d) { return '<option value="' + d.id + '">' + esc(d.ref + ' — ' + d.titre) + '</option>'; }).join('');
    var base = s || { id: '', titre: '', dossierId: dossierId || '', categorie: CATS[0], statut: 'À faire', priorite: 'Normale', assigne: '', echeance: '', notes: '' };
    ['id', 'titre', 'dossierId', 'categorie', 'statut', 'priorite', 'assigne', 'echeance', 'notes'].forEach(function (k) { fS[k].value = base[k] == null ? '' : base[k]; });
    $('#dlg-sujet').showModal(); fS.titre.focus();
  }

  fD.addEventListener('submit', function (e) {
    e.preventDefault();
    var titre = fD.titre.value.trim(), client = fD.client.value.trim();
    if (!titre || !client) { $('#err-dossier').textContent = 'L\'intitulé et le client sont obligatoires.'; return; }
    var id = fD.id.value, d = id ? dossierById(id) : null, isNew = !d;
    if (!d) { d = { id: uid(), ref: nextRef(), journal: [] }; state.dossiers.push(d); }
    var oldStatut = d.statut;
    ['titre', 'client', 'typeClient', 'pays', 'secteur', 'service', 'statut', 'priorite', 'responsable', 'ouverture', 'devise', 'echeance', 'notes'].forEach(function (k) { d[k] = fD[k].value.trim(); });
    d.montant = fD.montant.value === '' ? '' : Number(fD.montant.value);
    if (isNew) log(d, 'Dossier créé — statut : ' + d.statut);
    else if (oldStatut !== d.statut) log(d, 'Statut : ' + oldStatut + ' → ' + d.statut);
    save(); $('#dlg-dossier').close(); toast(isNew ? 'Dossier créé (' + d.ref + ')' : 'Dossier mis à jour'); render();
  });
  fS.addEventListener('submit', function (e) {
    e.preventDefault();
    var titre = fS.titre.value.trim();
    if (!titre) { $('#err-sujet').textContent = 'Le titre du sujet est obligatoire.'; return; }
    var id = fS.id.value, s = id ? state.sujets.filter(function (x) { return x.id === id; })[0] : null, isNew = !s;
    if (!s) { s = { id: uid() }; state.sujets.push(s); }
    ['titre', 'dossierId', 'categorie', 'statut', 'priorite', 'assigne', 'echeance', 'notes'].forEach(function (k) { s[k] = fS[k].value.trim(); });
    var d = dossierById(s.dossierId); if (d && isNew) log(d, 'Sujet ajouté : ' + s.titre);
    save(); $('#dlg-sujet').close(); toast(isNew ? 'Sujet créé' : 'Sujet mis à jour'); render();
  });
  $$('dialog').forEach(function (dlg) { dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); });

  /* ---------- Actions ---------- */
  function setSujetStatut(s, st) {
    if (s.statut === st) return; var old = s.statut; s.statut = st;
    var d = dossierById(s.dossierId); if (d && st === 'Terminé') log(d, 'Sujet terminé : ' + s.titre);
    else if (d) log(d, 'Sujet « ' + s.titre + ' » : ' + old + ' → ' + st);
  }
  function setDossierStatut(d, st) {
    if (d.statut === st) return; var old = d.statut; d.statut = st; log(d, 'Statut : ' + old + ' → ' + st);
  }
  function sujetById(id) { return state.sujets.filter(function (x) { return x.id === id; })[0]; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]'); if (!t) return;
    var a = t.dataset.action, id = t.dataset.id;
    if (t.tagName === 'SELECT' || t.tagName === 'FORM' || (t.tagName === 'INPUT' && t.type === 'checkbox')) return;
    if (t.tagName === 'A') e.preventDefault();
    switch (a) {
      case 'new-dossier': openDossierForm(); break;
      case 'new-sujet': openSujetForm(); break;
      case 'new-sujet-for': openSujetForm(null, id); break;
      case 'edit-dossier': openDossierForm(id); break;
      case 'edit-sujet': openSujetForm(id); break;
      case 'close-dlg': t.closest('dialog').close(); break;
      case 'open': openDrawer(id); break;
      case 'close-drawer': closeDrawer(); break;
      case 'dmode': ui.dmode = t.dataset.mode; render(); break;
      case 'smode': ui.smode = t.dataset.mode; render(); break;
      case 'reset-d': ui.dq = ''; ui.df = { statut: '', secteur: '', resp: '', prio: '' }; render(); break;
      case 'reset-s': ui.sq = ''; ui.sf = { statut: '', dossier: '', resp: '', cat: '' }; render(); break;
      case 'goto-statut': ui.df = { statut: t.dataset.statut, secteur: '', resp: '', prio: '' }; ui.dq = ''; setView('dossiers'); break;
      case 'set-statut': var d1 = dossierById(ui.open); if (d1) { setDossierStatut(d1, t.dataset.statut); save(); render(); } break;
      case 'del-dossier':
        var d2 = dossierById(id), n = sujetsOf(id).length;
        if (d2 && confirm('Supprimer le dossier « ' + d2.titre + ' » ?' + (n ? '\n' + n + ' sujet(s) rattaché(s) seront aussi supprimés.' : ''))) {
          state.sujets = state.sujets.filter(function (s) { return s.dossierId !== id; });
          state.dossiers = state.dossiers.filter(function (x) { return x.id !== id; });
          save(); closeDrawer(); render(); toast('Dossier supprimé');
        } break;
      case 'examples': loadExamples(); toast('Exemples fictifs ajoutés'); render(); break;
      case 'export-json': download('africa-strategy-gestion-' + today() + '.json', JSON.stringify(state, null, 2), 'application/json'); break;
      case 'import-json': $('#file-import').click(); break;
      case 'export-csv-d': exportCsv('dossiers'); break;
      case 'export-csv-s': exportCsv('sujets'); break;
      case 'wipe':
        if (confirm('Effacer TOUS les dossiers et sujets de ce navigateur ?\nPensez à exporter une sauvegarde avant.') && confirm('Dernière confirmation : cette action est irréversible.')) {
          state = empty(); save(); closeDrawer(); render(); toast('Données effacées');
        } break;
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.open && !$('dialog[open]')) closeDrawer();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-action="open"]')) { e.preventDefault(); openDrawer(e.target.dataset.id); }
  });
  $('#scrim').addEventListener('click', closeDrawer);
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-view]'); if (b) setView(b.dataset.view); });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.filter) {
      var p = t.dataset.filter.split(':');
      (p[0] === 'd' ? ui.df : ui.sf)[p[1]] = t.value; render(); return;
    }
    if (t.dataset.action === 'toggle-s') { var s = sujetById(t.dataset.id); if (s) { setSujetStatut(s, t.checked ? 'Terminé' : 'À faire'); save(); render(); } }
    if (t.dataset.action === 'move-s') { var s2 = sujetById(t.dataset.id); if (s2) { setSujetStatut(s2, t.value); save(); render(); } }
    if (t.dataset.action === 'move-d') { var d = dossierById(t.dataset.id); if (d) { setDossierStatut(d, t.value); save(); render(); } }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-action="add-note"]'); if (!f) return;
    e.preventDefault();
    var txt = f.t.value.trim(), d = dossierById(ui.open); if (!txt || !d) return;
    log(d, txt); save(); render();
  });
  function bindSearch() {
    var dq = $('#dq'), sq = $('#sq');
    if (dq) dq.addEventListener('input', function () { ui.dq = dq.value; var pos = dq.selectionStart; renderDossiers(); var n = $('#dq'); n.focus(); n.setSelectionRange(pos, pos); });
    if (sq) sq.addEventListener('input', function () { ui.sq = sq.value; var pos = sq.selectionStart; renderSujets(); var n = $('#sq'); n.focus(); n.setSelectionRange(pos, pos); });
  }

  /* Glisser-déposer */
  var dragging = null;
  document.addEventListener('dragstart', function (e) {
    var c = e.target.closest && e.target.closest('[data-drag]'); if (!c) return;
    dragging = { kind: c.dataset.drag, id: c.dataset.id }; c.classList.add('is-drag');
    try { e.dataTransfer.setData('text/plain', c.dataset.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) {}
  });
  document.addEventListener('dragend', function () { dragging = null; $$('.is-drag, .is-over').forEach(function (n) { n.classList.remove('is-drag', 'is-over'); }); });
  document.addEventListener('dragover', function (e) {
    var col = e.target.closest && e.target.closest('[data-drop]'); if (!col || !dragging || col.dataset.drop !== dragging.kind) return;
    e.preventDefault(); $$('.is-over').forEach(function (n) { n.classList.remove('is-over'); }); col.classList.add('is-over');
  });
  document.addEventListener('drop', function (e) {
    var col = e.target.closest && e.target.closest('[data-drop]'); if (!col || !dragging || col.dataset.drop !== dragging.kind) return;
    e.preventDefault();
    if (dragging.kind === 'd') { var d = dossierById(dragging.id); if (d) setDossierStatut(d, col.dataset.statut); }
    else { var s = sujetById(dragging.id); if (s) setSujetStatut(s, col.dataset.statut); }
    dragging = null; save(); render();
  });

  /* ---------- Export / import ---------- */
  function download(name, content, type) {
    var blob = new Blob([content], { type: type + ';charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Fichier téléchargé : ' + name);
  }
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function exportCsv(kind) {
    var rows, head;
    if (kind === 'dossiers') {
      head = ['Référence', 'Intitulé', 'Client', 'Type de client', 'Pays', 'Secteur', 'Service', 'Statut', 'Priorité', 'Responsable', 'Ouverture', 'Échéance', 'Montant', 'Devise', 'Notes'];
      rows = state.dossiers.map(function (d) { return [d.ref, d.titre, d.client, d.typeClient, d.pays, d.secteur, d.service, d.statut, d.priorite, d.responsable, d.ouverture, d.echeance, d.montant, d.devise, d.notes]; });
    } else {
      head = ['Sujet', 'Dossier', 'Catégorie', 'Statut', 'Priorité', 'Assigné à', 'Échéance', 'Notes'];
      rows = state.sujets.map(function (s) { var d = dossierById(s.dossierId); return [s.titre, d ? d.ref : '', s.categorie, s.statut, s.priorite, s.assigne, s.echeance, s.notes]; });
    }
    var csv = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n');
    download('africa-strategy-' + kind + '-' + today() + '.csv', csv, 'text/csv');
  }
  $('#file-import').addEventListener('change', function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || !Array.isArray(s.dossiers) || !Array.isArray(s.sujets)) throw new Error('format');
        if (!confirm('Importer ' + s.dossiers.length + ' dossier(s) et ' + s.sujets.length + ' sujet(s) ?\nLes données actuelles seront remplacées.')) return;
        s.seq = s.seq || s.dossiers.length; state = s; save(); closeDrawer(); render(); toast('Import réussi');
      } catch (x) { alert('Ce fichier n\'est pas une sauvegarde valide de l\'espace de gestion.'); }
    };
    r.readAsText(f);
  });

  /* ---------- Démarrage ---------- */
  var h = location.hash.replace('#', '');
  setView(['dashboard', 'dossiers', 'sujets', 'donnees'].indexOf(h) > -1 ? h : 'dashboard');
})();
