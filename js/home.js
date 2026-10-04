/* home.js: dibuja los recuadros de la página principal a partir de DEVICES (devices.js).
   Cada recuadro tiene un filtro (select) para elegir el modelo a calcular.
   También marca en el menú la sección que se está viendo. */
const cardsBox = document.getElementById('cards');

cardsBox.innerHTML = DEVICES.map(d => `
  <article class="dev" data-device="${d.id}">
    <div class="dev-head">
      <span class="dev-ico"><svg class="ic"><use href="#i-${d.icon}"/></svg></span>
      <div>
        <h2>${d.name}</h2>
        <p>${d.description}</p>
      </div>
    </div>
    <label class="flt">${d.filterLabel}
      <span class="sel">
        <select class="flt-sel" aria-label="${d.filterLabel}">
          ${d.variants.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
        </select>
        <svg class="ic chev" aria-hidden="true"><use href="#i-chev"/></svg>
      </span>
    </label>
    <ul class="chips"></ul>
    <a class="go" href="#">
      <svg class="ic"><use href="#i-${d.icon}"/></svg>
      <span>Simular <span class="go-name"></span></span>
      <svg class="ic"><use href="#i-arrow"/></svg>
    </a>
  </article>`).join('');

/** Un chip con ícono. */
const chip = (icon, html) => `<li><svg class="ic"><use href="#i-${icon}"/></svg>${html}</li>`;

/** Chip de capacidad: en celulares muestra mAh y Wh en dos líneas; en laptops solo Wh. */
function capacityChip(spec) {
  const html = spec.capacityMAh
    ? `<span class="two"><span>${spec.capacityMAh} mAh</span><small>+${spec.capacityWh.toFixed(2)} Wh</small></span>`
    : `<span>${spec.capacityWh} Wh</span>`;
  return chip('battery', html);
}

/** Actualiza chips y enlace de un recuadro según el modelo elegido en su filtro. */
function refreshCard(card) {
  const d = DEVICES.find(x => x.id === card.dataset.device);
  const v = resolveVariant(d, card.querySelector('.flt-sel').value);
  card.querySelector('.chips').innerHTML =
    capacityChip(v.spec) +
    chip('cycle',  `<span>${v.spec.ratedCycles} ciclos</span>`) +
    chip('thermo', `<span>${v.preset.tempC} °C</span>`) +
    chip('plug',   `<span>Carga ${v.preset.chargeC} C</span>`) +
    chip('pulse',  `<span>SOC ${v.preset.smin}–${v.preset.smax} %</span>`);
  card.querySelector('.go-name').textContent = v.name;
  card.querySelector('.go').href = `simulador.html?device=${d.id}&model=${v.id}`;
}

cardsBox.querySelectorAll('.dev').forEach(card => {
  refreshCard(card);
  card.querySelector('.flt-sel').addEventListener('change', () => refreshCard(card));
});

/* ---- Menú: resalta la sección visible ---- */
(function () {
  const links = [...document.querySelectorAll('.nav a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const setActive = id => links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-20% 0px -75% 0px' });
  sections.forEach(s => io.observe(s));
  // Al llegar al final de la página, la última sección queda marcada
  addEventListener('scroll', () => {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) setActive(sections[sections.length - 1].id);
  }, { passive: true });
})();