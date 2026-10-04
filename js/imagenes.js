/* imagenes.js: ilustraciones SVG del equipo y medidor de salud de la batería (sin dependencias).
   Si existe la foto real en img/equipos/, app.js la muestra en lugar de la ilustración. */
const DeviceArt = (() => {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Celular: notch hasta el iPhone 14 e isla dinámica desde el iPhone 15 (año 2023). */
  function phone(v) {
    const s = v.spec;
    const top = s.year >= 2023
      ? '<rect class="art-dark" x="104" y="24" width="32" height="9" rx="4.5"/>'
      : '<path class="art-dark" d="M100 20h40v3a6 6 0 0 1-6 6h-28a6 6 0 0 1-6-6z"/>';
    return `<svg class="art" viewBox="0 0 240 290" role="img" aria-label="Ilustración de ${esc(v.name)}">
      <rect class="art-body" x="70" y="8" width="100" height="274" rx="20"/>
      <rect class="art-screen" x="76" y="14" width="88" height="262" rx="15"/>
      ${top}
      <rect class="art-cell" x="94" y="112" width="48" height="28" rx="5"/>
      <rect class="art-cell" x="142" y="120" width="4" height="12" rx="1.5"/>
      <rect class="art-cellfill" x="98" y="116" width="36" height="20" rx="3"/>
      <text class="art-tx" x="120" y="170" text-anchor="middle" font-size="13" font-weight="600">${esc(v.name)}</text>
      <text class="art-tx2" x="120" y="188" text-anchor="middle" font-size="11">${s.capacityMAh} mAh</text>
      <rect class="art-dark" x="104" y="266" width="32" height="3" rx="1.5"/>
    </svg>`;
  }

  function laptop(v) {
    const s = v.spec;
    return `<svg class="art" viewBox="0 0 320 200" role="img" aria-label="Ilustración de ${esc(v.name)}">
      <rect class="art-body" x="52" y="14" width="216" height="134" rx="9"/>
      <rect class="art-screen" x="59" y="21" width="202" height="120" rx="4"/>
      <rect class="art-cell" x="134" y="42" width="48" height="28" rx="5"/>
      <rect class="art-cell" x="182" y="50" width="4" height="12" rx="1.5"/>
      <rect class="art-cellfill" x="138" y="46" width="36" height="20" rx="3"/>
      <text class="art-tx" x="160" y="96" text-anchor="middle" font-size="14" font-weight="600">${esc(v.name)}</text>
      <text class="art-tx2" x="160" y="115" text-anchor="middle" font-size="12">${s.capacityWh} Wh</text>
      <path class="art-base" d="M22 152h276l8 14a5 5 0 0 1-4 8H18a5 5 0 0 1-4-8z"/>
      <rect class="art-dark" x="134" y="152" width="52" height="5" rx="2.5"/>
    </svg>`;
  }

  /** Ilustración del equipo según el tipo ('phone' o 'laptop'). */
  const draw = (kind, v) => kind === 'laptop' ? laptop(v) : phone(v);

  /** Batería que se llena según el SOH (0 a 1). La raya marca el 80 %, el fin de vida. */
  function gauge(soh) {
    const f = Math.max(0, Math.min(1, soh));
    const cls = f >= 0.8 ? 'g-ok' : f >= 0.7 ? 'g-warn' : 'g-bad';
    const eol = (8 + 174 * 0.8).toFixed(1);
    return `<svg class="gauge-svg" viewBox="0 0 210 66" role="img" aria-label="Salud de la batería ${(f * 100).toFixed(0)} %">
      <rect class="gg-frame" x="2" y="6" width="190" height="54" rx="11"/>
      <rect class="gg-cap" x="194" y="22" width="9" height="22" rx="3"/>
      <rect class="gg-fill ${cls}" x="8" y="12" width="${(174 * f).toFixed(1)}" height="42" rx="7"/>
      <line class="gg-eol" x1="${eol}" x2="${eol}" y1="9" y2="57"/>
    </svg>`;
  }

  return { draw, gauge };
})();