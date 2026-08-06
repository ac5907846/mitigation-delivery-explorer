/* Shared helpers */
const $ = s => document.querySelector(s);
const fmt1 = x => x.toFixed(1);
const fmt2 = x => x.toFixed(2);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function showTip(html, x, y){
  const tip = $('#tip');
  tip.innerHTML = html; tip.style.opacity = 1;
  const w = tip.offsetWidth, vw = window.innerWidth;
  tip.style.left = Math.min(x + 14, vw - w - 10) + 'px';
  tip.style.top = (y + 14) + 'px';
}
function hideTip(){ $('#tip').style.opacity = 0; }

function svgEl(tag, attrs){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function seqColor(t){
  const steps = ['--seq100','--seq200','--seq300','--seq400','--seq500','--seq600','--seq700'];
  return css(steps[Math.min(6, Math.max(0, Math.round(t * 6)))]);
}
