(function () {
  'use strict';

  // En-tête : fond au défilement
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menu mobile
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function closeNav() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });

  // Apparition au défilement
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Lien actif dans la navigation
  var links = nav.querySelectorAll('a[href^="#"]:not(.btn)');
  var sections = Array.prototype.map.call(links, function (l) { return document.querySelector(l.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }

  // Filtres de la galerie
  var filters = document.querySelectorAll('.filter');
  var items = document.querySelectorAll('.g-item');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      items.forEach(function (it) {
        var show = f === 'all' || it.dataset.cat === f;
        it.classList.toggle('is-hidden', !show);
        it.classList.remove('is-in');
        if (show) { void it.offsetWidth; it.classList.add('is-in'); }
      });
    });
  });

  // Visionneuse
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('figcaption');
  var group = [];
  var idx = 0;

  function visible(list) {
    return Array.prototype.filter.call(list, function (f) { return !f.classList.contains('is-hidden'); });
  }
  function show(i) {
    idx = (i + group.length) % group.length;
    var fig = group[idx];
    var img = fig.querySelector('img');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    var cap = fig.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent : img.alt;
  }
  function open(list, fig) {
    group = visible(list);
    show(group.indexOf(fig));
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  [document.querySelectorAll('.g-item'),
   document.querySelectorAll('.mini-gallery figure'),
   document.querySelectorAll('.siege__grid figure')].forEach(function (list) {
    list.forEach(function (fig) {
      fig.addEventListener('click', function () { open(list, fig); });
    });
  });

  lb.querySelector('.lightbox__close').addEventListener('click', close);
  lb.querySelector('.lightbox__prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  lb.querySelector('.lightbox__next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  // Formulaire : ouvre la messagerie avec la demande pré-remplie
  var form = document.getElementById('contact-form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var valid = f.value.trim() !== '' && (f.type !== 'email' || /\S+@\S+\.\S+/.test(f.value));
      f.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    var note = document.getElementById('form-note');
    if (!ok) { note.textContent = 'Merci de compléter les champs obligatoires.'; return; }
    var d = new FormData(form);
    var subject = 'Demande de devis — ' + d.get('projet');
    var body = 'Nom : ' + d.get('nom') + '\nTéléphone : ' + d.get('tel') + '\nCourriel : ' + d.get('email') +
      '\nType de projet : ' + d.get('projet') + '\n\n' + d.get('message');
    window.location.href = 'mailto:' + (form.dataset.mail || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Merci ! Votre messagerie va s\'ouvrir pour finaliser l\'envoi.';
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
