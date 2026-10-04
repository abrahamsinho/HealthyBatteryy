/* charts.js: utilidades para dibujar gráficas SVG (sin librerías). */
const Charts = (() => {
  'use strict';
  const W = 640, H = 280, M = { l: 46, r: 12, t: 10, b: 26 };

  /** Convierte listas xs, ys en un trazo SVG ("M x y L x y ..."). */
  const pathOf = (xs, ys, sx, sy) =>
    xs.map((x, i) => (i ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(ys[i]).toFixed(1)).join('');

  /** Dibuja ejes y cuadrícula; `draw(sx, sy)` devuelve el SVG de las series. */
  function render(el, { xMax, yMin, yMax, fmtY, draw }) {
    const sx = x => M.l + x / xMax * (W - M.l - M.r);
    const sy = y => M.t + (1 - (y - yMin) / (yMax - yMin)) * (H - M.t - M.b);
    let svg = '';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (yMax - yMin) * i / 4;
      svg += `<line class="g" x1="${M.l}" x2="${W - M.r}" y1="${sy(v)}" y2="${sy(v)}"/>` +
             `<text class="tx" x="${M.l - 6}" y="${sy(v) + 4}" text-anchor="end">${fmtY(v)}</text>`;
    }
    const step = xMax <= 5 ? 1 : xMax <= 10 ? 2 : 5;
    for (let x = 0; x <= xMax; x += step)
      svg += `<text class="tx" x="${sx(x)}" y="${H - 8}" text-anchor="middle">${x}</text>`;
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${svg + draw(sx, sy)}</svg>`;
  }

  return { render, pathOf };
})();
