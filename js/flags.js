/* Atlas Quest — flags drawn with simple SVG shapes.
   Only flags that can be faithfully drawn with stripes, crosses, discs, triangles and
   five-pointed stars are included. Anything with a coat of arms, script or detailed emblem
   is deliberately skipped rather than drawn wrong. Colours are close approximations of the
   official values; proportions follow the official ratio where stated, otherwise 3:2. */
(function () {
  'use strict';
  var uid = 0;

  function star(cx, cy, r, fill) {
    var pts = [], i, a, rr;
    for (i = 0; i < 10; i++) {
      a = (-90 + i * 36) * Math.PI / 180;
      rr = i % 2 === 0 ? r : r * 0.381966;
      pts.push((cx + rr * Math.cos(a)).toFixed(3) + ',' + (cy + rr * Math.sin(a)).toFixed(3));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }
  function rect(x, y, w, h, f) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>';
  }
  function poly(pts, f) { return '<polygon points="' + pts + '" fill="' + f + '"/>'; }
  function circle(cx, cy, r, f) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>'; }

  // stripes: dir 'h' or 'v', colours, optional weights
  function stripes(W, H, dir, cols, wts) {
    wts = wts || cols.map(function () { return 1; });
    var tot = wts.reduce(function (a, b) { return a + b; }, 0), pos = 0, out = '';
    cols.forEach(function (c, i) {
      var s = (dir === 'h' ? H : W) * wts[i] / tot;
      out += dir === 'h' ? rect(0, pos, W, s + 0.02, c) : rect(pos, 0, s + 0.02, H, c);
      pos += s;
    });
    return out;
  }
  function nordic(W, H, bg, cross, vx, vw, hy, inner, ix, iw, iy) {
    var o = rect(0, 0, W, H, bg) + rect(vx, 0, vw, H, cross) + rect(0, hy, W, vw, cross);
    if (inner) o += rect(ix, 0, iw, H, inner) + rect(0, iy, W, iw, inner);
    return o;
  }

  var F = {
    // ---- vertical tricolours (3:2) ----
    FR: [30, 20, function () { return stripes(30, 20, 'v', ['#0055A4', '#FFFFFF', '#EF4135']); }],
    IT: [30, 20, function () { return stripes(30, 20, 'v', ['#009246', '#FFFFFF', '#CE2B37']); }],
    IE: [30, 15, function () { return stripes(30, 15, 'v', ['#169B62', '#FFFFFF', '#FF883E']); }],
    BE: [15, 13, function () { return stripes(15, 13, 'v', ['#000000', '#FDDA24', '#EF3340']); }],
    RO: [30, 20, function () { return stripes(30, 20, 'v', ['#002B7F', '#FCD116', '#CE1126']); }],
    TD: [30, 20, function () { return stripes(30, 20, 'v', ['#002664', '#FECB00', '#C60C30']); }],
    ML: [30, 20, function () { return stripes(30, 20, 'v', ['#14B53A', '#FCD116', '#CE1126']); }],
    GN: [30, 20, function () { return stripes(30, 20, 'v', ['#CE1126', '#FCD116', '#009460']); }],
    CI: [30, 20, function () { return stripes(30, 20, 'v', ['#F77F00', '#FFFFFF', '#009E60']); }],
    NG: [40, 20, function () { return stripes(40, 20, 'v', ['#008751', '#FFFFFF', '#008751']); }],
    PE: [30, 20, function () { return stripes(30, 20, 'v', ['#D91023', '#FFFFFF', '#D91023']); }, 'Civil flag (the state flag adds a coat of arms).'],
    CM: [30, 20, function () { return stripes(30, 20, 'v', ['#007A5E', '#CE1126', '#FCD116']) + star(15, 10.4, 3.2, '#FCD116'); }],
    SN: [30, 20, function () { return stripes(30, 20, 'v', ['#00853F', '#FDEF42', '#E31B23']) + star(15, 10.4, 3.2, '#00853F'); }],
    // ---- horizontal stripes ----
    DE: [50, 30, function () { return stripes(50, 30, 'h', ['#000000', '#DD0000', '#FFCE00']); }],
    NL: [30, 20, function () { return stripes(30, 20, 'h', ['#AE1C28', '#FFFFFF', '#21468B']); }],
    RU: [30, 20, function () { return stripes(30, 20, 'h', ['#FFFFFF', '#0039A6', '#D52B1E']); }],
    AT: [30, 20, function () { return stripes(30, 20, 'h', ['#C8102E', '#FFFFFF', '#C8102E']); }],
    HU: [40, 20, function () { return stripes(40, 20, 'h', ['#CE2939', '#FFFFFF', '#477050']); }],
    BG: [50, 30, function () { return stripes(50, 30, 'h', ['#FFFFFF', '#00966E', '#D62612']); }],
    EE: [33, 21, function () { return stripes(33, 21, 'h', ['#0072CE', '#000000', '#FFFFFF']); }],
    LT: [50, 30, function () { return stripes(50, 30, 'h', ['#FDB913', '#006A44', '#C1272D']); }],
    LV: [40, 20, function () { return stripes(40, 20, 'h', ['#9E3039', '#FFFFFF', '#9E3039'], [2, 1, 2]); }],
    LU: [50, 30, function () { return stripes(50, 30, 'h', ['#EA141D', '#FFFFFF', '#51ADDA']); }],
    YE: [30, 20, function () { return stripes(30, 20, 'h', ['#CE1126', '#FFFFFF', '#000000']); }],
    GA: [40, 30, function () { return stripes(40, 30, 'h', ['#009E60', '#FCD116', '#3A75C4']); }],
    SL: [30, 20, function () { return stripes(30, 20, 'h', ['#1EB53A', '#FFFFFF', '#0072C6']); }],
    UA: [30, 20, function () { return stripes(30, 20, 'h', ['#0057B7', '#FFD700']); }],
    PL: [40, 25, function () { return stripes(40, 25, 'h', ['#FFFFFF', '#DC143C']); }],
    ID: [30, 20, function () { return stripes(30, 20, 'h', ['#CE1126', '#FFFFFF']); }],
    MC: [25, 20, function () { return stripes(25, 20, 'h', ['#CE1126', '#FFFFFF']); }],
    CO: [30, 20, function () { return stripes(30, 20, 'h', ['#FCD116', '#003893', '#CE1126'], [2, 1, 1]); }],
    AM: [40, 20, function () { return stripes(40, 20, 'h', ['#D90012', '#0033A0', '#F2A800']); }],
    MU: [30, 20, function () { return stripes(30, 20, 'h', ['#EA2839', '#1A206D', '#FFD500', '#00A551']); }],
    TH: [30, 20, function () { return stripes(30, 20, 'h', ['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], [1, 1, 2, 1, 1]); }],
    GM: [30, 20, function () { return stripes(30, 20, 'h', ['#CE1126', '#FFFFFF', '#0C1C8C', '#FFFFFF', '#3A7728'], [6, 1, 4, 1, 6]); }],
    BW: [36, 24, function () { return stripes(36, 24, 'h', ['#75AADB', '#FFFFFF', '#000000', '#FFFFFF', '#75AADB'], [9, 1, 4, 1, 9]); }],
    SR: [30, 20, function () { return stripes(30, 20, 'h', ['#377E3F', '#FFFFFF', '#B40A2D', '#FFFFFF', '#377E3F'], [2, 1, 4, 1, 2]) + star(15, 10.3, 3.8, '#ECC81D'); }],
    GH: [30, 20, function () { return stripes(30, 20, 'h', ['#CE1126', '#FCD116', '#006B3F']) + star(15, 10.3, 3.4, '#000000'); }],
    BF: [30, 20, function () { return stripes(30, 20, 'h', ['#EF2B2D', '#009E49']) + star(15, 10.3, 3.4, '#FCD116'); }],
    LA: [30, 20, function () { return stripes(30, 20, 'h', ['#CE1126', '#002868', '#CE1126'], [1, 2, 1]) + circle(15, 10, 4, '#FFFFFF'); }],
    NE: [28, 24, function () { return stripes(28, 24, 'h', ['#E05206', '#FFFFFF', '#0DB02B']) + circle(14, 12, 3.4, '#E05206'); }],
    // ---- Nordic crosses (official proportions) ----
    DK: [37, 28, function () { return nordic(37, 28, '#C8102E', '#FFFFFF', 12, 4, 12); }],
    SE: [16, 10, function () { return nordic(16, 10, '#006AA7', '#FECC00', 5, 2, 4); }],
    FI: [18, 11, function () { return nordic(18, 11, '#FFFFFF', '#002F6C', 5, 3, 4); }],
    NO: [22, 16, function () { return nordic(22, 16, '#BA0C2F', '#FFFFFF', 6, 4, 6, '#00205B', 7, 2, 7); }],
    IS: [25, 18, function () { return nordic(25, 18, '#02529C', '#FFFFFF', 7, 4, 7, '#DC1E35', 8, 2, 8); }],
    // ---- discs ----
    JP: [30, 20, function () { return rect(0, 0, 30, 20, '#FFFFFF') + circle(15, 10, 6, '#BC002D'); }],
    BD: [10, 6, function () { return rect(0, 0, 10, 6, '#006A4E') + circle(4.5, 3, 2, '#F42A41'); }],
    PW: [8, 5, function () { return rect(0, 0, 8, 5, '#4AADD6') + circle(3.5, 2.5, 1.5, '#FFDE00'); }],
    // ---- single stars ----
    VN: [30, 20, function () { return rect(0, 0, 30, 20, '#DA251D') + star(15, 10.5, 6, '#FFFF00'); }],
    SO: [30, 20, function () { return rect(0, 0, 30, 20, '#4189DD') + star(15, 10.4, 4.2, '#FFFFFF'); }],
    // ---- squares ----
    CH: [20, 20, function () { return rect(0, 0, 20, 20, '#DA291C') + rect(8.125, 3.75, 3.75, 12.5, '#FFFFFF') + rect(3.75, 8.125, 12.5, 3.75, '#FFFFFF'); }],
    // ---- hoist bands ----
    BJ: [30, 20, function () { return rect(0, 0, 30, 10, '#FCD116') + rect(0, 10, 30, 10, '#E8112D') + rect(0, 0, 12, 20, '#008751'); }],
    MG: [30, 20, function () { return rect(0, 0, 30, 10, '#FC3D32') + rect(0, 10, 30, 10, '#007E3A') + rect(0, 0, 10, 20, '#FFFFFF'); }],
    AE: [40, 20, function () { return stripes(40, 20, 'h', ['#009639', '#FFFFFF', '#000000']) + rect(0, 0, 10, 20, '#EF3340'); }],
    GW: [30, 15, function () { return rect(0, 0, 30, 7.5, '#FCD116') + rect(0, 7.5, 30, 7.5, '#009E49') + rect(0, 0, 10, 15, '#CE1126') + star(5, 7.8, 2.8, '#000000'); }],
    // ---- triangles ----
    CZ: [30, 20, function () { return rect(0, 0, 30, 10, '#FFFFFF') + rect(0, 10, 30, 10, '#D7141A') + poly('0,0 15,10 0,20', '#11457E'); }],
    PS: [40, 20, function () { return stripes(40, 20, 'h', ['#000000', '#FFFFFF', '#009736']) + poly('0,0 13.333,10 0,20', '#CE1126'); }],
    SD: [40, 20, function () { return stripes(40, 20, 'h', ['#D21034', '#FFFFFF', '#000000']) + poly('0,0 13.333,10 0,20', '#007229'); }],
    BS: [40, 20, function () { return stripes(40, 20, 'h', ['#00778B', '#FFC72C', '#00778B']) + poly('0,0 17.32,10 0,20', '#000000'); }],
    CU: [40, 20, function () { return stripes(40, 20, 'h', ['#002A8F', '#FFFFFF', '#002A8F', '#FFFFFF', '#002A8F']) + poly('0,0 17.32,10 0,20', '#CF142B') + star(5.9, 10.4, 3.3, '#FFFFFF'); }],
    DJ: [30, 20, function () { return rect(0, 0, 30, 10, '#6AB2E7') + rect(0, 10, 30, 10, '#12AD2B') + poly('0,0 17.32,10 0,20', '#FFFFFF') + star(5.9, 10.3, 2.6, '#D7141A'); }],
    // ---- cantons ----
    CL: [30, 20, function () { return rect(0, 0, 30, 10, '#FFFFFF') + rect(0, 10, 30, 10, '#D52B1E') + rect(0, 0, 10, 10, '#0039A6') + star(5, 5.3, 2.6, '#FFFFFF'); }],
    TG: [32.4, 20, function () { return stripes(32.4, 20, 'h', ['#006A4E', '#FFCE00', '#006A4E', '#FFCE00', '#006A4E']) + rect(0, 0, 12, 12, '#D21034') + star(6, 6.3, 4, '#FFFFFF'); }],
    LR: [38, 20, function () {
      var o = '', h = 20 / 11, i;
      for (i = 0; i < 11; i++) o += rect(0, i * h, 38, h + 0.02, i % 2 ? '#FFFFFF' : '#BF0A30');
      return o + rect(0, 0, 5 * h, 5 * h, '#002868') + star(2.5 * h, 2.5 * h + 0.2, 3, '#FFFFFF');
    }],
    GR: [27, 18, function () {
      var o = '', i;
      for (i = 0; i < 9; i++) o += rect(0, i * 2, 27, 2.02, i % 2 ? '#FFFFFF' : '#0D5EAF');
      return o + rect(0, 0, 10, 10, '#0D5EAF') + rect(0, 4, 10, 2, '#FFFFFF') + rect(4, 0, 2, 10, '#FFFFFF');
    }],
    // ---- saltires & unions ----
    JM: [40, 20, function () {
      return rect(0, 0, 40, 20, '#000000') + poly('0,0 40,0 20,10', '#009B3A') + poly('0,20 40,20 20,10', '#009B3A') +
        '<path d="M0,0 L40,20 M40,0 L0,20" stroke="#FED100" stroke-width="2.7"/>';
    }],
    GB: [60, 30, function () {
      var a = 'aqs' + (++uid), b = 'aqt' + uid;
      return '<defs><clipPath id="' + a + '"><path d="M0,0 v30 h60 v-30 z"/></clipPath>' +
        '<clipPath id="' + b + '"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath></defs>' +
        '<g clip-path="url(#' + a + ')"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/>' +
        '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6"/>' +
        '<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#' + b + ')" stroke="#C8102E" stroke-width="4"/>' +
        '<path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" stroke-width="10"/>' +
        '<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g>';
    }]
  };

  function svg(iso, label) {
    var f = F[iso];
    if (!f) return '';
    return '<svg class="flag-svg" viewBox="0 0 ' + f[0] + ' ' + f[1] + '" role="img" aria-label="' +
      (label || 'Flag').replace(/"/g, '&quot;') + '" preserveAspectRatio="xMidYMid meet">' + f[2]() + '</svg>';
  }

  window.AQ = window.AQ || {};
  window.AQ.flags = {
    has: function (iso) { return !!F[iso]; },
    svg: svg,
    note: function (iso) { return (F[iso] && F[iso][3]) || ''; },
    list: function () { return Object.keys(F); }
  };
})();
