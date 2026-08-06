/* Schedule reality-check tool */

function famOptions(){
  const sel = $('#pFam');
  const withG = APP.data.families.filter(f => f.g50);
  sel.innerHTML = `<option value="__all">All activity types (n=${APP.data.summary.growth_all.n.toLocaleString()})</option>` +
    withG.map(f => `<option value="${f.name}">${f.name} (n=${f.g_n})</option>`).join('');
  sel.onchange = drawPlanner;
  $('#pMonths').oninput = drawPlanner;
}

function drawPlanner(){
  const months = +$('#pMonths').value; $('#pMonthsLabel').textContent = months;
  const key = $('#pFam').value;
  const f = key === '__all' ? null : APP.data.families.find(x => x.name === key);
  const GA = APP.data.summary.growth_all;
  const G = f ? {g25:f.g25, g50:f.g50, g75:f.g75, g90:f.g90, exceed:f.exceed, n:f.g_n} : {...GA, n:GA.n};
  const med = months * G.g50, lo = months * G.g25, hi = months * G.g75, p90 = months * G.g90;
  const yr = m => m >= 24 ? (m/12).toFixed(1) + ' yr' : Math.round(m) + ' mo';
  $('#answerMedian').innerHTML = `${yr(med)}`;
  $('#answerRange').innerHTML = `${yr(lo)} – ${yr(hi)}`;
  $('#answerExceed').innerHTML = `<span class="pill" style="background:color-mix(in srgb,var(--s2) 14%,transparent);color:var(--s2)">${G.exceed}% of comparable projects ran past their proposal</span>`;
  $('#plannerNote').textContent = `Based on ${G.n.toLocaleString()} competitively awarded ${f ? f.name.toLowerCase() : 'mitigation'} projects with a recorded proposed schedule. One in ten comparable projects took longer than ${yr(p90)}.`;
  const sn = f ? `Projects of this type close at a median ${Math.round(f.ratio*100)}% of their initial award${f.ratio < 0.95 ? ', so treat the authorization as a ceiling, not a plan' : ''}.` :
    `The portfolio median project closes at 98.6% of its initial award; buyouts at 86%.`;
  $('#scopeNote').textContent = sn;

  const el = $('#plannerChart'); el.innerHTML = '';
  const W = el.clientWidth || 620, Hh = 150, m = {t:26, r:16, b:30, l:16};
  const svg = svgEl('svg', {viewBox:`0 0 ${W} ${Hh}`});
  const xmax = Math.max(p90 * 1.12, months * 1.6);
  const x = v => m.l + v / xmax * (W - m.l - m.r);
  const ticks = xmax > 96 ? [0,24,48,72,96,120,144].filter(v=>v<xmax) : [0,12,24,36,48,60,72,84].filter(v=>v<xmax);
  ticks.forEach(g => { svg.append(svgEl('line', {x1:x(g), x2:x(g), y1:m.t-4, y2:Hh-m.b, class:'gline'}));
    const t = svgEl('text', {x:x(g), y:Hh-10, 'text-anchor':'middle', class:'axis'}); t.textContent = g % 12 === 0 ? (g/12) + 'yr' : g; svg.append(t); });
  const cy = (m.t + Hh - m.b) / 2;
  svg.append(svgEl('rect', {x:x(0), y:cy-22, width:x(months)-x(0), height:12, rx:4, fill:css('--hold')}));
  const lp = svgEl('text', {x:x(months)+6, y:cy-12, class:'axis'}); lp.textContent = 'your proposal'; svg.append(lp);
  svg.append(svgEl('rect', {x:x(lo), y:cy+4, width:x(hi)-x(lo), height:12, rx:4, fill:css('--s1'), opacity:.3}));
  svg.append(svgEl('rect', {x:x(0), y:cy+4, width:x(med)-x(0), height:12, rx:4, fill:css('--s1')}));
  svg.append(svgEl('line', {x1:x(p90), x2:x(p90), y1:cy+1, y2:cy+19, stroke:css('--s2'), 'stroke-width':2}));
  const l90 = svgEl('text', {x:x(p90), y:cy+34, 'text-anchor':'middle', class:'axis'}); l90.textContent = 'P90'; l90.style.fill = 'var(--s2)'; svg.append(l90);
  const lr = svgEl('text', {x:x(med)+6, y:cy+14, class:'axis'}); lr.textContent = 'history-adjusted'; lr.style.fill='var(--ink)'; lr.style.fontWeight=600; svg.append(lr);
  el.append(svg);
}
