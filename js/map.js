/* Geographic choropleth: mean years to closeout by administering state */

const MAP = { sel: null, lo: 0, hi: 1 };

function stateByName(name){ return APP.data.states.find(s => s.state === name); }

function drawMap(){
  const el = $('#usmap'); el.innerHTML = '';
  const S = APP.data.states;
  MAP.lo = Math.min(...S.map(s => s.dur));
  MAP.hi = Math.max(...S.map(s => s.dur));
  $('#scaleMin').textContent = fmt1(MAP.lo) + ' yr';
  $('#scaleMax').textContent = fmt1(MAP.hi) + ' yr';
  $('#rampNote').textContent = document.documentElement.dataset.theme === 'dark' ? 'lighter = slower' : 'darker = slower';

  const mappable = {
    type: 'FeatureCollection',
    features: APP.geo.features.filter(f => f.properties.name !== 'Puerto Rico')
  };
  const Wv = 975, Hv = 600;
  const proj = d3.geoAlbersUsa().fitSize([Wv, Hv - 10], mappable);
  const path = d3.geoPath(proj);

  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${Wv} ${Hv}`)
    .attr('role', 'img')
    .attr('aria-label', 'Choropleth map of mean years to closeout by administering state');

  svg.selectAll('path')
    .data(mappable.features)
    .join('path')
    .attr('d', path)
    .attr('class', f => {
      const s = stateByName(f.properties.name);
      return s ? 'state' + (MAP.sel === s.state ? ' sel' : '') : 'nodata';
    })
    .attr('fill', f => {
      const s = stateByName(f.properties.name);
      return s ? seqColor((s.dur - MAP.lo) / (MAP.hi - MAP.lo)) : undefined;
    })
    .on('mousemove', (e, f) => {
      const s = stateByName(f.properties.name);
      if (s) showTip(`<b>${s.state}</b> · n=${s.n.toLocaleString()}<br>${fmt2(s.dur)} yr mean to closeout<br>${s.deob}% deobligated`, e.clientX, e.clientY);
      else showTip(`<b>${f.properties.name}</b><br>fewer than 25 projects in the joint cohort; no estimate shown`, e.clientX, e.clientY);
    })
    .on('mouseleave', hideTip)
    .on('click', (e, f) => {
      const s = stateByName(f.properties.name);
      if (s) selectState(s);
    });

  drawTerritoryChips();
}

function drawTerritoryChips(){
  const el = $('#terrChips'); el.innerHTML = '';
  const offMap = ['Puerto Rico', 'Guam', 'Virgin Islands of the U.S.', 'Northern Mariana Islands', 'American Samoa'];
  offMap.forEach(name => {
    const s = stateByName(name);
    if (!s) return;
    const b = document.createElement('button');
    b.textContent = `${s.abbr} · ${fmt1(s.dur)} yr`;
    b.className = MAP.sel === s.state ? 'sel' : '';
    b.onclick = () => selectState(s);
    b.addEventListener('mousemove', e => showTip(`<b>${s.state}</b> · n=${s.n.toLocaleString()}<br>${fmt2(s.dur)} yr mean to closeout<br>${s.deob}% deobligated`, e.clientX, e.clientY));
    b.addEventListener('mouseleave', hideTip);
    el.append(b);
  });
}

function selectState(s){
  MAP.sel = s.state;
  drawMap();
  renderStatePanel(s);
}

function renderStatePanel(s){
  const N = APP.data.summary.national;
  const d = (v, n, unit) => {
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
