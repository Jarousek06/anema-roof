/* =========================================================
   ANEMA ROOF — interakce
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. sticky nav ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. mobilní menu (vč. focus trapu) ---------- */
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');

  function menuItems() {
    return Array.prototype.slice.call(links.querySelectorAll('a'));
  }

  function setMenu(open) {
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    document.body.classList.toggle('menu-open', open);
    // obsah pod menu je mimo pořadí čtečky i tabulátoru
    var main = document.getElementById('main');
    if (main) { if (open) { main.setAttribute('inert', ''); } else { main.removeAttribute('inert'); } }
  }

  function closeMenu() { setMenu(false); }

  burger.addEventListener('click', function () {
    var open = !links.classList.contains('is-open');
    setMenu(open);
    if (open) {
      var first = menuItems()[0];
      if (first) first.focus();
    }
  });

  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (!links.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeMenu();
      burger.focus();
      return;
    }

    if (e.key !== 'Tab') return;

    // focus trap: burger + položky menu tvoří uzavřený okruh
    var focusables = [burger].concat(menuItems());
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // zavřít při přechodu na desktop
  var deskQuery = window.matchMedia('(min-width:1081px)');
  deskQuery.addEventListener('change', function (e) {
    if (e.matches && links.classList.contains('is-open')) closeMenu();
  });

  /* ---------- 3. reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');

  // ruční delay z data-d, jinak stagger podle pořadí v rodiči
  revealables.forEach(function (el) {
    var d = el.getAttribute('data-d');
    if (d === null) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) {
        return n.classList && n.classList.contains('reveal');
      });
      d = Math.min(sibs.indexOf(el), 6);
    }
    el.style.setProperty('--d', d);
  });

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealables.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- 4. aktivní krok v postupu ----------
     Pozor: vlastní třída is-active — is-in patří reveal animaci
     a nesmí se odebírat, jinak krok zmizí. */
  var steps = document.querySelectorAll('.step');
  if (steps.length && !reduced && 'IntersectionObserver' in window) {
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-38% 0px -38% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  }

  /* ---------- 5. scrollspy ---------- */
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 6. 3D tilt karet ---------- */
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      var raf = 0, rect = null;

      function apply(e) {
        raf = 0;
        if (!rect) return;
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        card.style.transform =
          'perspective(1400px) rotateY(' + ((x - 0.5) * 7).toFixed(2) + 'deg) ' +
          'rotateX(' + ((0.5 - y) * 5).toFixed(2) + 'deg) translateZ(6px)';
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      }

      card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () { apply(e); });
      });
      card.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        rect = null;
        card.style.transform = '';
      });
    });
  }

  /* ---------- 7. mobilní akční lišta ---------- */
  var actionbar = document.getElementById('actionbar');
  if (actionbar) {
    document.body.classList.add('has-actionbar');

    var hero = document.getElementById('hero');
    var contact = document.getElementById('kontakt');

    function syncActionbar() {
      // objeví se po odscrollování hera, schová se nad formulářem
      var pastHero = hero ? window.scrollY > hero.offsetHeight * 0.55 : window.scrollY > 400;
      var atForm = contact
        ? contact.getBoundingClientRect().top < window.innerHeight * 0.75
        : false;
      actionbar.classList.toggle('is-visible', pastHero && !atForm);
    }

    syncActionbar();
    window.addEventListener('scroll', syncActionbar, { passive: true });
    window.addEventListener('resize', syncActionbar, { passive: true });
  }

  /* ---------- 8. stav odesílání formuláře ---------- */
  var form = document.querySelector('.form');
  if (form) {
    var submitBtn = document.getElementById('submitBtn');
    var status = document.getElementById('formStatus');

    form.addEventListener('submit', function () {
      if (!form.checkValidity()) return;
      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        var label = submitBtn.querySelector('.btn__label');
        if (label) label.textContent = 'Odesílám…';
      }
    });

    form.addEventListener('invalid', function (e) {
      var field = e.target;
      if (status) {
        status.textContent = 'Zkontrolujte prosím zvýrazněná pole.';
        status.classList.add('is-error');
      }
      if (!form.querySelector(':focus')) field.focus();
    }, true);
  }

  /* ---------- 9. rok v patičce ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 10. parallax (hero + rámy) ---------- */
  if (!reduced) {
    var heroMedia = document.querySelector('.hero__media');
    var heroContent = document.querySelector('.hero__content');
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var ticking = false;

    function paint() {
      ticking = false;
      var y = window.scrollY;

      if (heroMedia && y < window.innerHeight * 1.2) {
        heroMedia.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(' + (1 + y * 0.00006).toFixed(4) + ')';
        if (heroContent) {
          heroContent.style.transform = 'translate3d(0,' + (y * -0.06).toFixed(1) + 'px,0)';
          heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.85)).toFixed(3);
        }
      }

      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        var amt = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        el.style.translate = '0 ' + (-mid * amt).toFixed(1) + 'px';
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    paint();
  }
})();
