/* Atlas Quest — traveller profiles, passport stamps, best scores and the date-keyed daily
   streak. Everything persists in localStorage under one key; backup/restore via JSON. */
(function () {
  'use strict';
  var KEY = 'atlasquest.v1';
  var COLORS = ['#9b2c1f', '#1f3a5f', '#2f5d3a', '#b8862b', '#5b3a6b', '#1f5f5b', '#7a4a21'];

  var STAMPS = [
    { id: 'first_voyage', title: 'Maiden Voyage', desc: 'Complete your first expedition.', color: '#9b2c1f', glyph: '⚓', shape: 'round' },
    { id: 'flags_perfect', title: 'Flag Bearer', desc: 'Score 10/10 on Flags.', color: '#1f3a5f', glyph: '⚑', shape: 'rect' },
    { id: 'capitals_perfect', title: 'Capital Gains', desc: 'Score 10/10 on Capitals.', color: '#2f5d3a', glyph: '★', shape: 'round' },
    { id: 'continents_perfect', title: 'Continental Breakfast', desc: 'Score 10/10 on Continents.', color: '#b8862b', glyph: '◐', shape: 'oval' },
    { id: 'currency_perfect', title: 'Money Changer', desc: 'Score 10/10 on Currencies.', color: '#5b3a6b', glyph: '¤', shape: 'rect' },
    { id: 'find_master', title: 'Cartographer', desc: 'Land 5+ bullseyes in one Find-the-Region voyage.', color: '#1f5f5b', glyph: '✣', shape: 'round' },
    { id: 'fogg', title: 'Phileas Approves', desc: '20+ correct in Around the World in 80 Seconds.', color: '#7a4a21', glyph: '◷', shape: 'oval' },
    { id: 'fogg_ace', title: 'Faster than Fogg', desc: '35+ correct in Around the World in 80 Seconds.', color: '#9b2c1f', glyph: '✈', shape: 'rect' },
    { id: 'daily_first', title: 'Dawn Patrol', desc: 'Complete a daily challenge.', color: '#b8862b', glyph: '☀', shape: 'round' },
    { id: 'streak3', title: 'Three-Day Trek', desc: 'Reach a 3-day daily streak.', color: '#2f5d3a', glyph: '3', shape: 'rect' },
    { id: 'streak7', title: 'A Week at Sea', desc: 'Reach a 7-day daily streak.', color: '#1f3a5f', glyph: '7', shape: 'oval' },
    { id: 'streak30', title: 'Circumnavigator', desc: 'Reach a 30-day daily streak.', color: '#5b3a6b', glyph: '30', shape: 'round' },
    { id: 'seen50', title: 'Fifty Ports', desc: 'Answer correctly about 50 different countries.', color: '#1f5f5b', glyph: '50', shape: 'rect' },
    { id: 'seen150', title: 'Globetrotter', desc: 'Answer correctly about 150 different countries.', color: '#9b2c1f', glyph: '◍', shape: 'round' },
    { id: 'sixcont', title: 'Six of the Best', desc: 'Correct answers on all six inhabited continents.', color: '#7a4a21', glyph: '6', shape: 'oval' },
    { id: 'century', title: 'Centurion', desc: '100 correct answers in total.', color: '#2f5d3a', glyph: 'C', shape: 'rect' },
    { id: 'perfect3', title: 'Hat-Trick', desc: 'Three perfect rounds.', color: '#b8862b', glyph: '♛', shape: 'round' },
    { id: 'night_owl', title: 'Night Navigator', desc: 'Finish an expedition between midnight and 4 a.m.', color: '#1f3a5f', glyph: '☾', shape: 'oval' },
    { id: 'dragons', title: 'Here Be Dragons', desc: 'A secret. Cartographers left a clue on the map.', color: '#1f5f5b', glyph: '§', shape: 'round', secret: true },
    { id: 'souvenir', title: 'Souvenir Hunter', desc: 'Export your passport as a PNG.', color: '#5b3a6b', glyph: '✉', shape: 'rect' }
  ];
  var STAMP_BY_ID = {};
  STAMPS.forEach(function (s) { STAMP_BY_ID[s.id] = s; });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function shiftKey(key, days) {
    var p = key.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + days); return dateKey(d);
  }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function blank(name, idx) {
    return {
      id: uid(), name: (name || 'Traveller').slice(0, 24), color: COLORS[(idx || 0) % COLORS.length],
      created: dateKey(), stamps: {}, best: {}, daily: {},
      stats: { answered: 0, correct: 0, perfect: 0, rounds: 0, seen: {}, conts: {} },
      streak: { current: 0, best: 0, last: '' }
    };
  }
  function sanitize(p, idx) {
    var b = blank(p && p.name, idx);
    if (!p || typeof p !== 'object') return b;
    b.id = typeof p.id === 'string' ? p.id : b.id;
    b.color = typeof p.color === 'string' && /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : b.color;
    b.created = typeof p.created === 'string' ? p.created : b.created;
    ['stamps', 'best', 'daily'].forEach(function (k) { if (p[k] && typeof p[k] === 'object') b[k] = p[k]; });
    if (p.stats && typeof p.stats === 'object') {
      ['answered', 'correct', 'perfect', 'rounds'].forEach(function (k) { b.stats[k] = +p.stats[k] || 0; });
      if (p.stats.seen && typeof p.stats.seen === 'object') b.stats.seen = p.stats.seen;
      if (p.stats.conts && typeof p.stats.conts === 'object') b.stats.conts = p.stats.conts;
    }
    if (p.streak && typeof p.streak === 'object') {
      b.streak.current = +p.streak.current || 0; b.streak.best = +p.streak.best || 0;
      b.streak.last = typeof p.streak.last === 'string' ? p.streak.last : '';
    }
    return b;
  }

  var store = null, memoryOnly = false;
  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; memoryOnly = !storageOK(); }
    if (!raw || typeof raw !== 'object' || !raw.profiles) raw = { version: 1, active: '', profiles: {} };
    var out = { version: 1, active: raw.active, profiles: {} }, i = 0, k;
    for (k in raw.profiles) if (Object.prototype.hasOwnProperty.call(raw.profiles, k)) { var p = sanitize(raw.profiles[k], i++); out.profiles[p.id] = p; }
    if (!Object.keys(out.profiles).length) { var f = blank('Traveller', 0); out.profiles[f.id] = f; }
    if (!out.profiles[out.active]) out.active = Object.keys(out.profiles)[0];
    store = out;
    save();
  }
  function storageOK() { try { localStorage.setItem('aq.t', '1'); localStorage.removeItem('aq.t'); return true; } catch (e) { return false; } }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); memoryOnly = false; } catch (e) { memoryOnly = true; }
  }
  function active() { return store.profiles[store.active]; }

  function award(id, p) {
    p = p || active();
    if (!STAMP_BY_ID[id] || p.stamps[id]) return false;
    p.stamps[id] = dateKey(); return true;
  }

  function checkMilestones(p, earned) {
    var seen = Object.keys(p.stats.seen).length;
    if (seen >= 50 && award('seen50', p)) earned.push('seen50');
    if (seen >= 150 && award('seen150', p)) earned.push('seen150');
    if (['AF', 'AS', 'EU', 'NA', 'SA', 'OC'].every(function (c) { return p.stats.conts[c]; }) && award('sixcont', p)) earned.push('sixcont');
    if (p.stats.correct >= 100 && award('century', p)) earned.push('century');
    if (p.stats.perfect >= 3 && award('perfect3', p)) earned.push('perfect3');
    if (p.streak.current >= 3 && award('streak3', p)) earned.push('streak3');
    if (p.streak.current >= 7 && award('streak7', p)) earned.push('streak7');
    if (p.streak.current >= 30 && award('streak30', p)) earned.push('streak30');
  }

  var api = {
    STAMPS: STAMPS, stamp: function (id) { return STAMP_BY_ID[id]; },
    dateKey: dateKey, shiftKey: shiftKey, isMemoryOnly: function () { return memoryOnly; },
    all: function () { return Object.keys(store.profiles).map(function (k) { return store.profiles[k]; }); },
    active: active,
    setActive: function (id) { if (store.profiles[id]) { store.active = id; save(); } },
    create: function (name) {
      var p = blank(name, Object.keys(store.profiles).length);
      store.profiles[p.id] = p; store.active = p.id; save(); return p;
    },
    rename: function (id, name) { var p = store.profiles[id]; if (p && name) { p.name = name.slice(0, 24); save(); } },
    remove: function (id) {
      if (!store.profiles[id]) return;
      delete store.profiles[id];
      if (!Object.keys(store.profiles).length) { var f = blank('Traveller', 0); store.profiles[f.id] = f; }
      if (!store.profiles[store.active]) store.active = Object.keys(store.profiles)[0];
      save();
    },
    award: function (id) { var ok = award(id); if (ok) save(); return ok; },
    recordAnswer: function (country, correct) {
      var p = active(); p.stats.answered++;
      if (correct && country) { p.stats.correct++; p.stats.seen[country.iso] = 1; p.stats.conts[country.cont] = 1; }
    },
    // result: {mode, score, correct, total, perfect, bullseyes, daily}
    recordRound: function (r) {
      var p = active(), earned = [], prev = p.best[r.mode], isBest = false;
      p.stats.rounds++;
      if (!prev || r.score > prev.score) { p.best[r.mode] = { score: r.score, correct: r.correct, total: r.total, date: dateKey() }; isBest = true; }
      if (award('first_voyage', p)) earned.push('first_voyage');
      if (r.perfect && r.total >= 10) {
        p.stats.perfect++;
        var map = { flags: 'flags_perfect', capitals: 'capitals_perfect', continents: 'continents_perfect', currencies: 'currency_perfect' };
        if (map[r.mode] && award(map[r.mode], p)) earned.push(map[r.mode]);
      }
      if (r.mode === 'find' && r.bullseyes >= 5 && award('find_master', p)) earned.push('find_master');
      if (r.mode === 'eighty' && r.correct >= 20 && award('fogg', p)) earned.push('fogg');
      if (r.mode === 'eighty' && r.correct >= 35 && award('fogg_ace', p)) earned.push('fogg_ace');
      var h = new Date().getHours();
      if (h >= 0 && h < 4 && award('night_owl', p)) earned.push('night_owl');
      if (r.mode === 'daily') {
        var key = r.dateKey || dateKey();
        var first = !p.daily[key];
        if (first) {
          p.daily[key] = { score: r.score, correct: r.correct, total: r.total };
          var s = p.streak;
          if (s.last === shiftKey(key, -1)) s.current += 1; else if (s.last !== key) s.current = 1;
          s.last = key; s.best = Math.max(s.best, s.current);
        }
        if (award('daily_first', p)) earned.push('daily_first');
      }
      checkMilestones(p, earned);
      save();
      return { earned: earned, isBest: isBest };
    },
    // streak is "alive" if the last daily was today or yesterday
    liveStreak: function (p) {
      p = p || active(); var t = dateKey();
      if (p.streak.last === t || p.streak.last === shiftKey(t, -1)) return p.streak.current;
      return 0;
    },
    exportJSON: function () { return JSON.stringify({ app: 'atlasquest', exported: new Date().toISOString(), data: store }, null, 2); },
    importJSON: function (txt) {
      var obj = JSON.parse(txt), data = obj && obj.data ? obj.data : obj;
      if (!data || typeof data.profiles !== 'object') throw new Error('Not an Atlas Quest backup');
      var n = 0, k;
      for (k in data.profiles) if (Object.prototype.hasOwnProperty.call(data.profiles, k)) {
        var p = sanitize(data.profiles[k], n);
        store.profiles[p.id] = p; n++;
      }
      if (!n) throw new Error('No travellers found in that file');
      save(); return n;
    },
    save: save
  };

  load();
  window.AQ = window.AQ || {};
  window.AQ.profile = api;
})();
