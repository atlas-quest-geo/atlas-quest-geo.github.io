/* Atlas Quest — quiz engine: flags, capitals, continents, find-the-region, currencies,
   "Around the World in 80 Seconds" and the date-seeded daily challenge. */
(function () {
  'use strict';
  var AQ = window.AQ = window.AQ || {};
  var D = AQ.data, esc = AQ.passport.esc;

  AQ.MODES = [
    { id: 'flags', title: 'Flags of the World', kicker: 'Vexillology voyage', seal: '⚑', desc: 'Name the nation behind the bunting. Only flags we can draw faithfully make the cut.', joke: 'Flags: the original profile pictures.' },
    { id: 'capitals', title: 'Capital Cities', kicker: 'Grand tour', seal: '★', desc: 'Capitals of countries — and sometimes the other way round, to keep you honest.', joke: 'Capital punishment: confusing Sydney with Canberra.' },
    { id: 'continents', title: 'Continents', kicker: 'Big-picture voyage', seal: '◐', desc: 'Which continent does each country call home? Transcontinental nations sit this one out.', joke: 'Europe and Asia have been arguing about the Urals for centuries.' },
    { id: 'find', title: 'Find the Region', kicker: 'Cartographer\'s trial', seal: '✣', desc: 'A blank map, a country name and your best guess. Points shrink with every kilometre.', joke: 'Close only counts in horseshoes, hand grenades and this mode.' },
    { id: 'currencies', title: 'Currencies', kicker: 'Bureau de change', seal: '¤', desc: 'Match each country to the money in its pockets. No commission charged.', joke: 'We tried to exchange jokes for euros. Rate was terrible.' },
    { id: 'eighty', title: 'Around the World in 80 Seconds', kicker: 'Against the clock', seal: '◷', desc: 'Rapid-fire mixed questions. Combos multiply. Mr Fogg took 80 days; you have 80 seconds.', joke: 'Hot-air balloon not included.' },
    { id: 'daily', title: 'Daily Challenge', kicker: 'Today\'s dispatch', seal: '☀', desc: 'Ten mixed questions, identical for everyone today (seeded by date). Keep the streak alive.', joke: 'Same questions for everyone. Spoilers are a crime under maritime law.' }
  ];
  var MODE_BY_ID = {};
  AQ.MODES.forEach(function (m) { MODE_BY_ID[m.id] = m; });

  var SIZE = { RU: 2500, CA: 2000, US: 1800, CN: 1800, BR: 1700, AU: 1800, IN: 1100, AR: 1100, KZ: 1000, DZ: 900, CD: 900, SA: 800, MX: 900,
    ID: 1500, SD: 700, LY: 700, IR: 700, MN: 800, PE: 600, TD: 600, NE: 600, AO: 600, ML: 600, ZA: 600, CO: 500, ET: 500, BO: 500, MR: 500,
    EG: 500, TZ: 450, NG: 450, VE: 450, NA: 450, MZ: 500, PK: 500, TR: 500, CL: 1200, ZM: 400, MM: 500, AF: 400, SO: 500, CF: 400, SS: 400,
    UA: 400, MG: 450, BW: 350, KE: 350, FR: 400, YE: 350, TH: 400, ES: 400, TM: 350, CM: 350, PG: 400, SE: 500, UZ: 350, MA: 400, IQ: 300,
    PY: 300, ZW: 300, JP: 500, DE: 300, CG: 300, FI: 400, VN: 500, MY: 500, NO: 600, CI: 250, PL: 250, OM: 300, IT: 400, PH: 450, EC: 250,
    BF: 250, NZ: 600, GA: 250, GN: 250, GB: 400, GH: 200, RO: 250, LA: 350, GY: 250, BY: 250, KG: 250, SY: 200, KH: 200, UY: 200,
    TN: 200, NP: 250, TJ: 200, GR: 300, KP: 200, MW: 300, ER: 250, GL: 0 };

  var all = D.countries;
  var pools = {
    flag: all.filter(function (c) { return AQ.flags.has(c.iso); }),
    capital: all.filter(function (c) { return c.capital; }),
    continent: all.filter(function (c) { return !c.trans; }),
    currency: all.filter(function (c) { return c.currency; }),
    find: all
  };

  function shuffle(a, rng) { var i, j, t; for (i = a.length - 1; i > 0; i--) { j = Math.floor(rng() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pickDistinct(cands, n, rng, key, exclude) {
    var seen = {}, out = [], list = shuffle(cands.slice(), rng), i;
    seen[exclude] = 1;
    for (i = 0; i < list.length && out.length < n; i++) { var v = key(list[i]); if (!seen[v]) { seen[v] = 1; out.push(v); } }
    return out;
  }
  function nearFirst(c, pool, rng) {
    // distractors: half from the same continent (harder), half anywhere
    var same = pool.filter(function (x) { return x.cont === c.cont && x.iso !== c.iso; });
    var other = pool.filter(function (x) { return x.iso !== c.iso; });
    return shuffle(same, rng).slice(0, 6).concat(shuffle(other, rng).slice(0, 10));
  }

  function makeQ(type, c, rng) {
    var q = { type: type, country: c, options: [], visual: '' }, opts, right;
    if (type === 'flag') {
      q.prompt = 'Whose flag is this?';
      q.visual = '<div class="flagframe">' + AQ.flags.svg(c.iso, 'Mystery flag') + '</div>';
      right = c.name;
      opts = pickDistinct(nearFirst(c, pools.flag, rng), 3, rng, function (x) { return x.name; }, right);
      q.answer = right; q.after = AQ.flags.note(c.iso);
    } else if (type === 'capital') {
      if (rng() < 0.65) {
        q.prompt = 'What is the capital of <strong>' + esc(c.name) + '</strong>?';
        right = c.capital;
        opts = pickDistinct(nearFirst(c, pools.capital, rng), 3, rng, function (x) { return x.capital; }, right);
      } else {
        q.prompt = '<strong>' + esc(c.capital) + '</strong> is the capital of…';
        right = c.name;
        opts = pickDistinct(nearFirst(c, pools.capital, rng), 3, rng, function (x) { return x.name; }, right);
      }
      q.answer = right; q.after = c.note;
      q.visual = '<div class="postcard-mini" aria-hidden="true"><span>✉</span></div>';
    } else if (type === 'continent') {
      q.prompt = 'On which continent is <strong>' + esc(c.name) + '</strong>?';
      right = D.continents[c.cont];
      opts = Object.keys(D.continents).map(function (k) { return D.continents[k]; }).filter(function (n) { return n !== right; });
      q.answer = right; q.fixedOrder = true;
      q.visual = '<div class="globe-mini" aria-hidden="true"></div>';
    } else if (type === 'currency') {
      q.prompt = 'Which currency is used in <strong>' + esc(c.name) + '</strong>?';
      right = c.currency;
      opts = pickDistinct(nearFirst(c, pools.currency, rng), 3, rng, function (x) { return x.currency; }, right);
      q.answer = right; q.after = c.note && /currency|euro|dollar|lev|kuna|balboa/i.test(c.note) ? c.note : '';
      q.visual = '<div class="coin-mini" aria-hidden="true"><span>¤</span></div>';
    } else if (type === 'find') {
      q.prompt = 'Tap the map where you think <strong>' + esc(c.name) + '</strong> is.';
      q.answer = c.name; q.visual = 'map';
    }
    if (type !== 'find') {
      var labels = opts.concat([right]);
      if (q.fixedOrder) labels.sort(); else shuffle(labels, rng);
      q.options = labels.map(function (l) { return { label: l, correct: l === right }; });
    }
    return q;
  }

  function buildRound(mode, rng) {
    var types, n = 10, i, used = {}, qs = [];
    if (mode === 'daily') types = shuffle(['flag', 'capital', 'continent', 'currency', 'find', 'flag', 'capital', 'currency', 'continent', 'find'], rng);
    else if (mode === 'eighty') { n = 120; types = []; for (i = 0; i < n; i++) types.push(['flag', 'capital', 'continent', 'currency'][Math.floor(rng() * 4)]); }
    else { var t = { flags: 'flag', capitals: 'capital', continents: 'continent', currencies: 'currency', find: 'find' }[mode]; types = []; for (i = 0; i < n; i++) types.push(t); }
    types.forEach(function (t) {
      var pool = pools[t].filter(function (c) { return !used[c.iso]; });
      if (!pool.length) { used = {}; pool = pools[t]; }
      var c = pool[Math.floor(rng() * pool.length)]; used[c.iso] = 1;
      qs.push(makeQ(t, c, rng));
    });
    return qs;
  }

  // ---------------- runtime ----------------
  var $ = function (id) { return document.getElementById(id); };
  var S = null, timerId = 0, quitArmed = 0, prevCountry = null;

  function el() {
    return { stage: $('quizStage'), title: $('qTitle'), kicker: $('qKicker'), progress: $('qProgress'), score: $('qScore'), timer: $('qTimer'),
      bar: $('qBar'), prompt: $('qPrompt'), visual: $('qVisual'), options: $('qOptions'), feedback: $('qFeedback'), next: $('qNext') };
  }

  function start(mode) {
    var m = MODE_BY_ID[mode]; if (!m) return;
    var rng = Math.random, dk = AQ.profile.dateKey();
    if (mode === 'daily') rng = AQ.passport.mulberry(AQ.passport.hash('atlasquest-daily-' + dk));
    S = { mode: mode, qs: buildRound(mode, rng), i: 0, score: 0, correct: 0, answered: 0, bullseyes: 0, combo: 0, dateKey: dk,
      locked: false, t0: 0, endAt: 0, rng: rng };
    var E = el();
    E.title.textContent = m.title; E.kicker.textContent = m.kicker;
    E.timer.hidden = mode !== 'eighty';
    E.stage.hidden = false; document.body.classList.add('in-quiz');
    E.stage.classList.remove('leaving'); void E.stage.offsetWidth; E.stage.classList.add('entering');
    AQ.audio.play('page');
    if (mode === 'eighty') {
      S.endAt = performance.now() + 80000;
      clearInterval(timerId);
      timerId = setInterval(tickTimer, 250); tickTimer();
    }
    show();
    setTimeout(function () { var b = E.options.querySelector('button'); if (b) b.focus({ preventScroll: true }); else E.stage.querySelector('#qQuit').focus(); }, 60);
  }

  function tickTimer() {
    if (!S || S.mode !== 'eighty') { clearInterval(timerId); return; }
    var left = Math.max(0, Math.ceil((S.endAt - performance.now()) / 1000)), E = el();
    E.timer.textContent = left + 's';
    E.timer.classList.toggle('hurry', left <= 10);
    E.bar.style.width = (100 - left / 80 * 100).toFixed(1) + '%';
    if (left <= 10 && left > 0) AQ.audio.play('tick');
    if (left <= 0) { clearInterval(timerId); finish(); }
  }

  function show() {
    var E = el(), q = S.qs[S.i], total = S.mode === 'eighty' ? '∞' : S.qs.length;
    S.locked = false; S.t0 = performance.now(); S.mc = false;
    E.progress.textContent = (S.i + 1) + ' / ' + total;
    E.score.textContent = S.score + ' pts' + (S.mode === 'eighty' && S.combo > 1 ? ' · ×' + comboMult() : '');
    if (S.mode !== 'eighty') E.bar.style.width = (S.i / S.qs.length * 100) + '%';
    E.prompt.innerHTML = q.prompt;
    E.feedback.textContent = ''; E.feedback.className = 'qfeedback';
    E.next.hidden = true;
    E.options.innerHTML = '';
    E.visual.className = 'qvisual v-' + q.type;
    if (q.type === 'find') {
      E.visual.innerHTML = '';
      var holder = document.createElement('div'); holder.className = 'mapwrap quizmap'; E.visual.appendChild(holder);
      S.qmap = AQ.map.create(holder, { label: 'Blank map: tap where ' + q.country.name + ' is', snapPins: false, onTap: function (pt) { answerFind(pt); } });
      S.qmap.setPins([]);
      var mc = document.createElement('button'); mc.type = 'button'; mc.className = 'btn ghost small mcbtn'; mc.id = 'qMC';
      mc.textContent = 'Prefer multiple choice? (half points)';
      mc.addEventListener('click', function () { multipleChoiceFind(); });
      E.options.appendChild(mc);
    } else {
      E.visual.innerHTML = q.visual;
      q.options.forEach(function (o, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
        b.innerHTML = '<span class="key" aria-hidden="true">' + (i + 1) + '</span><span class="lbl">' + esc(o.label) + '</span>';
        b.setAttribute('data-i', i);
        b.addEventListener('click', function () { answerOpt(i, b); });
        E.options.appendChild(b);
      });
    }
    E.visual.classList.remove('pop'); void E.visual.offsetWidth; E.visual.classList.add('pop');
  }

  function comboMult() { return Math.min(5, 1 + Math.floor(S.combo / 3)); }

  function multipleChoiceFind() {
    var q = S.qs[S.i], E = el(); if (S.locked) return;
    S.mc = true;
    var opts = pickDistinct(nearFirst(q.country, all, Math.random), 3, Math.random, function (x) { return x.name; }, q.country.name);
    q.options = shuffle(opts.concat([q.country.name]), Math.random).map(function (l) { return { label: l, correct: l === q.country.name }; });
    E.prompt.innerHTML = 'Which country is marked on the map?';
    S.qmap.highlight(q.country, false); S.qmap.focusOn(q.country, 2.2);
    E.options.innerHTML = '';
    q.options.forEach(function (o, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt';
      b.innerHTML = '<span class="key" aria-hidden="true">' + (i + 1) + '</span><span class="lbl">' + esc(o.label) + '</span>';
      b.addEventListener('click', function () { answerOpt(i, b); });
      E.options.appendChild(b);
    });
    var f = E.options.querySelector('button'); if (f) f.focus();
  }

  function answerOpt(i, btn) {
    if (!S || S.locked) return;
    var q = S.qs[S.i], o = q.options[i], E = el(); S.locked = true;
    var ok = !!o.correct, elapsed = performance.now() - S.t0, pts = 0;
    Array.prototype.forEach.call(E.options.querySelectorAll('.opt'), function (b, k) {
      b.disabled = true;
      if (q.options[k].correct) b.classList.add('right');
    });
    if (!ok) btn.classList.add('wrong');
    if (ok) {
      if (S.mode === 'eighty') { S.combo++; pts = 10 * comboMult(); }
      else pts = 100 + Math.round(50 * Math.max(0, 1 - elapsed / 12000));
      if (S.mc) pts = Math.round(pts / 2);
    } else S.combo = 0;
    settle(q, ok, pts, ok ? pickPraise() : 'Not quite — it\'s <strong>' + esc(q.answer) + '</strong>.');
  }

  function answerFind(pt) {
    if (!S || S.locked || S.mc) return;
    var q = S.qs[S.i], c = q.country; S.locked = true;
    var d = AQ.map.haversine(pt.lat, pt.lon, c.lat, c.lon), R = SIZE[c.iso] || 200;
    var ok = d <= R + 250, pts;
    if (ok) { pts = 150; S.bullseyes++; } else pts = Math.max(0, Math.round(120 * (1 - (d - R) / 2500)));
    S.qmap.dropFlag(pt.lon, pt.lat, ok ? 'good' : 'bad');
    S.qmap.line(pt.lon, pt.lat, c.lon, c.lat, ok ? 'good' : 'bad');
    S.qmap.highlight(c);
    var km = Math.round(d).toLocaleString();
    var msg = ok ? 'Bullseye! You were ' + (d < 60 ? 'practically on the doorstep' : km + ' km from our pin') + '.' :
      (pts > 60 ? 'Warm! ' : pts > 0 ? 'Lukewarm. ' : 'Here be dragons. ') + km + ' km off.';
    var mcb = document.getElementById('qMC'); if (mcb) mcb.disabled = true;
    settle(q, ok, pts, msg);
  }

  var PRAISE = ['Spot on!', 'Splendid navigation!', 'Correct — the cartographers salute you.', 'Right as rain (in the right hemisphere).', 'Nailed it. Postcard incoming.', 'Correct! Your compass is calibrated.'];
  function pickPraise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

  function settle(q, ok, pts, msg) {
    var E = el();
    S.answered++; if (ok) S.correct++;
    S.score += pts;
    AQ.profile.recordAnswer(q.country, ok);
    AQ.audio.play(ok ? 'correct' : 'wrong');
    E.feedback.innerHTML = msg + (pts ? ' <span class="plus">+' + pts + '</span>' : '') + (q.after ? '<span class="after">' + esc(q.after) + '</span>' : '');
    E.feedback.className = 'qfeedback ' + (ok ? 'ok' : 'no');
    E.score.textContent = S.score + ' pts' + (S.mode === 'eighty' && S.combo > 1 ? ' · ×' + comboMult() : '');
    if (AQ.app && AQ.app.onTravel) AQ.app.onTravel(prevCountry, q.country);
    prevCountry = q.country;
    if (S.mode === 'eighty') { setTimeout(function () { if (S && S.mode === 'eighty') nextQ(); }, ok ? 450 : 1100); return; }
    E.next.hidden = false;
    E.next.querySelector('span').textContent = S.i + 1 >= S.qs.length ? 'Land the plane →' : 'Next stop →';
    E.next.focus({ preventScroll: true });
    if (q.type === 'find') E.next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function nextQ() {
    if (!S) return;
    S.i++;
    if (S.i >= S.qs.length) { finish(); return; }
    AQ.audio.play('click');
    show();
    var b = el().options.querySelector('button'); if (b) b.focus({ preventScroll: true });
  }

  function finish() {
    if (!S) return;
    clearInterval(timerId);
    var r = { mode: S.mode, score: S.score, correct: S.correct, total: S.answered || S.qs.length,
      perfect: S.mode !== 'eighty' && S.correct === S.qs.length, bullseyes: S.bullseyes, dateKey: S.dateKey };
    if (S.mode !== 'eighty') r.total = S.qs.length;
    var alreadyDaily = S.mode === 'daily' && !!AQ.profile.active().daily[S.dateKey];
    var out = AQ.profile.recordRound(r);
    closeStage();
    showResult(r, out, alreadyDaily);
    S = null;
  }

  function closeStage() {
    var E = el(); clearInterval(timerId);
    E.stage.classList.remove('entering'); E.stage.hidden = true; document.body.classList.remove('in-quiz');
  }

  var lastMode = 'flags';
  function showResult(r, out, alreadyDaily) {
    lastMode = r.mode;
    var m = MODE_BY_ID[r.mode], pct = r.total ? r.correct / r.total : 0;
    var verdict = r.mode === 'eighty' ? (r.correct >= 35 ? 'Faster than Fogg himself.' : r.correct >= 20 ? 'Phileas would tip his hat.' : r.correct >= 10 ? 'A brisk stroll around the globe.' : 'Fogg took 80 days. No shame in taking the scenic route.') :
      pct === 1 ? 'Flawless. The Royal Society wants your number.' : pct >= 0.8 ? 'Seasoned explorer material.' : pct >= 0.5 ? 'Solid voyage — a few detours.' : 'Every great explorer got lost first. (Columbus was aiming for India.)';
    $('resultTitle').textContent = m.title;
    $('resultScore').innerHTML = r.score + '<small> pts</small>';
    $('resultText').innerHTML = esc(r.correct + ' correct' + (r.mode === 'eighty' ? ' in 80 seconds' : ' of ' + r.total)) +
      (r.mode === 'find' ? ' · ' + r.bullseyes + ' bullseye' + (r.bullseyes === 1 ? '' : 's') : '') + '. ' + esc(verdict) +
      (out.isBest ? ' <strong class="newbest">New personal best!</strong>' : '') +
      (alreadyDaily ? ' <em>(Practice run — today\'s official result was already logged.)</em>' : '');
    var rs = $('resultStamps');
    rs.innerHTML = out.earned.map(function (id) {
      var s = AQ.profile.stamp(id);
      return '<div class="newstamp" title="' + esc(s.title) + '">' + AQ.passport.stampSVG(s, AQ.profile.active().stamps[id], true) + '<span>' + esc(s.title) + '</span></div>';
    }).join('');
    var modal = $('resultModal'); modal.hidden = false;
    if (out.earned.length) { AQ.audio.play('stamp'); if (AQ.app && AQ.app.stampFx) AQ.app.stampFx(out.earned[0]); }
    else if (pct >= 0.8 || r.correct >= 20) AQ.audio.play('fanfare');
    if (AQ.app && AQ.app.refresh) AQ.app.refresh();
    setTimeout(function () { $('btnAgain').focus(); }, 50);
  }

  function quit() {
    if (!S) return;
    var now = Date.now();
    if (now - quitArmed > 3000) { quitArmed = now; if (AQ.app) AQ.app.toast('Tap ✕ again to abandon ship. Progress on this voyage will be lost.'); return; }
    quitArmed = 0; S = null; closeStage();
    if (AQ.app) AQ.app.toast('Expedition abandoned. The map forgives you.');
  }

  function keydown(e) {
    if (!S) return;
    if (e.key === 'Escape') { e.preventDefault(); quit(); return; }
    if (/^[1-6]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var b = el().options.querySelectorAll('.opt')[+e.key - 1];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  }

  AQ.quiz = {
    start: start, quit: quit, next: nextQ, keydown: keydown, modes: AQ.MODES, mode: function (id) { return MODE_BY_ID[id]; },
    again: function () { $('resultModal').hidden = true; start(lastMode); },
    active: function () { return !!S; },
    pools: pools
  };
})();
