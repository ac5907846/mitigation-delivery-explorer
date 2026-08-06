/* Mitigation Delivery Explorer — vanilla JS + SVG */
const $ = s => document.querySelector(s);
const tip = $('#tip');
const fmt1 = x => x.toFixed(1), fmt2 = x => x.toFixed(2);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function showTip(html, x, y){ tip.innerHTML = html; tip.style.opacity = 1;
  const w = tip.offsetWidth, vw = window.innerWidth;
  tip.style.left = Math.min(x + 14, vw - w - 10) + 'px'; tip.style.top = (y + 14) + 'px'; }
function hideTip(){ tip.style.opacity = 0; }
function svgEl(tag, attrs){ const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

/* ---------- theme ---------- */
const root = document.documentElement;
function setTheme(t){ root.dataset.theme = t; $('#themeBtn').textContent = t === 'dark' ? 'Light' : 'Dark';
  localStorage.setItem('mde-theme', t); drawAll(); }
$('#themeBtn').onclick = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
const saved = localStorage.getItem('mde-theme');
root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/* ---------- stat tiles ---------- */
const H = DATA.headline;
$('#tiles').innerHTML = [
  {v:'4.20', s:' yr', l:'median approval-to-closeout, censoring-aware', c:'var(--s1)'},
  {v:'92', s:'%', l:'of competitive projects exceed their own proposed schedule (median 2.59×)', c:'var(--s1)'},
  {v:'43.2', s:'%', l:'finish >5% below their funded amount; only 18% grow', c:'var(--s2)'},
  {v:'30', s:'%', l:'of delivery-time variance sits between administering states', c:'var(--s3)'},
].map(t => `<div class="tile"><div class="v">${t.v}<small>${t.s}</small></div><div class="l">${t.l}</div><div class="bar" style="background:${t.c}"></div></div>`).join('');

/* ---------- chart 1: obligation histogram ---------- */
function drawHist(){
  const el = $('#histChart'); el.innerHTML = '';
  const {edges, share} = DATA.oblig_hist;
  const W = el.clientWidth || 480, Hh = 240, m = {t:14, r:20, b:30, l:34};
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const x = v => m.l + (v - .3) / 1.2 * (W - m.l - m.r);
  const ymax = Math.max(...share) * 1.12;
  const y = v => Hh - m.b - v / ymax * (Hh - m.t - m.b);
  [0, 5, 10, 15, 20, 25].forEach(g => { if (g > ymax) return;
    svg.append(svgEl('line', {x1:m.l, x2:W-m.r, y1:y(g), y2:y(g), class:'gline'}));
    const t = svgEl('text', {x:m.l-6, y:y(g)+3, 'text-anchor':'end', class:'axis'}); t.textContent = g; svg.append(t); });
  for (let i = 0; i < share.length; i++){
    const a = edges[i], b = edges[i+1], mid = (a+b)/2;
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

/* ---------- chart 2: deobligation by family ---------- */
function drawFam(){
  const el = $('#famChart'); el.innerHTML = '';
  const fams = DATA.families;
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

/* ---------- chart 3: program growth ---------- */
function drawProg(){
  const el = $('#progChart'); el.innerHTML = '';
  const P = DATA.programs;
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
    const band = svgEl('rect', {x:x(p.g25), y:cy-5, width:x(p.g75)-x(p.g25), height:10, rx:5, fill:css('--s1'), opacity:.28});
    svg.append(band);
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

/* ---------- chart 4: trend ---------- */
function drawTrend(){
  const el = $('#trendChart'); el.innerHTML = '';
  const T = DATA.trend;
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

/* ---------- state tile map ---------- */
const GRIDPOS = {AK:[0,0],ME:[0,11],VT:[1,10],NH:[1,11],WA:[2,1],ID:[2,2],MT:[2,3],ND:[2,4],MN:[2,5],WI:[2,6],MI:[2,7],NY:[2,9],MA:[2,10],RI:[2,11],OR:[3,1],NV:[3,2],WY:[3,3],SD:[3,4],IA:[3,5],IL:[3,6],IN:[3,7],OH:[3,8],PA:[3,9],NJ:[3,10],CT:[3,11],CA:[4,1],UT:[4,2],CO:[4,3],NE:[4,4],MO:[4,5],KY:[4,6],WV:[4,7],VA:[4,8],MD:[4,9],DE:[4,10],AZ:[5,2],NM:[5,3],KS:[5,4],AR:[5,5],TN:[5,6],NC:[5,7],SC:[5,8],DC:[5,9],OK:[6,4],LA:[6,5],MS:[6,6],AL:[6,7],GA:[6,8],HI:[7,0],TX:[7,4],FL:[7,9],PR:[7,10],VI:[7,11],GU:[0,2],MP:[0,3],AS:[0,4]};
let selState = null;
function seqColor(t){
  const steps = ['--seq100','--seq200','--seq300','--seq400','--seq500','--seq600','--seq700'];
  return css(steps[Math.min(6, Math.max(0, Math.round(t * 6)))]);
}
function drawMap(){
  const el = $('#tilemap'); el.innerHTML = '';
  const S = DATA.states;
  const lo = Math.min(...S.map(s => s.dur)), hi = Math.max(...S.map(s => s.dur));
  $('#scaleMin').textContent = fmt1(lo) + ' yr'; $('#scaleMax').textContent = fmt1(hi) + ' yr';
  const byAbbr = Object.fromEntries(S.map(s => [s.abbr, s]));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++){
    const abbr = Object.keys(GRIDPOS).find(k => GRIDPOS[k][0] === r && GRIDPOS[k][1] === c);
    const cell = document.createElement('div');
    if (abbr && byAbbr[abbr]){
      const s = byAbbr[abbr], t = (s.dur - lo) / (hi - lo);
      cell.className = 'stile' + (selState === s.state ? ' sel' : '');
      cell.style.background = seqColor(t);
      const dark = t > 0.45;
      cell.style.color = dark ? '#fff' : (root.dataset.theme === 'dark' ? '#0b0b0b' : css('--seq700'));
      cell.innerHTML = `<span>${abbr}</span><em>${fmt1(s.dur)}</em>`;
      cell.onclick = () => { selState = s.state; drawMap(); renderStatePanel(s); };
      cell.addEventListener('mousemove', e => showTip(`<b>${s.state}</b> · n=${s.n.toLocaleString()}<br>${fmt2(s.dur)} yr mean to closeout<br>${s.deob}% deobligated`, e.clientX, e.clientY));
      cell.addEventListener('mouseleave', hideTip);
    } else { cell.style.visibility = 'hidden'; }
    el.append(cell);
  }
}
function renderStatePanel(s){
  const N = DATA.national;
  const d = (v, n, unit, goodLow) => {
    const diff = v - n; const sign = diff > 0 ? '+' : '';
    return `<span class="d">(nat'l ${n}${unit}, ${sign}${fmt1(diff)})</span>`; };
  $('#statePanel').innerHTML = `
    <h3>${s.state}</h3>
    <div class="cap">${s.n.toLocaleString()} projects in the joint cohort</div>
    <div class="stat-row"><span class="k">Mean years to closeout</span><span class="v">${fmt2(s.dur)} ${d(s.dur, N.dur, '')}</span></div>
    <div class="stat-row"><span class="k">Projects deobligated</span><span class="v">${s.deob}% ${d(s.deob, N.deob, '%')}</span></div>
    <div class="stat-row"><span class="k">Median final ÷ initial award</span><span class="v">${Number(s.ratio).toFixed(3)}</span></div>
    <div class="stat-row"><span class="k">Most common activity</span><span class="v" style="font-weight:500">${s.top_family}</span></div>
    <div class="note" style="margin-top:14px">Estimates shrunk toward the national mean in proportion to sample size, so small portfolios cannot top the table on noise. Differences reflect the administering office as much as the projects: the same activity mix moves at different speeds in different states.</div>`;
}

/* ---------- planner ---------- */
function famOptions(){
  const sel = $('#pFam');
  const withG = DATA.families.filter(f => f.g50);
  sel.innerHTML = `<option value="__all">All activity types (n=${DATA.growth_all.n.toLocaleString()})</option>` +
    withG.map(f => `<option value="${f.name}">${f.name} (n=${f.g_n})</option>`).join('');
  sel.onchange = drawPlanner; $('#pMonths').oninput = drawPlanner;
}
function drawPlanner(){
  const months = +$('#pMonths').value; $('#pMonthsLabel').textContent = months;
  const key = $('#pFam').value;
  const f = key === '__all' ? null : DATA.families.find(x => x.name === key);
  const G = f ? {g25:f.g25, g50:f.g50, g75:f.g75, g90:f.g90, exceed:f.exceed, n:f.g_n} : {...DATA.growth_all, n:DATA.growth_all.n};
  const med = months * G.g50, lo = months * G.g25, hi = months * G.g75, p90 = months * G.g90;
  const yr = m => m >= 24 ? (m/12).toFixed(1) + ' yr' : Math.round(m) + ' mo';
  $('#answerMedian').innerHTML = `${yr(med)}`;
  $('#answerRange').innerHTML = `${yr(lo)} – ${yr(hi)}`;
  $('#answerExceed').innerHTML = `<span class="pill" style="background:color-mix(in srgb,var(--s2) 14%,transparent);color:var(--s2)">${G.exceed}% of comparable projects ran past their proposal</span>`;
  $('#plannerNote').textContent = `Based on ${G.n.toLocaleString()} competitively awarded ${f ? f.name.toLowerCase() : 'mitigation'} projects with a recorded proposed schedule. One in ten comparable projects took longer than ${yr(p90)}.`;
  const sn = f ? `Projects of this type close at a median ${Math.round(f.ratio*100)}% of their initial award${f.ratio < 0.95 ? ', so treat the authorization as a ceiling, not a plan' : ''}.` :
    `The portfolio median project closes at 98.6% of its initial award; buyouts at 86%.`;
  $('#scopeNote').textContent = sn;
  // chart
  const el = $('#plannerChart'); el.innerHTML = '';
  const W = el.clientWidth || 620, Hh = 150, m = {t:26, r:16, b:30, l:16};
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const xmax = Math.max(p90 * 1.12, months * 1.6);
  const x = v => m.l + v / xmax * (W - m.l - m.r);
  const ticks = xmax > 96 ? [0,24,48,72,96,120,144].filter(v=>v<xmax) : [0,12,24,36,48,60,72,84].filter(v=>v<xmax);
  ticks.forEach(g => { svg.append(svgEl('line', {x1:x(g), x2:x(g), y1:m.t-4, y2:Hh-m.b, class:'gline'}));
    const t = svgEl('text', {x:x(g), y:Hh-10, 'text-anchor':'middle', class:'axis'}); t.textContent = g % 12 === 0 ? (g/12) + 'yr' : g; svg.append(t); });
  const cy = (m.t + Hh - m.b) / 2;
  // proposed
  svg.append(svgEl('rect', {x:x(0), y:cy-22, width:x(months)-x(0), height:12, rx:4, fill:css('--hold')}));
  const lp = svgEl('text', {x:x(months)+6, y:cy-12, class:'axis'}); lp.textContent = 'your proposal'; svg.append(lp);
  // realistic band
  svg.append(svgEl('rect', {x:x(lo), y:cy+4, width:x(hi)-x(lo), height:12, rx:4, fill:css('--s1'), opacity:.3}));
  svg.append(svgEl('rect', {x:x(0), y:cy+4, width:x(med)-x(0), height:12, rx:4, fill:css('--s1')}));
  svg.append(svgEl('line', {x1:x(p90), x2:x(p90), y1:cy+1, y2:cy+19, stroke:css('--s2'), 'stroke-width':2}));
  const l90 = svgEl('text', {x:x(p90), y:cy+34, 'text-anchor':'middle', class:'axis'}); l90.textContent = 'P90'; l90.style.fill = 'var(--s2)'; svg.append(l90);
  const lr = svgEl('text', {x:x(med)+6, y:cy+14, class:'axis'}); lr.textContent = 'history-adjusted'; lr.style.fill='var(--ink)'; lr.style.fontWeight=600; svg.append(lr);
  el.append(svg);
}

/* ---------- boot ---------- */
function drawAll(){ drawHist(); drawFam(); drawProg(); drawTrend(); drawMap(); drawPlanner();
  if (selState) renderStatePanel(DATA.states.find(s => s.state === selState)); }
famOptions();
setTheme(root.dataset.theme);
const s0 = DATA.states.find(s => s.state === 'Florida') || DATA.states[0];
selState = s0.state; drawMap(); renderStatePanel(s0);
addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(drawAll, 150); });
