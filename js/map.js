/* Atlas Quest — Carta Mundi renderer: stylised SVG world map with pins, pan/zoom (pointer +
   pinch + wheel + keyboard), tap-to-pick and animated airmail flight paths. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1000, H = 500;
  var BASE = { x: 0, y: 8, w: 1000, h: 430 };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function proj(lon, lat) { return [(lon + 180) / 360 * W, (90 - lat) / 180 * H]; }
  function unproj(x, y) { return [x / W * 360 - 180, 90 - y / H * 180]; }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag), k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pathOf(pts) {
    return pts.map(function (p, i) { var q = proj(p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + 'Z';
  }
  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    var toR = Math.PI / 180, y = Math.sin((lon2 - lon1) * toR) * Math.cos(lat2 * toR);
    var x = Math.cos(lat1 * toR) * Math.sin(lat2 * toR) - Math.sin(lat1 * toR) * Math.cos(lat2 * toR) * Math.cos((lon2 - lon1) * toR);
    return (Math.atan2(y, x) / toR + 360) % 360;
  }

  var mapCount = 0;

  function create(container, opts) {
    opts = opts || {};
    var id = 'm' + (++mapCount);
    var vb = { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h };
    var svg = el('svg', { viewBox: vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h, class: 'carta', role: 'img',
      'aria-label': opts.label || 'Stylised world map', preserveAspectRatio: 'xMidYMid meet' });
    var defs = el('defs', {}, svg);
    var waves = el('pattern', { id: id + 'waves', width: 24, height: 12, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M0 6 q6 -4 12 0 t12 0', fill: 'none', class: 'sea-wave', 'stroke-width': .6 }, waves);
    var vg = el('radialGradient', { id: id + 'vig', cx: '50%', cy: '50%', r: '75%' }, defs);
    el('stop', { offset: '60%', 'stop-color': '#000', 'stop-opacity': 0 }, vg);
    el('stop', { offset: '100%', 'stop-color': '#3b2410', 'stop-opacity': .35 }, vg);

    el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, class: 'sea' }, svg);
    el('rect', { x: -20, y: -20, width: W + 40, height: H + 40, fill: 'url(#' + id + 'waves)', opacity: .5 }, svg);

    // graticule
    var grat = el('g', { class: 'graticule' }, svg), lon, lat, a, b;
    for (lon = -150; lon <= 150; lon += 30) { a = proj(lon, 85); b = proj(lon, -85); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, grat); }
    for (lat = -60; lat <= 60; lat += 30) { a = proj(-180, lat); b = proj(180, lat); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: lat === 0 ? 'equator' : '' }, grat); }
    [[23.44, 'Tropic of Cancer'], [-23.44, 'Tropic of Capricorn']].forEach(function (t) {
      a = proj(-180, t[0]); b = proj(180, t[0]);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'tropic' }, grat);
      var tx = el('text', { x: 8, y: a[1] - 3, class: 'grat-label' }, grat); tx.textContent = t[1];
    });

    // land (coastal halo, then land)
    var landG = el('g', { class: 'land', filter: 'url(#roughen)' }, svg);
    var halo = el('g', { class: 'coast-halo' }, landG);
    var fill = el('g', { class: 'land-fill' }, landG);
    var land = (window.AQ && window.AQ.land) || {}, lakes = (window.AQ && window.AQ.lakes) || {}, k;
    for (k in land) if (Object.prototype.hasOwnProperty.call(land, k)) {
      var d = pathOf(land[k]);
      el('path', { d: d }, halo);
      el('path', { d: d, 'data-land': k }, fill);
    }
    for (k in lakes) if (Object.prototype.hasOwnProperty.call(lakes, k)) el('path', { d: pathOf(lakes[k]), class: 'lake' }, landG);

    // ocean labels & ornaments
    var orn = el('g', { class: 'ornaments', 'aria-hidden': 'true' }, svg);
    [['OCEANUS PACIFICUS', -150, -18], ['MARE ATLANTICUM', -38, 12], ['OCEANUS INDICUS', 78, -28], ['MARE ARCTICUM', -10, 80], ['Pacificus', 168, 26]].forEach(function (o) {
      var p = proj(o[1], o[2]); var t = el('text', { x: p[0], y: p[1], class: 'ocean-label', 'text-anchor': 'middle' }, orn); t.textContent = o[0];
    });
    var dragonP = proj(-128, -42);
    var dragonText = el('text', { x: dragonP[0], y: dragonP[1] + 22, class: 'dragon-label', 'text-anchor': 'middle' }, orn);
    dragonText.textContent = 'hic sunt dracones';
    var serpent = el('g', { class: 'serpent', transform: 'translate(' + dragonP[0] + ' ' + dragonP[1] + ')' }, orn);
    el('path', { d: 'M-30 4 q7 -14 14 0 q7 14 14 0 q7 -14 14 0 q5 9 12 2 l6 -6 l-2 8 l6 1 l-8 3', class: 'serpent-body' }, serpent);
    el('circle', { cx: 25, cy: -1, r: 1.1, class: 'serpent-eye' }, serpent);
    var ship = el('g', { class: 'ship', transform: 'translate(' + proj(-30, -30).join(' ') + ')' }, orn);
    el('path', { d: 'M-9 0 h18 l-3 5 h-12z M0 0 v-15 M0 -14 l8 6 h-8 M0 -12 l-6 6 h6', class: 'ship-lines' }, ship);

    var pinG = el('g', { class: 'pins' }, svg);
    var routeG = el('g', { class: 'routes' }, svg);
    var markG = el('g', { class: 'marks' }, svg);
    var pins = {};

    container.innerHTML = '';
    container.appendChild(svg);

    function setVB() {
      svg.setAttribute('viewBox', vb.x.toFixed(2) + ' ' + vb.y.toFixed(2) + ' ' + vb.w.toFixed(2) + ' ' + vb.h.toFixed(2));
      var z = BASE.w / vb.w;
      svg.style.setProperty('--z', z.toFixed(3));
      var i, list = pinG.childNodes;
      for (i = 0; i < list.length; i++) {
        var c = list[i]; var r = +c.getAttribute('data-r');
        c.setAttribute('r', (r / Math.sqrt(z)).toFixed(2));
      }
    }
    function clampVB() {
      vb.w = Math.max(60, Math.min(BASE.w, vb.w)); vb.h = vb.w * BASE.h / BASE.w;
      vb.x = Math.max(-40, Math.min(W + 40 - vb.w, vb.x));
      vb.y = Math.max(-10, Math.min(H - vb.h + 10, vb.y));
    }
    function zoomAt(factor, sx, sy) {
      var nw = vb.w / factor; nw = Math.max(60, Math.min(BASE.w, nw)); factor = vb.w / nw;
      vb.x = sx - (sx - vb.x) / factor; vb.y = sy - (sy - vb.y) / factor;
      vb.w = nw; clampVB(); setVB();
    }
    function toSvg(cx, cy) {
      var pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
      var m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
      var r = pt.matrixTransform(m.inverse()); return { x: r.x, y: r.y };
    }

    function setPins(countries, showAll) {
      pinG.innerHTML = ''; pins = {};
      countries.forEach(function (c) {
        var p = proj(c.lon, c.lat);
        var small = ['VA', 'SM', 'MC', 'LI', 'AD', 'MT', 'LU', 'SG', 'BH'].indexOf(c.iso) >= 0;
        var pin = el('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: small ? 1.6 : 2.4, 'data-r': small ? 1.6 : 2.4, class: 'pin' + (showAll ? '' : ' faint'), 'data-iso': c.iso }, pinG);
        var t = el('title', {}, pin); t.textContent = c.name;
        pins[c.iso] = pin;
      });
      setVB();
    }

    function clearMarks() { markG.innerHTML = ''; }
    function highlight(c, label) {
      clearMarks();
      if (!c) return;
      var p = proj(c.lon, c.lat);
      el('circle', { cx: p[0], cy: p[1], r: 9, class: 'ring' }, markG);
      el('circle', { cx: p[0], cy: p[1], r: 3.2, class: 'ring-dot' }, markG);
      if (label !== false) {
        var t = el('text', { x: p[0] + 8, y: p[1] - 8, class: 'mark-label' }, markG);
        t.textContent = label || c.name;
      }
      Object.keys(pins).forEach(function (k) { pins[k].classList.toggle('on', k === c.iso); });
    }
    function dropFlag(lon, lat, cls) {
      var p = proj(lon, lat);
      var g = el('g', { class: 'drop ' + (cls || ''), transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')' }, markG);
      el('path', { d: 'M0 0 v-14', class: 'drop-pole' }, g);
      el('path', { d: 'M0 -14 l9 3 l-9 3z', class: 'drop-flag' }, g);
      el('circle', { cx: 0, cy: 0, r: 1.8, class: 'drop-base' }, g);
      return g;
    }
    function line(lon1, lat1, lon2, lat2, cls) {
      var a1 = proj(lon1, lat1), a2 = proj(lon2, lat2);
      el('line', { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], class: 'measure ' + (cls || '') }, markG);
    }

    // Airmail flight between two countries
    function fly(from, to) {
      if (!from || !to || from.iso === to.iso) return;
      var a1 = proj(from.lon, from.lat), a2 = proj(to.lon, to.lat);
      var mx = (a1[0] + a2[0]) / 2, my = (a1[1] + a2[1]) / 2;
      var dx = a2[0] - a1[0], dy = a2[1] - a1[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var cx = mx, cy = Math.max(4, my - len * 0.28);
      var d = 'M' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1);
      while (routeG.childNodes.length > 10) routeG.removeChild(routeG.firstChild);
      var path = el('path', { d: d, class: 'route' }, routeG);
      if (reduced || !path.getTotalLength) return;
      var L = path.getTotalLength();
      var plane = el('path', { d: 'M-5 0 L4 0 M1 -4 L3 0 L1 4 M-4 -2 L-3 0 L-4 2', class: 'plane' }, routeG);
      var t0 = performance.now(), dur = Math.min(1600, 500 + L * 3);
      path.style.strokeDasharray = '3 3';
      (function step(now) {
        var t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var p = path.getPointAtLength(L * e), q = path.getPointAtLength(Math.min(L, L * e + 1));
        var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        plane.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
        if (t < 1) requestAnimationFrame(step); else if (plane.parentNode) setTimeout(function () { if (plane.parentNode) plane.parentNode.removeChild(plane); }, 400);
      })(t0);
    }
    function clearRoutes() { routeG.innerHTML = ''; }

    function focusOn(c, zoom) {
      var p = proj(c.lon, c.lat), nw = BASE.w / (zoom || 2.5);
      vb.w = nw; vb.h = nw * BASE.h / BASE.w; vb.x = p[0] - vb.w / 2; vb.y = p[1] - vb.h / 2; clampVB(); setVB();
    }
    function reset() { vb = { x: BASE.x, y: BASE.y, w: BASE.w, h: BASE.h }; setVB(); }

    // ---------- pointer interaction ----------
    var ptrs = {}, downT = null, downPos = null, moved = false, pinchD = 0, last = null;
    svg.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(ptrs).length;
      if (n === 1) { downT = e.target; downPos = { x: e.clientX, y: e.clientY }; moved = false; last = { x: e.clientX, y: e.clientY }; }
      if (n === 2) { var k2 = Object.keys(ptrs); pinchD = dist(ptrs[k2[0]], ptrs[k2[1]]); moved = true; }
    });
    function dist(a, b) { var x = a.x - b.x, y = a.y - b.y; return Math.sqrt(x * x + y * y); }
    svg.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var keys = Object.keys(ptrs);
      if (keys.length === 2) {
        var a = ptrs[keys[0]], b = ptrs[keys[1]], d = dist(a, b);
        if (pinchD > 0) { var c = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2); zoomAt(d / pinchD, c.x, c.y); }
        pinchD = d; return;
      }
      if (!downPos) return;
      if (!moved && Math.abs(e.clientX - downPos.x) + Math.abs(e.clientY - downPos.y) > 7) {
        moved = true; try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        svg.classList.add('dragging');
      }
      if (moved && vb.w < BASE.w) {
        var p1 = toSvg(last.x, last.y), p2 = toSvg(e.clientX, e.clientY);
        vb.x -= p2.x - p1.x; vb.y -= p2.y - p1.y; clampVB(); setVB();
      }
      last = { x: e.clientX, y: e.clientY };
    });
    function up(e) {
      var wasTap = ptrs[e.pointerId] && !moved && Object.keys(ptrs).length === 1;
      delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length < 2) pinchD = 0;
      svg.classList.remove('dragging');
      if (wasTap && e.type === 'pointerup') {
        var s = toSvg(e.clientX, e.clientY), ll = unproj(s.x, s.y);
        var iso = downT && downT.getAttribute ? downT.getAttribute('data-iso') : null;
        if (!iso && opts.snapPins !== false) iso = nearestPin(s.x, s.y, 9 / Math.sqrt(BASE.w / vb.w));
        if (opts.onTap) opts.onTap({ lon: ll[0], lat: ll[1], iso: iso });
      }
      if (!Object.keys(ptrs).length) { downPos = null; downT = null; }
    }
    function nearestPin(x, y, maxD) {
      var best = null, bd = maxD;
      Object.keys(pins).forEach(function (k) {
        var p = pins[k], dx = +p.getAttribute('cx') - x, dy = +p.getAttribute('cy') - y, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < bd) { bd = dd; best = k; }
      });
      return best;
    }
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', function (e) {
      if (!opts.wheel && !e.ctrlKey) return;
      e.preventDefault();
      var c = toSvg(e.clientX, e.clientY); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, c.x, c.y);
    }, { passive: false });
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', function (e) {
      var step = vb.w * 0.1, handled = true;
      if (e.key === 'ArrowLeft') vb.x -= step; else if (e.key === 'ArrowRight') vb.x += step;
      else if (e.key === 'ArrowUp') vb.y -= step; else if (e.key === 'ArrowDown') vb.y += step;
      else if (e.key === '+' || e.key === '=') zoomAt(1.25, vb.x + vb.w / 2, vb.y + vb.h / 2);
      else if (e.key === '-' || e.key === '_') zoomAt(0.8, vb.x + vb.w / 2, vb.y + vb.h / 2);
      else if (e.key === '0') reset();
      else handled = false;
      if (handled) { e.preventDefault(); clampVB(); setVB(); }
    });

    setVB();
    return {
      svg: svg, setPins: setPins, highlight: highlight, clearMarks: clearMarks, dropFlag: dropFlag, line: line,
      fly: fly, clearRoutes: clearRoutes, focusOn: focusOn, reset: reset,
      zoomIn: function () { zoomAt(1.4, vb.x + vb.w / 2, vb.y + vb.h / 2); },
      zoomOut: function () { zoomAt(1 / 1.4, vb.x + vb.w / 2, vb.y + vb.h / 2); },
      serpent: serpent
    };
  }

  window.AQ = window.AQ || {};
  window.AQ.map = { create: create, haversine: haversine, bearing: bearing, proj: proj };
})();
