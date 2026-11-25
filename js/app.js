/* Atlas Quest — app shell: navigation, Map Room, gazetteer, passport bindings, themes,
   sounds, toasts, the compass and one well-hidden sea serpent. */
(function () {
  'use strict';
  var AQ = window.AQ = window.AQ || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = AQ.passport.esc, D = AQ.data, P = AQ.profile;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentView = 'map', worldMap = null, lastPin = null, gzBuilt = false;

  // ---------- low-power detection ----------
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  if (lowPower || reduced) document.body.classList.add('lowfx');

  // ---------- toast ----------
  var toastT = 0;
  function toast(msg) {
    var t = $('toast'); t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  // ---------- theme ----------
  function setTheme(th) {
    document.body.setAttribute('data-theme', th);
    try { localStorage.setItem('atlasquest.theme', th); } catch (e) { /* ignore */ }
    var b = $('btnTheme');
    b.setAttribute('aria-label', th === 'lamplight' ? 'Switch to parchment (day) theme' : 'Switch to lamplight (night) theme');
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    Array.prototype.forEach.call(metas, function (m) { m.setAttribute('content', th === 'lamplight' ? '#1d1610' : '#e9d8b4'); });
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('atlasquest.theme'); } catch (e) { savedTheme = null; }
  setTheme(savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'lamplight' : 'parchment'));

  // ---------- sound ----------
  function syncSound() {
    var on = AQ.audio.isOn(), b = $('btnSound');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Sound is on — turn sound off' : 'Sound is off — turn sound on');
    b.classList.toggle('on', on);
  }
  syncSound();
  document.addEventListener('pointerdown', function unlockOnce() { AQ.audio.unlock(); document.removeEventListener('pointerdown', unlockOnce); });
  document.addEventListener('keydown', function unlockKey() { AQ.audio.unlock(); document.removeEventListener('keydown', unlockKey); });

  // ---------- views ----------
  var VIEWS = ['map', 'quests', 'passport', 'gazetteer', 'about'];
  function showView(v, fromHash) {
    if (VIEWS.indexOf(v) < 0) v = 'map';
    currentView = v;
    VIEWS.forEach(function (k) {
      var s = $('view-' + k), on = k === v;
      s.hidden = !on; s.classList.toggle('is-active', on);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.navbtn'), function (b) {
      if (b.getAttribute('data-view') === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    closeNav();
    if (v === 'passport') renderPassport();
    if (v === 'gazetteer') buildGazetteer();
    if (v === 'quests') renderQuests();
    if (!fromHash && location.hash !== '#' + v) { try { history.pushState(null, '', '#' + v); } catch (e) { location.hash = v; } }
    window.scrollTo(0, 0);
    AQ.audio.play('page');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-view]') : null;
    if (t) { e.preventDefault(); showView(t.getAttribute('data-view')); }
  });
  window.addEventListener('popstate', function () { showView((location.hash || '#map').slice(1), true); });

  // mobile nav
  function closeNav() { $('mainNav').classList.remove('open'); $('navToggle').setAttribute('aria-expanded', 'false'); $('navToggle').setAttribute('aria-label', 'Open navigation'); }
  $('navToggle').addEventListener('click', function () {
    var open = !$('mainNav').classList.contains('open');
    $('mainNav').classList.toggle('open', open);
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  $('btnSound').addEventListener('click', function () {
    AQ.audio.set(!AQ.audio.isOn()); syncSound();
    if (AQ.audio.isOn()) { AQ.audio.play('correct'); toast('Sound on. Mind the foghorn.'); } else toast('Sound off. Silent running, captain.');
  });
  $('btnTheme').addEventListener('click', function () {
    var th = document.body.getAttribute('data-theme') === 'lamplight' ? 'parchment' : 'lamplight';
    setTheme(th); AQ.audio.play('click');
    toast(th === 'lamplight' ? 'Lamp lit. Moths have been notified.' : 'Curtains open. Good morning, explorer.');
  });
  $('travellerChip').addEventListener('click', function () { showView('passport'); });

  // ---------- compass ----------
  (function ticks() {
    var g = $('compassTicks'), i, out = '';
    for (i = 0; i < 72; i++) {
      var a = i * 5 * Math.PI / 180, r1 = 86, r2 = i % 6 === 0 ? 78 : 82;
      out += '<line x1="' + (100 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (100 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (100 + Math.sin(a) * r2).toFixed(1) + '" y2="' + (100 - Math.cos(a) * r2).toFixed(1) + '" stroke="currentColor" stroke-width="' + (i % 6 === 0 ? 1.4 : .6) + '"/>';
    }
    g.innerHTML = out;
  })();
  var needleDeg = 0;
  function pointNeedle(deg, caption) {
    // shortest rotation
    var diff = ((deg - needleDeg) % 360 + 540) % 360 - 180;
    needleDeg += diff;
    $('compassNeedle').style.transform = 'rotate(' + needleDeg.toFixed(1) + 'deg)';
    if (caption) $('compassCaption').textContent = caption;
  }
  function cardinal(b) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8]; }

  var compassTaps = [];
  $('compass').addEventListener('click', function () {
    var now = Date.now();
    compassTaps = compassTaps.filter(function (t) { return now - t < 2500; }); compassTaps.push(now);
    AQ.audio.play('click');
    if (compassTaps.length >= 7) { compassTaps = []; wakeSerpent(); return; }
    var c = D.countries[Math.floor(Math.random() * D.countries.length)];
    var from = lastPin || D.byIso.GB;
    var b = AQ.map.bearing(from.lat, from.lon, c.lat, c.lon);
    pointNeedle(b, 'Bearing ' + Math.round(b) + '° ' + cardinal(b) + ' → ' + c.name);
    $('compass').classList.remove('wobble'); void $('compass').offsetWidth; $('compass').classList.add('wobble');
  });

  function wakeSerpent() {
    document.body.classList.add('serpent-awake');
    $('compass').classList.add('spin');
    setTimeout(function () { $('compass').classList.remove('spin'); }, 1600);
    AQ.audio.play('splash');
    if (P.award('dragons')) { stampFx('dragons'); toast('<strong>Here Be Dragons!</strong> A secret stamp for your passport. The serpent says hello.'); refresh(); }
    else toast('The sea serpent waves a fin. It remembers you.');
  }

  // ---------- Map Room ----------
  function initMap() {
    worldMap = AQ.map.create($('mapWrap'), {
      label: 'Stylised world map with a pin for each of 195 countries',
      onTap: function (pt) {
        if (Math.abs(pt.lon + 128) < 9 && Math.abs(pt.lat + 44) < 7 && !pt.iso) { wakeSerpent(); return; }
        if (pt.iso) selectCountry(D.byIso[pt.iso]);
      }
    });
    worldMap.setPins(D.countries, true);
    $('zoomIn').addEventListener('click', function () { worldMap.zoomIn(); });
    $('zoomOut').addEventListener('click', function () { worldMap.zoomOut(); });
    $('zoomReset').addEventListener('click', function () { worldMap.reset(); });
  }
  function flagOrMono(c, cls) {
    return AQ.flags.has(c.iso) ? '<span class="' + cls + '">' + AQ.flags.svg(c.iso, 'Flag of ' + c.name) + '</span>' :
      '<span class="' + cls + ' mono" title="Flag not drawn (detailed emblem)">' + esc(c.iso) + '</span>';
  }
  function factRows(c) {
    return '<dl class="facts">' +
      '<div><dt>Capital</dt><dd>' + (c.capital ? esc(c.capital) : '<span class="muted">omitted*</span>') + '</dd></div>' +
      '<div><dt>Continent</dt><dd>' + esc(D.continents[c.cont]) + (c.trans ? ' <span class="muted">(transcontinental)</span>' : '') + '</dd></div>' +
      '<div><dt>Currency</dt><dd>' + (c.currency ? esc(c.currency) : '<span class="muted">omitted*</span>') + '</dd></div></dl>' +
      (c.note ? '<p class="note">* ' + esc(c.note) + '</p>' : '');
  }
  function selectCountry(c, noFly) {
    if (!c) return;
    worldMap.highlight(c);
    if (!noFly && lastPin && lastPin.iso !== c.iso) {
      worldMap.fly(lastPin, c);
      var b = AQ.map.bearing(lastPin.lat, lastPin.lon, c.lat, c.lon);
      var km = Math.round(AQ.map.haversine(lastPin.lat, lastPin.lon, c.lat, c.lon));
      pointNeedle(b, lastPin.name + ' → ' + c.name + ': ' + km.toLocaleString() + ' km ' + cardinal(b));
    }
    lastPin = c;
    $('mapInfo').innerHTML = '<div class="infocard">' + flagOrMono(c, 'infoflag') +
      '<div><h3>' + esc(c.name) + '</h3>' + factRows(c) + '</div></div>';
    AQ.audio.play('click');
  }

  AQ.app = {
    toast: toast, refresh: refresh, stampFx: stampFx,
    onTravel: function (prev, cur) {
      if (!worldMap || !cur) return;
      if (prev && prev.iso !== cur.iso) {
        worldMap.fly(prev, cur);
        var b = AQ.map.bearing(prev.lat, prev.lon, cur.lat, cur.lon);
        pointNeedle(b, prev.name + ' → ' + cur.name);
      }
      lastPin = cur;
    }
  };

  // ---------- Expeditions ----------
  function renderQuests() {
    var p = P.active(), today = P.dateKey(), done = p.daily[today], live = P.liveStreak(p);
    var d = new Date();
    var dateStr = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('dailyCard').innerHTML =
      '<div class="daily-stamp" aria-hidden="true"><span>' + d.getDate() + '</span><small>' + d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() + '</small></div>' +
      '<div class="daily-copy"><p class="kicker">Today\'s dispatch · ' + esc(dateStr) + '</p>' +
      '<h3>Daily Challenge</h3><p>' + (done ? 'Logged: <strong>' + done.correct + '/' + done.total + '</strong> for ' + done.score + ' pts. Replays are practice only — no peeking at tomorrow.' :
        'Ten mixed questions, the same for every traveller today.') + ' ' + (live ? '🔥 ' + live + '-day streak.' : 'Start a streak!') + '</p></div>' +
      '<button type="button" class="btn wax" data-mode="daily"><span>' + (done ? 'Practise again' : 'Open today\'s dispatch') + '</span></button>';
    $('modeGrid').innerHTML = AQ.MODES.filter(function (m) { return m.id !== 'daily'; }).map(function (m, i) {
      var b = p.best[m.id];
      var count = m.id === 'flags' ? AQ.quiz.pools.flag.length + ' drawn flags' : m.id === 'capitals' ? AQ.quiz.pools.capital.length + ' capitals' :
        m.id === 'continents' ? AQ.quiz.pools.continent.length + ' countries' : m.id === 'currencies' ? AQ.quiz.pools.currency.length + ' countries' :
        m.id === 'find' ? '195 countries' : 'mixed bag';
      return '<article class="modecard" style="--i:' + i + '">' +
        '<div class="seal" aria-hidden="true"><span>' + m.seal + '</span></div>' +
        '<p class="kicker">' + esc(m.kicker) + ' · ' + count + '</p><h3>' + esc(m.title) + '</h3><p>' + esc(m.desc) + '</p>' +
        '<p class="joke">' + esc(m.joke) + '</p>' +
        '<div class="modefoot"><span class="best">' + (b ? 'Best: <strong>' + b.score + '</strong> pts' : 'Uncharted') + '</span>' +
        '<button type="button" class="btn small wax" data-mode="' + m.id + '"><span>Set sail</span></button></div></article>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-mode]') : null;
    if (t) { e.preventDefault(); AQ.quiz.start(t.getAttribute('data-mode')); }
  });
  $('btnDailyHero').addEventListener('click', function () { AQ.quiz.start('daily'); });
  $('qNext').addEventListener('click', function () { AQ.quiz.next(); });
  $('qQuit').addEventListener('click', function () { AQ.quiz.quit(); });
  $('btnAgain').addEventListener('click', function () { AQ.quiz.again(); });
  $('btnToPassport').addEventListener('click', function () { $('resultModal').hidden = true; showView('passport'); });
  $('btnCloseResult').addEventListener('click', function () { $('resultModal').hidden = true; renderQuests(); });

  // ---------- Passport ----------
  var passEls = { profileList: $('profileList'), passIdentity: $('passIdentity'), stampGrid: $('stampGrid'), stampCount: $('stampCount'),
    bestTable: $('bestTable'), streakInfo: $('streakInfo'), streakCal: $('streakCal') };
  function renderPassport() { AQ.passport.render(passEls); }
  $('profileList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pid]'); if (!b) return;
    P.setActive(b.getAttribute('data-pid')); AQ.audio.play('page'); refresh();
    toast('Now travelling as <strong>' + esc(P.active().name) + '</strong>.');
  });
  $('profileList').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var btns = Array.prototype.slice.call(this.querySelectorAll('[data-pid]')), i = btns.indexOf(document.activeElement);
    if (i < 0) return; e.preventDefault();
    var n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]; n.click();
    var again = this.querySelector('[data-pid="' + n.getAttribute('data-pid') + '"]'); if (again) again.focus();
  });
  $('newProfileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('newProfileName').value.trim(); if (!name) return;
    if (P.all().length >= 12) { toast('Twelve travellers is a crew. Revoke a passport first.'); return; }
    P.create(name); $('newProfileName').value = ''; AQ.audio.play('stamp'); refresh();
    toast('Passport issued to <strong>' + esc(name) + '</strong>. Bon voyage!');
  });
  $('stampGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-stamp]'); if (!b) return;
    var s = P.stamp(b.getAttribute('data-stamp')), d = P.active().stamps[s.id];
    toast(d ? '<strong>' + esc(s.title) + '</strong> — ' + esc(s.desc) + ' (' + AQ.passport.fmtDate(d) + ')' : (s.secret ? 'A secret stamp. Try poking things on the Map Room page…' : '<strong>' + esc(s.title) + '</strong>: ' + esc(s.desc)));
  });
  $('btnExportPng').addEventListener('click', function () {
    AQ.passport.exportPNG(function (ok) {
      if (!ok) { toast('Could not draw the passport here — try another browser.'); return; }
      AQ.audio.play('stamp');
      if (P.award('souvenir')) { stampFx('souvenir'); refresh(); }
      toast('Passport PNG exported. Frame it. Show your grandchildren.');
    });
  });
  $('btnExportJson').addEventListener('click', function () {
    var blob = new Blob([P.exportJSON()], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'atlasquest-travellers-' + P.dateKey() + '.json'; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 800);
    toast('Backup saved. Keep it somewhere drier than the Titanic.');
  });
  $('btnImportJson').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { var n = P.importJSON(String(rd.result)); refresh(); toast('Restored ' + n + ' traveller' + (n === 1 ? '' : 's') + '. Welcome back aboard.'); }
      catch (err) { toast('That file is not an Atlas Quest backup. (' + esc(err.message) + ')'); }
    };
    rd.readAsText(f); this.value = '';
  });
  $('btnRenameProfile').addEventListener('click', function () {
    var p = P.active(), n = window.prompt('New name for this traveller:', p.name);
    if (n && n.trim()) { P.rename(p.id, n.trim()); refresh(); toast('Deed poll filed. Hello, ' + esc(n.trim()) + '.'); }
  });
  $('btnDeleteProfile').addEventListener('click', function () {
    var p = P.active();
    if (window.confirm('Revoke the passport of "' + p.name + '"? All stamps, scores and streaks for this traveller will be lost.')) {
      P.remove(p.id); refresh(); toast('Passport revoked. Customs sheds a single tear.');
    }
  });

  // ---------- Gazetteer ----------
  function norm(s) { return String(s || '').toLowerCase().normalize ? String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : String(s || '').toLowerCase(); }
  function buildGazetteer() {
    if (!gzBuilt) {
      gzBuilt = true;
      $('gzList').innerHTML = D.countries.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (c) {
        return '<li class="gzitem" data-iso="' + c.iso + '" data-q="' + esc(norm(c.name + ' ' + (c.capital || '') + ' ' + (c.currency || '') + ' ' + c.iso)) + '" data-cont="' + c.cont + '">' +
          flagOrMono(c, 'gzflag') + '<div class="gzbody"><h3>' + esc(c.name) + '</h3>' + factRows(c) + '</div>' +
          '<button type="button" class="btn small ghost" data-show="' + c.iso + '" aria-label="Show ' + esc(c.name) + ' on the map">Show on map</button></li>';
      }).join('');
    }
    filterGz();
  }
  function filterGz() {
    var q = norm($('gzSearch').value.trim()), cont = $('gzCont').value, n = 0;
    Array.prototype.forEach.call($('gzList').children, function (li) {
      var ok = (!q || li.getAttribute('data-q').indexOf(q) >= 0) && (!cont || li.getAttribute('data-cont') === cont);
      li.hidden = !ok; if (ok) n++;
    });
    $('gzCount').textContent = n ? n + ' of 195 countries' : 'No countries match. Either it\'s a micronation, or a typo.';
  }
  $('gzSearch').addEventListener('input', filterGz);
  $('gzCont').addEventListener('change', filterGz);
  $('gzList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-show]'); if (!b) return;
    var c = D.byIso[b.getAttribute('data-show')];
    showView('map');
    selectCountry(c); worldMap.focusOn(c, 3);
    setTimeout(function () { $('mapWrap').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }, 30);
  });

  // ---------- stamp FX ----------
  function stampFx(id) {
    var s = P.stamp(id), fx = $('stampFx'); if (!s) return;
    fx.innerHTML = '<div class="fxstamp">' + AQ.passport.stampSVG(s, P.active().stamps[id] || P.dateKey(), true) + '</div>';
    fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    setTimeout(function () { fx.classList.remove('go'); fx.innerHTML = ''; }, 2200);
  }

  // ---------- refresh ----------
  function refresh() {
    var p = P.active(), live = P.liveStreak(p);
    $('travellerName').textContent = p.name;
    $('travellerDot').style.background = p.color;
    $('heroStreak').textContent = live ? '🔥 ' + p.name + ' is on a ' + live + '-day streak. Don\'t let the fire go out.' :
      (p.daily[P.dateKey()] ? 'Today\'s dispatch is logged. Tomorrow brings new winds.' : 'No streak yet. Every legend starts with day one.');
    if (currentView === 'passport') renderPassport();
    if (currentView === 'quests') renderQuests();
  }

  // ---------- global keys ----------
  var typed = '';
  document.addEventListener('keydown', function (e) {
    if (AQ.quiz.active()) { AQ.quiz.keydown(e); return; }
    if (e.key === 'Escape') {
      if (!$('resultModal').hidden) { $('resultModal').hidden = true; renderQuests(); return; }
      closeNav();
    }
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key && e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-12);
      if (/fogg$/.test(typed)) { AQ.audio.play('horn'); toast('“The unforeseen does not exist.” — Phileas Fogg, in Jules Verne\'s <em>Around the World in Eighty Days</em> (1872). Try the 80-second mode.'); }
      if (/dragons$/.test(typed)) wakeSerpent();
    }
  });

  // ---------- footer jokes ----------
  var JOKES = ['Map not to scale. Neither are our ambitions.', 'Why did the map blush? It saw the Mediterranean’s bottom.', 'I would tell you a joke about the Equator, but it goes around a lot.',
    'Geography teachers have the best excuses: “I got lost in my work.”', 'Our compass points north. Our sense of humour points south.', 'Parallels never meet. Meridians all meet at the poles — that’s where the gossip happens.'];
  var ji = 0;
  setInterval(function () { if (document.hidden) return; ji = (ji + 1) % JOKES.length; $('footJoke').textContent = JOKES[ji]; }, 12000);

  // ---------- boot ----------
  initMap();
  refresh();
  showView((location.hash || '#map').slice(1), true);
  if (P.isMemoryOnly()) toast('Heads up: this browser is blocking storage, so progress will not be saved.');
  setTimeout(function () { document.body.classList.add('ready'); }, 30);
})();
