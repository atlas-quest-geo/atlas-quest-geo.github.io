/* Atlas Quest — passport rendering (HTML/SVG) and PNG export (canvas). */
(function () {
  'use strict';
  var AQ = window.AQ = window.AQ || {};
  var sid = 0;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(str) { var h = 2166136261, i; for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function fmtDate(key) {
    if (!key) return '';
    var p = key.split('-'), m = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return +p[2] + ' ' + m[+p[1] - 1] + ' ' + p[0];
  }
  function passportNo(p) { return 'AQ' + String(hash(p.id) % 10000000).padStart(7, '0'); }

  function stampSVG(s, date, earned) {
    var id = 'aqsp' + (++sid), col = earned ? s.color : 'currentColor';
    var title = earned || !s.secret ? s.title : '? ? ?';
    var ring = ('ATLAS QUEST · ' + title.toUpperCase() + ' · ');
    var glyph = earned ? s.glyph : '?';
    var dateTxt = earned ? fmtDate(date) : 'NOT YET';
    var body;
    if (s.shape === 'rect') {
      body = '<rect x="10" y="22" width="100" height="76" rx="6" fill="none" stroke="' + col + '" stroke-width="3"/>' +
        '<rect x="16" y="28" width="88" height="64" rx="3" fill="none" stroke="' + col + '" stroke-width="1.2"/>' +
        '<text x="60" y="44" text-anchor="middle" class="st-small" fill="' + col + '">' + esc(title.toUpperCase().slice(0, 18)) + '</text>' +
        '<text x="60" y="72" text-anchor="middle" class="st-glyph" fill="' + col + '">' + esc(glyph) + '</text>' +
        '<text x="60" y="86" text-anchor="middle" class="st-date" fill="' + col + '">' + esc(dateTxt) + '</text>';
    } else {
      var rx = s.shape === 'oval' ? 54 : 52, ry = s.shape === 'oval' ? 40 : 52;
      var pr = s.shape === 'oval' ? 'M14,60 a46,32 0 1,1 92,0 a46,32 0 1,1 -92,0' : 'M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0';
      body = '<ellipse cx="60" cy="60" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + col + '" stroke-width="3"/>' +
        '<ellipse cx="60" cy="60" rx="' + (rx - 15) + '" ry="' + (ry - 15) + '" fill="none" stroke="' + col + '" stroke-width="1.2"/>' +
        '<defs><path id="' + id + '" d="' + pr + '"/></defs>' +
        '<text class="st-ring" fill="' + col + '"><textPath href="#' + id + '" xlink:href="#' + id + '">' + esc(ring.slice(0, 44)) + '</textPath></text>' +
        '<text x="60" y="66" text-anchor="middle" class="st-glyph" fill="' + col + '">' + esc(glyph) + '</text>' +
        '<text x="60" y="80" text-anchor="middle" class="st-date" fill="' + col + '">' + esc(dateTxt) + '</text>';
    }
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true"' +
      (earned ? ' filter="url(#inkbleed)"' : '') + '>' + body + '</svg>';
  }

  function render(el) {
    var P = AQ.profile, p = P.active();
    // profiles
    el.profileList.innerHTML = P.all().map(function (q) {
      var on = q.id === p.id;
      return '<button type="button" role="radio" aria-checked="' + on + '" class="ptab' + (on ? ' on' : '') + '" data-pid="' + esc(q.id) + '">' +
        '<span class="chip-dot" style="background:' + esc(q.color) + '"></span>' + esc(q.name) + '</button>';
    }).join('');

    var earnedN = Object.keys(p.stamps).length, seen = Object.keys(p.stats.seen).length;
    var acc = p.stats.answered ? Math.round(p.stats.correct / p.stats.answered * 100) : 0;
    var initials = p.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase() || '?';
    var mrzName = p.name.toUpperCase().replace(/[^A-Z]/g, '<').slice(0, 20);
    var mrz1 = ('P<AQST<<' + mrzName + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 44);
    var mrz2 = (passportNo(p) + '<<' + p.created.replace(/-/g, '') + '<<' + String(p.stats.correct).padStart(5, '0') + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 44);
    el.passIdentity.innerHTML =
      '<div class="pp-crest" aria-hidden="true">✦ REPUBLIC OF WANDERLUST ✦</div>' +
      '<div class="pp-idrow"><div class="pp-photo" style="--pc:' + esc(p.color) + '"><span>' + esc(initials) + '</span></div>' +
      '<dl class="pp-fields">' +
      '<div><dt>Name</dt><dd>' + esc(p.name) + '</dd></div>' +
      '<div><dt>Passport no.</dt><dd>' + passportNo(p) + '</dd></div>' +
      '<div><dt>Issued</dt><dd>' + fmtDate(p.created) + '</dd></div>' +
      '<div><dt>Nationality</dt><dd>Citizen of Everywhere</dd></div>' +
      '<div><dt>Countries mastered</dt><dd>' + seen + ' / 195</dd></div>' +
      '<div><dt>Accuracy</dt><dd>' + acc + '% of ' + p.stats.answered + '</dd></div>' +
      '</dl></div>' +
      '<p class="pp-mrz" aria-hidden="true">' + esc(mrz1) + '<br>' + esc(mrz2) + '</p>';

    el.stampCount.textContent = earnedN + ' / ' + P.STAMPS.length;
    el.stampGrid.innerHTML = P.STAMPS.map(function (s) {
      var d = p.stamps[s.id], earned = !!d, rot = (hash(s.id + p.id) % 24) - 12;
      var label = earned ? s.title + ' — earned ' + fmtDate(d) : (s.secret ? 'Secret stamp' : s.title + ' — ' + s.desc);
      return '<button type="button" class="stamp' + (earned ? ' earned' : ' locked') + '" style="--rot:' + rot + 'deg" data-stamp="' + s.id + '" aria-label="' + esc(label) + '">' +
        stampSVG(s, d, earned) + '</button>';
    }).join('');
    if (!earnedN) el.stampGrid.insertAdjacentHTML('afterbegin', '<p class="empty">Blank pages! Customs is bored. Finish any expedition for your first stamp.</p>');

    var modes = AQ.MODES || [];
    el.bestTable.innerHTML = modes.map(function (m) {
      var b = p.best[m.id];
      return '<tr><th scope="row">' + esc(m.title) + '</th><td>' + (b ? '<strong>' + b.score + '</strong> pts <span class="muted">(' + b.correct + '/' + b.total + ', ' + fmtDate(b.date) + ')</span>' : '<span class="muted">— uncharted —</span>') + '</td></tr>';
    }).join('');

    var live = P.liveStreak(p);
    el.streakInfo.innerHTML = live ? '🔥 <strong>' + live + '-day</strong> streak · best ever ' + p.streak.best + ' days.' :
      (p.streak.best ? 'Streak cooled off (best: ' + p.streak.best + ' days). Today is a fine day to restart.' : 'No daily challenges yet. The sun rises daily; so can you.');
    var today = P.dateKey(), cells = '', i;
    for (i = 27; i >= 0; i--) {
      var k = P.shiftKey(today, -i), r = p.daily[k];
      cells += '<span class="sc' + (r ? ' done' : '') + (i === 0 ? ' today' : '') + '" title="' + k + (r ? ': ' + r.correct + '/' + r.total : '') + '">' + (r ? r.correct : '') + '</span>';
    }
    el.streakCal.innerHTML = cells;
  }

  // ---------- PNG export ----------
  function drawStamp(c, s, x, y, r, date, rot) {
    c.save(); c.translate(x, y); c.rotate(rot * Math.PI / 180);
    c.strokeStyle = s.color; c.fillStyle = s.color; c.globalAlpha = 0.86; c.lineWidth = 3.2;
    if (s.shape === 'rect') {
      roundRect(c, -r, -r * 0.72, r * 2, r * 1.44, 7); c.stroke();
      c.lineWidth = 1.3; roundRect(c, -r + 7, -r * 0.72 + 7, r * 2 - 14, r * 1.44 - 14, 4); c.stroke();
      c.textAlign = 'center'; c.font = 'bold 11px Georgia, serif'; c.fillText(s.title.toUpperCase().slice(0, 18), 0, -r * 0.36);
    } else {
      var sy = s.shape === 'oval' ? 0.76 : 1;
      c.save(); c.scale(1, sy); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.3; c.beginPath(); c.arc(0, 0, r - 15, 0, Math.PI * 2); c.stroke(); c.restore();
      var txt = ('ATLAS QUEST · ' + s.title.toUpperCase() + ' · '), n = txt.length, i;
      c.font = 'bold 10px Georgia, serif'; c.textAlign = 'center';
      for (i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        c.save(); c.translate(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8) * sy); c.rotate(a + Math.PI / 2); c.fillText(txt.charAt(i), 0, 3); c.restore();
      }
    }
    c.textAlign = 'center'; c.font = 'bold 28px Georgia, serif'; c.fillText(s.glyph, 0, 10);
    c.font = '10px "Courier New", monospace'; c.fillText(fmtDate(date), 0, 26);
    c.restore();
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function exportPNG(done) {
    var P = AQ.profile, p = P.active();
    var W = 1400, H = 900, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    if (!c) { done(false); return; }
    // parchment
    var g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900);
    g.addColorStop(0, '#f4e6c6'); g.addColorStop(0.7, '#e6d0a2'); g.addColorStop(1, '#c9a96e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var i, rnd = mulberry(hash(p.id));
    for (i = 0; i < 2600; i++) { c.fillStyle = 'rgba(90,60,20,' + (rnd() * 0.07).toFixed(3) + ')'; c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }
    // airmail border
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.rect(22, 22, W - 44, H - 44); c.clip('evenodd');
    for (i = -H; i < W + H; i += 36) { c.fillStyle = (i / 36) % 2 ? '#1f3a5f' : '#9b2c1f'; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 18, 0); c.lineTo(i + 18 - H, H); c.lineTo(i - H, H); c.closePath(); c.fill(); }
    c.restore();
    // spine fold
    var fold = c.createLinearGradient(W / 2 - 30, 0, W / 2 + 30, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0)'); fold.addColorStop(0.5, 'rgba(60,35,10,.22)'); fold.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fold; c.fillRect(W / 2 - 30, 22, 60, H - 44);

    c.fillStyle = '#3b2410'; c.textAlign = 'left';
    c.font = 'bold 44px Georgia, "Times New Roman", serif'; c.fillText('PASSPORT', 70, 105);
    c.font = 'italic 22px Georgia, serif'; c.fillText('Atlas Quest · Republic of Wanderlust', 70, 140);
    // photo
    c.fillStyle = p.color; roundRect(c, 70, 175, 170, 210, 10); c.fill();
    c.fillStyle = '#f4e6c6'; c.font = 'bold 72px Georgia, serif'; c.textAlign = 'center';
    c.fillText((p.name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase() || '?'), 155, 305);
    c.textAlign = 'left'; c.fillStyle = '#3b2410';
    var rows = [['NAME', p.name], ['PASSPORT NO.', passportNo(p)], ['ISSUED', fmtDate(p.created)], ['COUNTRIES MASTERED', Object.keys(p.stats.seen).length + ' / 195'],
      ['CORRECT ANSWERS', String(p.stats.correct)], ['DAILY STREAK', P.liveStreak(p) + ' days (best ' + p.streak.best + ')']];
    rows.forEach(function (r, k) {
      c.font = '13px "Courier New", monospace'; c.fillStyle = '#7a5a30'; c.fillText(r[0], 270, 195 + k * 34);
      c.font = 'bold 20px Georgia, serif'; c.fillStyle = '#3b2410'; c.fillText(r[1].slice(0, 26), 270, 215 + k * 34);
    });
    c.font = 'bold 22px Georgia, serif'; c.fillText('Best voyages', 70, 450);
    (AQ.MODES || []).forEach(function (m, k) {
      var b = p.best[m.id];
      c.font = '17px Georgia, serif'; c.fillStyle = '#3b2410'; c.fillText(m.title, 70, 484 + k * 30);
      c.font = '16px "Courier New", monospace'; c.fillStyle = b ? '#9b2c1f' : '#8a7350';
      c.fillText(b ? (b.score + ' pts  ' + b.correct + '/' + b.total) : '— uncharted —', 420, 484 + k * 30);
    });
    c.font = '20px "Courier New", monospace'; c.fillStyle = 'rgba(59,36,16,.7)';
    c.fillText(('P<AQST<<' + p.name.toUpperCase().replace(/[^A-Z]/g, '<') + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 34), 70, H - 80);
    // stamps page
    c.fillStyle = '#3b2410'; c.font = 'bold 26px Georgia, serif'; c.fillText('Visas & stamps', W / 2 + 60, 105);
    var earned = P.STAMPS.filter(function (s) { return p.stamps[s.id]; });
    if (!earned.length) { c.font = 'italic 22px Georgia, serif'; c.fillText('Blank pages — adventure pending.', W / 2 + 60, 160); }
    earned.forEach(function (s, k) {
      var col = k % 4, row = Math.floor(k / 4);
      var x = W / 2 + 130 + col * 150 + (rnd() * 16 - 8), y = 200 + row * 140 + (rnd() * 16 - 8);
      drawStamp(c, s, x, y, 58, p.stamps[s.id], rnd() * 30 - 15);
    });
    c.textAlign = 'right'; c.font = '14px Georgia, serif'; c.fillStyle = '#5a3d1c';
    c.fillText('kumarnikhildeveloperaccount.github.io/atlasquest · Designed & built by Kumar Nikhil', W - 60, H - 50);

    var name = 'atlasquest-passport-' + p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png';
    function dl(url, revoke) {
      var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); if (revoke) URL.revokeObjectURL(url); }, 800);
      done(true);
    }
    try {
      if (cv.toBlob) cv.toBlob(function (b) { if (b) dl(URL.createObjectURL(b), true); else dl(cv.toDataURL('image/png'), false); }, 'image/png');
      else dl(cv.toDataURL('image/png'), false);
    } catch (e) { done(false); }
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  AQ.passport = { render: render, exportPNG: exportPNG, stampSVG: stampSVG, fmtDate: fmtDate, esc: esc, mulberry: mulberry, hash: hash };
})();
