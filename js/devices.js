/* devices.js: catálogo de dispositivos. Para agregar uno nuevo, añade un objeto a DEVICES.
   - preset:   valores iniciales de los sliders del simulador (base para todo el tipo de dispositivo)
   - model:    parámetros del motor (ver PARAMS en model.js)
   - variants: filtro de dispositivos a calcular. Cada variante puede sobrescribir preset y model, y trae su ficha real:
       spec:  { modelName, year, capacityMAh (solo celulares), capacityWh, ratedCycles, chemistry, source, estimated? }
       image: ruta opcional de una foto en img/equipos/. Si el archivo no existe, se dibuja una ilustración con la capacidad real.
   La pérdida por ciclo del motor se calibra sola con los ciclos nominales del fabricante: cycLossPerFEC = 0.2 / ratedCycles.
   Los valores de uso (preset) siguen siendo estimaciones genéricas, ajústalos a tu gusto. */

const SRC_IPHONE = 'Capacidad: certificaciones y fichas técnicas (Apple no publica los mAh; solo la etiqueta energética de la UE desde el iPhone 17). ' +
                   'Ciclos: documento de soporte de Apple (500 ciclos hasta el iPhone 14; 1000 desde el iPhone 15, en condiciones ideales).';
const SRC_ASUS = 'Capacidad: ficha técnica del modelo de referencia. Ciclos: el Centro de información de baterías de ASUS habla de 300 a 500 ciclos; ' +
                 'se usa el extremo alto (500) como valor nominal.';

