/* app.js: interfaz (controles, indicadores, gráficas). Requiere devices.js, model.js y charts.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  // ---- Dispositivo y modelo elegidos (simulador.html?device=phone&model=iphone-15) ----
  const params = new URLSearchParams(location.search);
  const device = DEVICES.find(d => d.id === params.get('device')) || DEVICES[0];
  document.documentElement.setAttribute('data-device', device.id);
  let variant = resolveVariant(device, params.get('model'));

  // Filtro de dispositivos dentro del simulador
  $('variantLabel').textContent = device.filterLabel;
  $('variant').innerHTML = device.variants.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  $('variant').value = variant.id;

  function showDeviceInfo() {
    $('devTitle').textContent = 'Degradación de batería: ' + variant.name;
    $('devDesc').textContent = device.description;
    $('devPill').textContent = variant.name;
    $('devIcon').innerHTML = `<use href="#i-${device.icon}"/>`;
    renderDevicePanel();
  }

  /** Panel derecho: imagen del equipo, ficha real de la batería y medidor de salud. */
  function renderDevicePanel() {
    const s = variant.spec, box = $('devImg'), id = variant.id;
    $('specName').textContent = variant.name;
    $('specModel').textContent = s.modelName && s.modelName !== variant.name ? 'Modelo de referencia: ' + s.modelName : '';

    // Mantiene la ilustración hasta confirmar que la imagen opcional está disponible.
    box.classList.remove('has-photo');
    box.innerHTML = DeviceArt.draw(device.icon, variant);
    if (variant.image) {
      const img = new Image();
      img.alt = 'Foto de ' + variant.name;
      img.onload = () => {
        if (variant.id === id) {
          img.className = 'device-photo';
          box.classList.add('has-photo');
          box.replaceChildren(img);
        }
      };
      img.src = variant.image;
    }

    const rows = [];
    if (s.capacityMAh) rows.push(['Capacidad nominal', s.capacityMAh + ' mAh']);
    rows.push(['Energía', s.capacityWh.toFixed(2) + ' Wh']);
    if (s.capacityMAh) rows.push(['Voltaje nominal', (s.capacityWh / s.capacityMAh * 1000).toFixed(2) + ' V']);
    rows.push(['Ciclos al 80 % (fabricante)', s.ratedCycles], ['Química', s.chemistry], ['Año', s.year]);
    $('specList').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('specNote').textContent = (s.estimated ? 'Dato estimado, aún no confirmado por el fabricante. ' : '') + s.source;
  }
  showDeviceInfo();

  // ---- Controles del escenario: para agregar uno nuevo, añade una línea aquí ----
  const CONTROLS = [
    { id: 'tempC',      label: 'Temperatura ambiente',  unit: '°C',   min: -10, max: 45,  step: 1,   value: 25 },
    { id: 'dischargeC', label: 'Corriente de descarga', unit: 'C',    min: 0.2, max: 3,   step: 0.1, value: 0.5 },
    { id: 'chargeC',    label: 'Corriente de carga',    unit: 'C',    min: 0.2, max: 3,   step: 0.1, value: 0.5 },
    { id: 'smin',       label: 'SOC mínimo',            unit: '%',    min: 0,   max: 60,  step: 5,   value: 20 },
    { id: 'smax',       label: 'SOC máximo',            unit: '%',    min: 60,  max: 100, step: 5,   value: 90 },
    { id: 'cycles',     label: 'Ciclos por día',        unit: '',     min: 0,   max: 4,   step: 1,   value: 1 },
    { id: 'years',      label: 'Horizonte',             unit: 'años', min: 1,   max: 20,  step: 1,   value: 10 }
  ];

  CONTROLS.forEach(c => { c.def = c.value; });
  const presetValue = c => variant.preset[c.id] !== undefined ? variant.preset[c.id] : c.def;
  CONTROLS.forEach(c => { c.value = presetValue(c); });

  $('ctls').innerHTML = CONTROLS.map(c =>
    `<div class="ctl"><label for="${c.id}">${c.label}<output id="out-${c.id}">${c.value} ${c.unit}</output></label>` +
    `<input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div>`).join('');

  /** Lee los sliders y devuelve los parámetros para el modelo. */
  function readParams() {
    const p = {};
    CONTROLS.forEach(c => {
      p[c.id] = +$(c.id).value;
      $('out-' + c.id).textContent = (p[c.id] + ' ' + c.unit).trim();
    });
    p.smin /= 100; p.smax /= 100;
    if (p.smin > p.smax - 0.05) p.smin = p.smax - 0.05;
    return p;
  }

  let reference = null, current = null;

  function renderKpis(r, p) {
    const s = variant.spec, last = r.soh.length - 1, soh = r.soh[last], cal = r.cal[last], cyc = r.cyc[last], tot = cal + cyc || 1;
    const nominal = s.capacityMAh ? s.capacityMAh + ' mAh' : s.capacityWh + ' Wh';
    const left = s.capacityMAh ? Math.round(s.capacityMAh * soh) + ' mAh' : (s.capacityWh * soh).toFixed(1) + ' Wh';
    const fecEol = r.eolYears ? Math.round(r.eolYears * r.fecPerYear) : null;
    const items = [
      ['clock',   r.eolYears ? r.eolYears.toFixed(1) + ' años' : '> ' + p.years + ' años', 'Vida útil hasta 80 % SOH', 'main'],
      ['battery', (soh * 100).toFixed(1) + ' %', 'SOH a ' + p.years + ' años', ''],
      ['battery', left, 'Capacidad restante a ' + p.years + ' años (nominal ' + nominal + ')', ''],
      ['cycle',   fecEol !== null ? fecEol : '> ' + Math.round(p.years * r.fecPerYear), 'Ciclos completos hasta 80 % (fabricante: ' + s.ratedCycles + ')', ''],
      ['pie',     Math.round(cal / tot * 100) + ' / ' + Math.round(cyc / tot * 100) + ' %', 'Reparto calendárica / cíclica', ''],
      ['thermo',  r.tMax.toFixed(1) + ' °C', 'Temperatura máxima de celda', ''],
      ['cycle',   Math.round(r.fecPerYear), 'Ciclos equivalentes por año', ''],
      ['bolt',    (p.chargeC * s.capacityWh).toFixed(1) + ' W', 'Potencia de carga (descarga: ' + (p.dischargeC * s.capacityWh).toFixed(1) + ' W)', '']
    ];
    $('kpis').innerHTML = items.map(([icon, v, l, cls]) =>
      `<div class="kpi ${cls}"><span class="ico"><svg class="ic"><use href="#i-${icon}"/></svg></span><div><b>${v}</b><span>${l}</span></div></div>`).join('');
  }

  /** Batería del panel derecho: se llena según el SOH al final del horizonte. */
  function renderGauge(r, p) {
    const s = variant.spec, soh = r.soh[r.soh.length - 1];
    const left = s.capacityMAh ? Math.round(s.capacityMAh * soh) + ' mAh' : (s.capacityWh * soh).toFixed(1) + ' Wh';
    $('gauge').innerHTML = DeviceArt.gauge(soh);
    $('gaugeCap').textContent = 'Salud a ' + p.years + ' años: ' + (soh * 100).toFixed(1) + ' % · ' + left;
  }

  function renderSohChart(r, p) {
    const refSoh = reference && reference.years === p.years ? reference.result.soh : [1];
    const low = Math.min(...r.soh, ...refSoh);
    const yMin = Math.floor((Math.min(low, 0.85) - 0.02) * 20) / 20;
    Charts.render($('c1'), {
      xMax: p.years, yMin, yMax: 1, fmtY: v => (v * 100).toFixed(0) + '%',
      draw: (sx, sy) => {
        let s = `<line class="l-eol" x1="${sx(0)}" x2="${sx(p.years)}" y1="${sy(0.8)}" y2="${sy(0.8)}"/>`;
        if (reference) s += `<path class="l-ref" d="${Charts.pathOf(reference.result.years, reference.result.soh, sx, sy)}"/>`;
        return s + `<path class="l-soh" d="${Charts.pathOf(r.years, r.soh, sx, sy)}"/>`;
      }
    });
  }

  function renderLossChart(r, p) {
    const total = r.years.map((_, i) => r.cal[i] + r.cyc[i]);
    const yMax = Math.max(5, Math.ceil(Math.max(...total) / 5) * 5);
    const back = (xs, ys, sx, sy) => xs.map((x, i) => 'L' + sx(x).toFixed(1) + ' ' + sy(ys[i]).toFixed(1)).reverse().join('');
    Charts.render($('c2'), {
      xMax: p.years, yMin: 0, yMax, fmtY: v => v.toFixed(0) + '%',
      draw: (sx, sy) =>
        `<path class="a-cal" d="${Charts.pathOf(r.years, r.cal, sx, sy)}L${sx(p.years)} ${sy(0)}L${sx(0)} ${sy(0)}Z"/>` +
        `<path class="a-cyc" d="${Charts.pathOf(r.years, total, sx, sy)}${back(r.years, r.cal, sx, sy)}Z"/>`
    });
  }

  function update() {
    const p = readParams();
    current = BatteryModel.run(p, variant.model);
    renderKpis(current, p);
    renderGauge(current, p);
    renderSohChart(current, p);
    renderLossChart(current, p);
  }

  function reportRecommendations(p, soh) {
    const recommendations = [];
    const isPhone = device.id === 'phone';

    if (current.tMax >= 35 || p.tempC >= 30) {
      recommendations.push('Evita dejar el equipo al sol, dentro de un auto caliente o sobre superficies que retengan calor. Si se calienta durante la carga o una tarea exigente, deja que se ventile y reduce esa actividad hasta que se enfríe.');
    } else {
      recommendations.push('Procura mantener el equipo en un lugar fresco y ventilado; el calor sostenido acelera el envejecimiento químico de las baterías.');
    }

    if (p.smax >= 0.95) {
      recommendations.push(isPhone
        ? 'Si no necesitas toda la autonomía, activa la carga optimizada o el límite de carga que ofrezca tu teléfono y evita dejarlo conectado al 100 % durante muchas horas.'
        : 'Como suele permanecer conectado, revisa si tu laptop ofrece un límite de carga o modo de cuidado de batería y úsalo cuando no necesites autonomía completa.');
    } else if (p.smin < 0.15) {
      recommendations.push('Evita que las descargas profundas hasta niveles muy bajos sean una rutina; conectar el equipo antes de que llegue casi a cero puede reducir el esfuerzo de la batería.');
    } else {
      recommendations.push('Mantén hábitos de carga moderados: evita tanto las descargas frecuentes hasta cero como permanecer innecesariamente al 100 % durante periodos largos.');
    }

    if (p.cycles >= 2 || p.chargeC >= 1.5 || p.dischargeC >= 1.5) {
      recommendations.push('Cuando sea posible, evita combinar cargas rápidas con tareas de alto consumo por periodos prolongados; en una laptop, usa una superficie firme que no obstruya la ventilación.');
    } else {
      recommendations.push('Usa cargadores y accesorios compatibles recomendados por el fabricante; no es necesario agotar por completo la batería antes de volver a cargarla.');
    }

    if (soh < 0.8) {
      recommendations.push('La proyección baja del 80 % dentro del horizonte seleccionado. Si en el uso real notas menos autonomía o apagados inesperados, consulta el diagnóstico de batería del sistema o un servicio técnico autorizado antes de decidir un reemplazo.');
    } else {
      recommendations.push('Revisa periódicamente la autonomía real y el diagnóstico de batería del sistema. Si notas cambios importantes, contrástalos con una medición del propio equipo.');
    }

    return recommendations;
  }

  function renderReport() {
    const p = readParams(), result = current;
    const soh = result.soh[result.soh.length - 1];
    const spec = variant.spec;
    const health = (soh * 100).toFixed(1);
    const capacity = spec.capacityMAh
      ? Math.round(spec.capacityMAh * soh) + ' mAh'
      : (spec.capacityWh * soh).toFixed(1) + ' Wh';
    const status = soh >= 0.8 ? 'Proyección favorable' : soh >= 0.5 ? 'Desgaste notable proyectado' : 'Desgaste avanzado proyectado';
    const eol = result.eolYears !== null
      ? 'En este escenario, el modelo estima que la batería podría cruzar el umbral del 80 % en aproximadamente ' + result.eolYears.toFixed(1) + ' años.'
      : 'En este escenario, el modelo no proyecta que la batería cruce el umbral del 80 % durante los ' + p.years + ' años simulados.';
    const recommendations = reportRecommendations(p, soh);
    const generatedAt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    $('printReport').innerHTML = `
      <header class="report-header">
        <div class="report-brand">Healthy <strong>Battery</strong></div>
        <p>Reporte de estado estimado de batería</p>
        <h1>${escapeHTML(variant.name)}</h1>
        <span>Generado el ${escapeHTML(generatedAt)}</span>
      </header>
      <section class="report-status">
        <div><span class="report-label">Salud estimada al horizonte</span><strong>${health} %</strong><small>${escapeHTML(status)}</small></div>
        <div><span class="report-label">Capacidad restante estimada</span><strong>${escapeHTML(capacity)}</strong><small>Capacidad nominal: ${escapeHTML(capacityLabel(spec))}</small></div>
        <div><span class="report-label">Vida útil estimada hasta 80 %</span><strong>${result.eolYears !== null ? result.eolYears.toFixed(1) + ' años' : '> ' + p.years + ' años'}</strong><small>${escapeHTML(eol)}</small></div>
      </section>
      <p class="report-disclaimer"><strong>Importante:</strong> este documento resume una simulación basada en el modelo, las especificaciones del equipo y el escenario seleccionado. No es una lectura de sensores ni un diagnóstico de la batería real; los resultados pueden diferir del uso cotidiano.</p>
      <section class="report-section">
        <h2>Escenario analizado</h2>
        <dl class="report-scenario">
          <div><dt>Equipo</dt><dd>${escapeHTML(variant.name)}${spec.modelName && spec.modelName !== variant.name ? ' · ' + escapeHTML(spec.modelName) : ''}</dd></div>
          <div><dt>Temperatura ambiente</dt><dd>${p.tempC} °C</dd></div>
          <div><dt>Temperatura máxima de celda estimada</dt><dd>${result.tMax.toFixed(1)} °C</dd></div>
          <div><dt>Corriente de carga / descarga</dt><dd>${p.chargeC} C / ${p.dischargeC} C</dd></div>
          <div><dt>Rango de carga</dt><dd>${Math.round(p.smin * 100)}–${Math.round(p.smax * 100)} %</dd></div>
          <div><dt>Ciclos diarios · horizonte</dt><dd>${p.cycles} · ${p.years} años</dd></div>
        </dl>
      </section>
      <section class="report-section">
        <h2>Hábitos que ayudan a cuidar tu batería</h2>
        <p class="report-message">Las baterías de ion-litio pierden capacidad gradualmente con el tiempo y el uso. No es motivo para alarmarse: mantener temperaturas moderadas, evitar extremos de carga cuando sea práctico y seguir las opciones de cuidado del fabricante puede ayudar a ralentizar ese desgaste.</p>
        <ol class="report-recommendations">${recommendations.map(item => '<li>' + escapeHTML(item) + '</li>').join('')}</ol>
      </section>
      <footer class="report-footer">Estimación educativa · Healthy Battery · Los datos técnicos dependen de la ficha del modelo; el uso real, la edad y el estado de cada batería pueden cambiar el resultado.</footer>`;
    window.print();
  }

  $('reportBtn').addEventListener('click', renderReport);
  CONTROLS.forEach(c => $(c.id).addEventListener('input', update));

  // Al cambiar de modelo: sliders con los valores del modelo, URL actualizada y recálculo
  $('variant').addEventListener('change', () => {
    variant = resolveVariant(device, $('variant').value);
    CONTROLS.forEach(c => { $(c.id).value = presetValue(c); });
    history.replaceState(null, '', `?device=${device.id}&model=${variant.id}`);
    showDeviceInfo();
    update();
  });
  $('ref').addEventListener('click', () => { reference = { result: current, years: readParams().years }; update(); });
  $('clr').addEventListener('click', () => { reference = null; update(); });
  update();
})();