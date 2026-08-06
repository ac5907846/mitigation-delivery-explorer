/* Portfolio charts: obligation histogram, deobligation by family, program growth, trend */

function drawHist(){
  const el = $('#histChart'); el.innerHTML = '';
  const {edges, share} = APP.data.summary.oblig_hist;
  const W = el.clientWidth || 480, Hh = 240, m = {t:14, r:20, b:30, l:34};
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const x = v => m.l + (v - .3) / 1.2 * (W - m.l - m.r);
  const ymax = Math.max(...share) * 1.12;
  const y = v => Hh - m.b - v / ymax * (Hh - m.t - m.b);
  [0, 5, 10, 15, 20, 25].forEach(g => { if (g > ymax) return;
    svg.append(svgEl('line', {x1:m.l, x2:W-m.r, y1:y(g), y2:y(g), class:'gline'}));
    const t = svgEl('text', {x:m.l-6, y:y(g)+3, 'text-anchor':'end', class:'axis'}); t.textContent = g; svg.append(t); });
  for (let i = 0; i < share.length; i++){
    const a = edges[i], b = edges[i+1];
    const col = b <= 0.95 ? css('--s2') : (a >= 1.05 ? css('--s1') : css('--hold'));
    const bx = x(a)+1, bw = x(b)-x(a)-2, by = y(share[i]), bh = Hh-m.b-by;
    const r = svgEl('rect', {x:bx, y:by, width:Math.max(bw,1), height:Math.max(bh,0), fill:col, rx:2});
    r.addEventListener('mousemove', e => showTip(`<b>${fmt2(a)}–${fmt2(b)}</b> of award<br>${share[i].toFixed(1)}% of projects`, e.clientX, e.clientY));
    r.addEventListener('mouseleave', hideTip);
    svg.append(r);
  }
  [[0.3,'≤0.3'],[0.5,'0.5'],[0.75,'0.75'],[1.0,'1.0'],[1.25,'1.25'],[1.5,'≥1.5']].forEach(([v,l]) => {
    const t = svgEl('text', {x:x(v), y:Hh-10, 'text-anchor':'middle', class:'axis'}); t.textContent = l; svg.append(t); });
  svg.append(svgEl('line', {x1:x(1), x2:x(1), y1:m.t, y2:Hh-m.b, stroke:css('--ink-3'), 'stroke-width':1, 'stroke-dasharray':'3 3'}));
  el.append(svg);
}

function drawFam(){
  const el = $('#famChart'); el.innerHTML = '';
  const fams = APP.data.families;
  const W = el.clientWidth || 480, rowH = 24, m = {t:20, r:44, b:22, l:168};
  const Hh = m.t + fams.length * rowH + m.b;
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const x = v => m.l + v / 100 * (W - m.l - m.r);
  [0, 25, 50, 75, 100].forEach(g => {
    svg.append(svgEl('line', {x1:x(g), x2:x(g), y1:m.t, y2:Hh-m.b, class:'gline'}));
    const t = svgEl('text', {x:x(g), y:Hh-8, 'text-anchor':'middle', class:'axis'}); t.textContent = g + '%'; svg.append(t); });
  fams.forEach((f, i) => {
    const cy = m.t + i * rowH + rowH/2;
    const lab = svgEl('text', {x:m.l-8, y:cy+3.5, 'text-anchor':'end', class:'axis'});
    lab.textContent = f.name.length > 24 ? f.name.slice(0,23) + '…' : f.name;
    lab.style.fill = 'var(--ink-2)'; lab.style.fontSize = '11.5px'; svg.append(lab);
    const col = f.name === 'Property acquisition' ? css('--s2') : css('--s1');
    const bar = svgEl('rect', {x:x(0), y:cy-6, width:x(f.deob)-x(0), height:12, rx:3, fill:col, opacity:f.name==='Property acquisition'?1:.75});
    bar.addEventListener('mousemove', e => showTip(`<b>${f.name}</b><br>${f.deob}% deobligated at least once<br>median final/initial: ${f.ratio}<br>median delivery ${f.km_yr} yr · n=${f.n.toLocaleString()}`, e.clientX, e.clientY));
    bar.addEventListener('mouseleave', hideTip);
    svg.append(bar);
    const v = svgEl('text', {x:x(f.deob)+5, y:cy+3.5, class:'axis'}); v.textContent = f.deob; v.style.fontWeight = 600; v.style.fill = 'var(--ink)'; svg.append(v);
  });
  svg.append(svgEl('line', {x1:x(68.3), x2:x(68.3), y1:m.t, y2:Hh-m.b, stroke:css('--ink-3'), 'stroke-width':1, 'stroke-dasharray':'3 3'}));
  const nt = svgEl('text', {x:x(68.3), y:12, 'text-anchor':'middle', class:'axis'}); nt.textContent = 'portfolio 68.3%'; svg.append(nt);
  el.append(svg);
}

