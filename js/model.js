/* model.js: motor del modelo de degradación (sin dependencias del DOM).
   Estados rápidos: SOC y temperatura, resueltos con EDOs (Runge-Kutta 4).
   Estados lentos: pérdida calendárica y cíclica, avanzados en bloques (cycle-jump). */
const BatteryModel = (() => {
  'use strict';

  // ---- Parámetros ajustables (celda NMC genérica) ----
  const PARAMS = {
    heatCoef: 0.0033,     // K/s por C²: calentamiento Joule
    tau: 900,             // s: constante térmica de enfriamiento
    calK: 3.4e-6,         // 1/día: pérdida calendárica base (25 °C, SOC 100 %)
    calEa: 50000,         // J/mol: energía de activación calendárica
    seiOffset: 0.005,     // evita dividir por cero en dL/dt = k / L
    cycLossPerFEC: 1e-4,  // fracción de capacidad perdida por ciclo equivalente completo
    cycEa: 20000,         // J/mol: energía de activación cíclica
    platingTemp: 15,      // °C: bajo este valor la carga acelera el plating
    platingGain: 3,       // factor extra de plating a muy baja temperatura
    resGrowth: 2,         // R = 1 + resGrowth · pérdida total
    stepDays: 10,         // días por salto de degradación
    dt: 60                // s: paso de la dinámica rápida
  };
  const R_GAS = 8.314;

  /** Factor de Arrhenius respecto a 25 °C. */
  const arrhenius = (Ea, tempC) => Math.exp(Ea / R_GAS * (1 / 298.15 - 1 / (tempC + 273.15)));

  /** Un paso de Runge-Kutta 4 para dy/dt = f(y). */
  function rk4(f, y, h) {
    const k1 = f(y);
    const k2 = f(y.map((v, i) => v + h / 2 * k1[i]));
    const k3 = f(y.map((v, i) => v + h / 2 * k2[i]));
    const k4 = f(y.map((v, i) => v + h * k3[i]));
    return y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  /** Fases del día: [corriente en C (+descarga, −carga), duración en s]. */
  function buildSchedule(p) {
    const span = p.smax - p.smin;
    const tDis = span * 3600 / p.dischargeC, tChg = span * 3600 / p.chargeC;
    const n = Math.min(p.cycles, Math.floor(86400 / (tDis + tChg)));
    if (n <= 0) return [[0, 86400]];
    const rest = (86400 - n * (tDis + tChg)) / n;
    const phases = [];
    for (let i = 0; i < n; i++) phases.push([p.dischargeC, tDis], [-p.chargeC, tChg], [0, rest]);
    return phases;
  }

  /** Simula un día y devuelve la pérdida de ese día (calendárica y cíclica). */
  function simulateDay(p, resistance, lossCal, K) {
    let y = [p.smax, p.tempC];                     // [SOC, T]
    let cal = 0, cyc = 0, tMax = p.tempC, fec = 0;
    for (const [c, dur] of buildSchedule(p)) {
      const steps = Math.max(1, Math.round(dur / K.dt)), h = dur / steps;
      const f = z => [-c / 3600, K.heatCoef * c * c * resistance - (z[1] - p.tempC) / K.tau];
      for (let i = 0; i < steps; i++) {
        y = rk4(f, y, h);
        const soc = Math.min(1, Math.max(0, y[0])), T = y[1];
        tMax = Math.max(tMax, T);
        // Calendárica: crecimiento de SEI, dL/dt = k(T, SOC) / L
        cal += K.calK * (0.3 + 0.7 * soc * soc) * arrhenius(K.calEa, T) / (lossCal + K.seiOffset) * h / 86400;
        // Cíclica: proporcional a la carga procesada
        const dFEC = Math.abs(c) / 7200 * h;
        fec += dFEC;
        const plating = c < 0 ? 1 + K.platingGain * Math.max(0, (K.platingTemp - T) / K.platingTemp) : 1;
        cyc += K.cycLossPerFEC * dFEC * (0.7 + 0.3 * Math.pow(Math.abs(c), 1.5)) * arrhenius(K.cycEa, T) * plating;
      }
    }
    return { cal, cyc, tMax, fec };
  }

  /** Corre la simulación completa. overrides = parámetros del dispositivo. p = {tempC, dischargeC, chargeC, smin, smax, cycles, years}. */
  function run(p, overrides) {
    const K = Object.assign({}, PARAMS, overrides);   // parámetros base + los del dispositivo
    const D = K.stepDays;
    const out = { years: [0], soh: [1], cal: [0], cyc: [0], tMax: p.tempC, fecPerYear: 0, eolYears: null };
    let lossCal = 0, lossCyc = 0, resistance = 1, days = 0;
    while (days < p.years * 365) {
      const d = simulateDay(p, resistance, lossCal, K);
      lossCal += d.cal * D;
      lossCyc += d.cyc * D;
      resistance = 1 + K.resGrowth * (lossCal + lossCyc);
      days += D;
      out.tMax = Math.max(out.tMax, d.tMax);
      out.fecPerYear = d.fec * 365;
      out.years.push(days / 365);
      out.soh.push(Math.max(0, 1 - lossCal - lossCyc));
      out.cal.push(lossCal * 100);
      out.cyc.push(lossCyc * 100);
    }
    for (let i = 1; i < out.soh.length; i++) {       // fin de vida: primer cruce por 80 %
      if (out.soh[i] <= 0.8) {
        const f = (out.soh[i - 1] - 0.8) / (out.soh[i - 1] - out.soh[i]);
        out.eolYears = out.years[i - 1] + f * (out.years[i] - out.years[i - 1]);
        break;
      }
    }
    return out;
  }

  return { PARAMS, run };
})();
