// Kanav Agarwal — portfolio behavior. One file for every page; each feature
// checks for its elements first and does nothing if they aren't there.

(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ---- footer year ---------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- header border once the page scrolls ----------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- name decode: letters scramble, then resolve left to right -------- */
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    if (reduced) return;
    var finalText = el.textContent;
    var glyphs = '!<>-_\\/[]{}=+*^?#01';
    var frame = 0, totalFrames = 38;
    el.setAttribute('aria-label', finalText);
    function step() {
      var progress = frame / totalFrames;
      var out = '';
      for (var i = 0; i < finalText.length; i++) {
        var ch = finalText[i];
        if (ch === ' ' || i / finalText.length < progress) out += ch;
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(function () { setTimeout(step, 22); });
      else el.textContent = finalText;
    }
    step();
  });

  /* ---- typewriter role line ------------------------------------------- */
  var tw = document.querySelector('[data-typewriter]');
  if (tw) {
    var roles = JSON.parse(tw.getAttribute('data-typewriter'));
    if (reduced) {
      tw.textContent = roles[0];
    } else {
      var r = 0, c = 0, deleting = false;
      (function tick() {
        var full = roles[r];
        c += deleting ? -1 : 1;
        tw.textContent = full.slice(0, c);
        if (!deleting && c === full.length) { deleting = true; return setTimeout(tick, 1600); }
        if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; return setTimeout(tick, 350); }
        setTimeout(tick, deleting ? 28 : 55);
      })();
    }
  }

  /* ---- photo: short re-glitch on hover --------------------------------- */
  var photo = document.querySelector('.photo-frame');
  if (photo && !reduced) {
    var base = photo.querySelector('.base');
    base.addEventListener('animationend', function (e) {
      if (e.animationName === 'photo-tone') photo.classList.remove('reveal');
      if (e.animationName === 'jitter-base') photo.classList.remove('jitter');
    });
    photo.addEventListener('mouseenter', function () {
      if (photo.classList.contains('reveal') || photo.classList.contains('jitter')) return;
      photo.classList.add('jitter');
    });
  }

  /* ---- card spotlight follows the cursor ------------------------------ */
  if (canHover) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---- education timeline: tap/Enter toggles details on touch/keyboard - */
  document.querySelectorAll('.edu-card').forEach(function (card) {
    if (card.closest('.edu-row').classList.contains('current')) return;
    function toggle() { card.classList.toggle('open'); }
    card.addEventListener('click', function () { if (!canHover) toggle(); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ---- copy email -------------------------------------------------------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectText(btn); });
      } else {
        selectText(btn);
      }
    });
  });
  function selectText(btn) {
    var target = btn.parentElement.querySelector('.value');
    if (!target) return;
    var range = document.createRange();
    range.selectNodeContents(target);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ---- contact form: no backend, so hand off to the visitor's email app -- */
  var form = document.querySelector('form.msg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#msg-name').value.trim();
      var from = form.querySelector('#msg-email').value.trim();
      var body = form.querySelector('#msg-message').value.trim();
      var note = form.querySelector('.form-note');
      var to = form.getAttribute('data-to');
      var href = 'mailto:' + to +
        '?subject=' + encodeURIComponent('Hello from ' + (name || 'your website')) +
        '&body=' + encodeURIComponent(body + (from ? '\n\n— ' + name + ' (' + from + ')' : ''));
      note.textContent = 'Opening your email app with this message filled in. If nothing opens, email ' + to + ' directly.';
      window.location.href = href;
    });
  }

  /* ---- cursor-reactive dot grid --------------------------------------- */
  var canvas = document.getElementById('bg-grid');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var SPACING = 30, RADIUS = 150;
    var w = 0, h = 0, mouse = { x: -9999, y: -9999 }, energy = 0, raf = null;

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var offX = (w % SPACING) / 2, offY = (h % SPACING) / 2;
      for (var x = offX; x <= w; x += SPACING) {
        for (var y = offY; y <= h; y += SPACING) {
          var dx = x - mouse.x, dy = y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var t = d < RADIUS ? (1 - d / RADIUS) * energy : 0;
          var px = x, py = y;
          if (t > 0) { px += (dx / (d || 1)) * t * 6; py += (dy / (d || 1)) * t * 6; }
          ctx.fillStyle = 'rgba(74,222,128,' + (0.09 + t * 0.6).toFixed(3) + ')';
          var s = 1.1 + t * 1.6;
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
    }

    function loop() {
      draw();
      energy *= 0.94;
      if (energy > 0.01) raf = requestAnimationFrame(loop);
      else { energy = 0; draw(); raf = null; }
    }

    window.addEventListener('resize', resize);
    if (!reduced && canHover) {
      window.addEventListener('pointermove', function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
        energy = 1;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
    resize();
  }
})();