function drawProg(){
  const el = $('#progChart'); el.innerHTML = '';
  const P = APP.data.programs;
  const W = el.clientWidth || 480, rowH = 34, m = {t:8, r:16, b:26, l:56};
  const Hh = m.t + P.length * rowH + m.b;
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const xmax = 13;
  const x = v => m.l + v / xmax * (W - m.l - m.r);
  [1,2,4,6,8,10,12].forEach(g => {
    svg.append(svgEl('line', {x1:x(g), x2:x(g), y1:m.t, y2:Hh-m.b, class:'gline'}));
    const t = svgEl('text', {x:x(g), y:Hh-8, 'text-anchor':'middle', class:'axis'}); t.textContent = g + '×'; svg.append(t); });
  svg.append(svgEl('line', {x1:x(1), x2:x(1), y1:m.t, y2:Hh-m.b, stroke:css('--ink-3'), 'stroke-width':1.2}));
  P.forEach((p, i) => {
    const cy = m.t + i * rowH + rowH/2;
    const lab = svgEl('text', {x:m.l-8, y:cy+3.5, 'text-anchor':'end', class:'axis'}); lab.textContent = p.name; lab.style.fontWeight = 600; lab.style.fill = 'var(--ink-2)'; svg.append(lab);
    svg.append(svgEl('rect', {x:x(p.g25), y:cy-5, width:x(p.g75)-x(p.g25), height:10, rx:5, fill:css('--s1'), opacity:.28}));
    svg.append(svgEl('line', {x1:x(p.g90), x2:x(p.g90), y1:cy-7, y2:cy+7, stroke:css('--s1'), 'stroke-width':2}));
    const dot = svgEl('circle', {cx:x(p.g50), cy:cy, r:5.5, fill:css('--s1')});
    const hit = svgEl('rect', {x:m.l, y:cy-rowH/2, width:W-m.l-m.r, height:rowH, fill:'transparent'});
    hit.addEventListener('mousemove', e => showTip(`<b>${p.name}</b> · n=${p.n}<br>proposes ~${p.prop_mo} mo, realizes ~${p.real_mo} mo<br>growth: P25 ${p.g25}× · median ${p.g50}× · P75 ${p.g75}× · P90 ${p.g90}×<br>${p.exceed}% exceed the proposal`, e.clientX, e.clientY));
    hit.addEventListener('mouseleave', hideTip);
    svg.append(dot); svg.append(hit);
    const v = svgEl('text', {x:x(p.g50), y:cy-10, 'text-anchor':'middle', class:'axis'}); v.textContent = p.g50 + '×'; v.style.fontWeight = 600; v.style.fill = 'var(--ink)'; svg.append(v);
  });
  el.append(svg);
}

function drawTrend(){
  const el = $('#trendChart'); el.innerHTML = '';
  const T = APP.data.summary.trend;
  const W = el.clientWidth || 480, Hh = 240, m = {t:14, r:12, b:28, l:34};
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const x = yv => m.l + (yv - 1999) / 22 * (W - m.l - m.r);
  const y = v => Hh - m.b - (v - 2) / 3.5 * (Hh - m.t - m.b);
  [2,3,4,5].forEach(g => { svg.append(svgEl('line', {x1:m.l, x2:W-m.r, y1:y(g), y2:y(g), class:'gline'}));
    const t = svgEl('text', {x:m.l-6, y:y(g)+3, 'text-anchor':'end', class:'axis'}); t.textContent = g; svg.append(t); });
  [1999,2005,2010,2015,2021].forEach(g => { const t = svgEl('text', {x:x(g), y:Hh-8, 'text-anchor':'middle', class:'axis'}); t.textContent = g; svg.append(t); });
  const path = T.map((d,i) => (i ? 'L' : 'M') + x(d.y) + ' ' + y(d.med)).join(' ');
  svg.append(svgEl('path', {d:path, fill:'none', stroke:css('--s1'), 'stroke-width':2.2, 'stroke-linejoin':'round'}));
  T.forEach(d => {
    const c = svgEl('circle', {cx:x(d.y), cy:y(d.med), r:3.4, fill:css('--s1'), stroke:'var(--card)', 'stroke-width':1.5});
    c.addEventListener('mousemove', e => showTip(`<b>Approved ${d.y}</b><br>median ${d.med} yr to closeout<br>n=${d.n.toLocaleString()} closed projects`, e.clientX, e.clientY));
    c.addEventListener('mouseleave', hideTip);
    svg.append(c);
  });
  el.append(svg);
}
