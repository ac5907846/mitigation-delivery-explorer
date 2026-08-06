/* Boot: data loading, theme, stat tiles, redraw wiring */

const APP = { data: null, geo: null };

/* ---------- theme ---------- */
const root = document.documentElement;
function storedTheme(){ try { return localStorage.getItem('mde-theme'); } catch (e) { return null; } }
function setTheme(t){
  root.dataset.theme = t;
  $('#themeBtn').textContent = t === 'dark' ? 'Light' : 'Dark';
  try { localStorage.setItem('mde-theme', t); } catch (e) {}
  if (APP.data) drawAll();
}

/* ---------- stat tiles ---------- */
function drawTiles(){
  $('#tiles').innerHTML = [
    {v:'4.20', s:' yr', l:'median approval-to-closeout, censoring-aware', c:'var(--s1)'},
    {v:'92', s:'%', l:'of competitive projects exceed their own proposed schedule (median 2.59×)', c:'var(--s1)'},
    {v:'43.2', s:'%', l:'finish >5% below their funded amount; only 18% grow', c:'var(--s2)'},
    {v:'30', s:'%', l:'of delivery-time variance sits between administering states', c:'var(--s3)'},
  ].map(t => `<div class="tile"><div class="v">${t.v}<small>${t.s}</small></div><div class="l">${t.l}</div><div class="bar" style="background:${t.c}"></div></div>`).join('');
}

/* ---------- redraw ---------- */
function drawAll(){
  drawHist(); drawFam(); drawProg(); drawTrend(); drawMap(); drawPlanner();
  if (MAP.sel){
    const s = APP.data.states.find(x => x.state === MAP.sel);
    if (s) renderStatePanel(s);
  }
}

/* ---------- boot ---------- */
async function boot(){
  root.dataset.theme = storedTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeBtn').onclick = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#themeBtn').textContent = root.dataset.theme === 'dark' ? 'Light' : 'Dark';

  try {
    const [summary, families, programs, states, geo] = await Promise.all([
      'data/summary.json', 'data/families.json', 'data/programs.json',
      'data/states.json', 'data/us-states.geojson',
    ].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); })));
    APP.data = { summary, families, programs, states };
    APP.geo = geo;
  } catch (err) {
    const e = $('#loadError');
    e.style.display = 'block';
    e.innerHTML = '<b>Could not load the data files.</b> This page reads its data from the <code>data/</code> folder with <code>fetch()</code>, which browsers block when a page is opened directly from disk. Serve the folder over HTTP instead, for example <code>python -m http.server</code> in this directory, or deploy to any static host such as GitHub Pages.';
    return;
  }

  drawTiles();
  famOptions();
  const s0 = APP.data.states.find(s => s.state === 'Florida') || APP.data.states[0];
  MAP.sel = s0.state;
  drawAll();
  addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(drawAll, 150); });
}

boot();