const DEVICES = [
  {
    id: 'phone', name: 'Celular', icon: 'phone',
    description: 'Carga diaria, uso intenso y más calor por su tamaño compacto.',
    filterLabel: 'Modelo de iPhone',
    preset: { tempC: 30, dischargeC: 0.25, chargeC: 0.8, smin: 10, smax: 100, cycles: 1, years: 5 },
    model:  { heatCoef: 0.006, tau: 600 },
    variants: [
      { id: 'iphone-11', name: 'iPhone 11', preset: { chargeC: 0.7 }, image: 'img/equipos/iphone-11.png',
        spec: { modelName: 'iPhone 11', year: 2019, capacityMAh: 3110, capacityWh: 11.91, ratedCycles: 500, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-12', name: 'iPhone 12', preset: { chargeC: 0.7 }, image: 'img/equipos/iphone-12.png',
        spec: { modelName: 'iPhone 12', year: 2020, capacityMAh: 2815, capacityWh: 10.78, ratedCycles: 500, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-13', name: 'iPhone 13', preset: { chargeC: 0.7 }, image: 'img/equipos/iphone-13.png',
        spec: { modelName: 'iPhone 13', year: 2021, capacityMAh: 3227, capacityWh: 12.41, ratedCycles: 500, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-14', name: 'iPhone 14', preset: { chargeC: 0.8 }, image: 'img/equipos/iphone-14.png',
        spec: { modelName: 'iPhone 14', year: 2022, capacityMAh: 3279, capacityWh: 12.68, ratedCycles: 500, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-15', name: 'iPhone 15', preset: { chargeC: 0.8 }, image: 'img/equipos/iphone-15.png',
        spec: { modelName: 'iPhone 15', year: 2023, capacityMAh: 3349, capacityWh: 12.98, ratedCycles: 1000, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-16', name: 'iPhone 16', preset: { chargeC: 0.9 }, image: 'img/equipos/iphone-16.png',
        spec: { modelName: 'iPhone 16', year: 2024, capacityMAh: 3561, capacityWh: 13.84, ratedCycles: 1000, chemistry: 'Li-ion', source: SRC_IPHONE } },
      { id: 'iphone-17', name: 'iPhone 17', preset: { chargeC: 0.9 }, image: 'img/equipos/iphone-17.png',
        spec: { modelName: 'iPhone 17 (modelo eSIM)', year: 2025, capacityMAh: 3692, capacityWh: 14.35, ratedCycles: 1000, chemistry: 'Li-ion', source: SRC_IPHONE } },
      // El iPhone 18 estándar llega en 2027; la única cifra filtrada es la del iPhone 18 Pro (certificación 3C).
      { id: 'iphone-18', name: 'iPhone 18 Pro', preset: { chargeC: 0.9 }, image: 'img/equipos/iphone-18.png',
        spec: { modelName: 'iPhone 18 Pro', year: 2026, capacityMAh: 4288, capacityWh: 16.68, ratedCycles: 1000, chemistry: 'Li-ion', estimated: true,
                source: SRC_IPHONE + ' Capacidad filtrada (certificación 3C), no confirmada por Apple; ciclos supuestos igual que el iPhone 15 y posteriores.' } }
    ]
  },
  {
    id: 'laptop', name: 'Laptop', icon: 'laptop',
    description: 'Muchas horas conectada al 100 %, con descargas suaves y buena ventilación.',
    filterLabel: 'Línea ASUS',
    preset: { tempC: 28, dischargeC: 0.3, chargeC: 0.5, smin: 20, smax: 100, cycles: 1, years: 6 },
    model:  { heatCoef: 0.004, tau: 1200 },
    variants: [
      { id: 'asus-vivobook',  name: 'ASUS Vivobook',      preset: { dischargeC: 0.25 }, model: { heatCoef: 0.0035 }, image: 'img/equipos/asus-vivobook.png',
        spec: { modelName: 'Vivobook S 14 OLED (S5406)', year: 2024, capacityWh: 75, ratedCycles: 500, chemistry: 'Li-ion polímero', source: SRC_ASUS } },
      { id: 'asus-zenbook',   name: 'ASUS Zenbook',       preset: { dischargeC: 0.2 },  model: { heatCoef: 0.0035 }, image: 'img/equipos/asus-zenbook.png',
        spec: { modelName: 'Zenbook 14 OLED (UX3405)', year: 2024, capacityWh: 75, ratedCycles: 600, chemistry: 'Li-ion polímero',
                source: SRC_ASUS + ' Para este modelo ASUS afirma hasta un 20 % más de ciclos que la generación anterior, por eso se usa 600.' } },
      { id: 'asus-expert',    name: 'ASUS ExpertBook',    preset: { dischargeC: 0.25 }, model: { heatCoef: 0.0038 }, image: 'img/equipos/asus-expertbook.png',
        spec: { modelName: 'ExpertBook B9 OLED (B9403)', year: 2023, capacityWh: 63, ratedCycles: 500, chemistry: 'Li-ion polímero', source: SRC_ASUS } },
      { id: 'asus-proart',    name: 'ASUS ProArt',        preset: { dischargeC: 0.4 },  model: { heatCoef: 0.0048 }, image: 'img/equipos/asus-proart.png',
        spec: { modelName: 'ProArt P16 (H7606)', year: 2025, capacityWh: 90, ratedCycles: 500, chemistry: 'Li-ion polímero', source: SRC_ASUS } },
      { id: 'asus-tuf',       name: 'ASUS TUF Gaming',    preset: { dischargeC: 0.5, tempC: 30 }, model: { heatCoef: 0.0055 }, image: 'img/equipos/asus-tuf.png',
        spec: { modelName: 'TUF Gaming A15 (FA507)', year: 2024, capacityWh: 90, ratedCycles: 500, chemistry: 'Li-ion polímero',
                source: SRC_ASUS + ' Algunas versiones antiguas del A15 traen 56 Wh; aquí se usa la de 90 Wh.' } },
      { id: 'asus-rog',       name: 'ASUS ROG Zephyrus',  preset: { dischargeC: 0.6, tempC: 30 }, model: { heatCoef: 0.006 }, image: 'img/equipos/asus-rog.png',
        spec: { modelName: 'ROG Zephyrus G14 (GA403)', year: 2025, capacityWh: 73, ratedCycles: 500, chemistry: 'Li-ion polímero', source: SRC_ASUS } }
    ]
  }
];

/** Devuelve la variante pedida (o la primera) con preset, model y ficha ya combinados con los del dispositivo.
    La pérdida por ciclo se calibra con los ciclos nominales del fabricante (80 % de capacidad al llegar a ratedCycles). */
function resolveVariant(device, variantId) {
  const v = device.variants.find(x => x.id === variantId) || device.variants[0];
  const spec = Object.assign({}, v.spec);
  const calibrated = spec.ratedCycles ? { cycLossPerFEC: 0.2 / spec.ratedCycles } : {};
  return {
    id: v.id,
    name: v.name,
    image: v.image || null,
    spec: spec,
    preset: Object.assign({}, device.preset, v.preset),
    model: Object.assign({}, device.model, calibrated, v.model)
  };
}

/** Texto corto de capacidad: "3349 mAh · 12.98 Wh" en celulares y "75 Wh" en laptops. */
function capacityLabel(spec) {
  return spec.capacityMAh ? spec.capacityMAh + ' mAh · ' + spec.capacityWh.toFixed(2) + ' Wh' : spec.capacityWh + ' Wh';
}