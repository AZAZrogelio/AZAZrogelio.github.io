/**
 * ============================================================
 *  calculos.js  —  Calculadoras de Circuitos Eléctricos
 * ============================================================
 *  Arquitectura orientada a objetos (POO):
 *
 *  Clases base:
 *    Calculadora          — clase abstracta con render de resultados
 *
 *  Clases de circuito:
 *    PotenciaCA           — P activa, Q reactiva, S aparente, FP
 *    CircuitoRC           — τ, Vc(t), carga/descarga, energía
 *    CircuitoRL           — τ, I(t), energía magnética
 *    CircuitoRLC          — f₀, ω₀, α, discriminante, raíces, régimen
 *
 *  Clase de UI:
 *    FormController       — vincula un formulario HTML con una calculadora
 *    App                  — inicializa todos los controladores
 * ============================================================
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
   UTILIDADES MATEMÁTICAS
   ───────────────────────────────────────────────────────────── */

/**
 * Redondea un número a `n` cifras significativas.
 * @param {number} valor
 * @param {number} cifras
 * @returns {number}
 */
function redondear(valor, cifras = 6) {
  if (!isFinite(valor) || valor === 0) return valor;
  const factor = Math.pow(10, cifras - Math.floor(Math.log10(Math.abs(valor))) - 1);
  return Math.round(valor * factor) / factor;
}

/**
 * Formatea un número con notación científica si es muy grande o muy pequeño.
 * @param {number} valor
 * @param {number} decimales
 * @returns {string}
 */
function formatear(valor, decimales = 4) {
  if (!isFinite(valor)) return "∞ (indefinido)";
  const abs = Math.abs(valor);
  if (abs === 0) return "0";
  if (abs >= 1e6 || (abs < 1e-3 && abs > 0)) {
    return valor.toExponential(decimales);
  }
  return valor.toFixed(decimales);
}

/**
 * Prefijos SI para presentación de unidades.
 * @param {number} valor
 * @param {string} unidad
 * @returns {string}
 */
function prefixSI(valor, unidad) {
  const abs = Math.abs(valor);
  if (abs >= 1e9)  return `${formatear(valor / 1e9, 4)} G${unidad}`;
  if (abs >= 1e6)  return `${formatear(valor / 1e6, 4)} M${unidad}`;
  if (abs >= 1e3)  return `${formatear(valor / 1e3, 4)} k${unidad}`;
  if (abs >= 1)    return `${formatear(valor, 4)} ${unidad}`;
  if (abs >= 1e-3) return `${formatear(valor * 1e3, 4)} m${unidad}`;
  if (abs >= 1e-6) return `${formatear(valor * 1e6, 4)} μ${unidad}`;
  if (abs >= 1e-9) return `${formatear(valor * 1e9, 4)} n${unidad}`;
  return `${formatear(valor * 1e12, 4)} p${unidad}`;
}


/* ─────────────────────────────────────────────────────────────
   CLASE BASE: Calculadora
   ───────────────────────────────────────────────────────────── */

class Calculadora {
  /**
   * @param {string} idResultado - ID del elemento <p> donde se muestra el resultado.
   */
  constructor(idResultado) {
    this.elResultado = document.getElementById(idResultado);
  }

  /**
   * Renderiza el resultado en el DOM usando HTML.
   * @param {string} html
   */
  mostrarResultado(html) {
    if (this.elResultado) {
      this.elResultado.innerHTML = html;
    }
  }

  /**
   * Muestra un error de validación con formato claro.
   * @param {string} mensaje
   */
  mostrarError(mensaje) {
    this.mostrarResultado(
      `<span style="color:#ff6b6b;">⚠ Error: ${mensaje}</span>`
    );
  }

  /**
   * Valida que todos los valores sean números finitos y positivos.
   * @param  {...number} valores
   * @returns {boolean}
   */
  validarPositivos(...valores) {
    for (const v of valores) {
      if (!isFinite(v) || isNaN(v) || v <= 0) return false;
    }
    return true;
  }

  /**
   * Método abstracto que deben implementar las subclases.
   */
  calcular() {
    throw new Error("calcular() debe ser implementado por la subclase.");
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: PotenciaCA
   Calcula potencia activa, reactiva y aparente en circuitos CA.
   ───────────────────────────────────────────────────────────── */

class PotenciaCA extends Calculadora {
  /**
   * @param {number} Vrms  - Voltaje eficaz (V)
   * @param {number} Irms  - Corriente eficaz (A)
   * @param {number} cosPhi - Factor de potencia cos(φ), entre 0 y 1
   * @param {string} idResultado
   */
  constructor(Vrms, Irms, cosPhi, idResultado) {
    super(idResultado);
    this.Vrms   = Vrms;
    this.Irms   = Irms;
    this.cosPhi = cosPhi;
  }

  calcular() {
    const { Vrms, Irms, cosPhi } = this;

    // ── Validaciones ──────────────────────────────────────────
    if (!isFinite(Vrms) || Vrms <= 0)
      return this.mostrarError("Vrms debe ser un número positivo.");
    if (!isFinite(Irms) || Irms <= 0)
      return this.mostrarError("Irms debe ser un número positivo.");
    if (!isFinite(cosPhi) || cosPhi < 0 || cosPhi > 1)
      return this.mostrarError("cos φ debe estar entre 0 y 1.");

    // ── Paso 1: Potencia Aparente  S = Vrms · Irms ────────────
    const S = Vrms * Irms;          // [VA]

    // ── Paso 2: Potencia Activa  P = S · cos(φ) ───────────────
    const P = S * cosPhi;           // [W]

    // ── Paso 3: Ángulo de desfase  φ = arccos(cos φ) ──────────
    const phi_rad = Math.acos(cosPhi);            // radianes
    const phi_deg = phi_rad * (180 / Math.PI);    // grados

    // ── Paso 4: sin(φ) para la potencia reactiva ──────────────
    const sinPhi = Math.sin(phi_rad);

    // ── Paso 5: Potencia Reactiva  Q = S · sin(φ) ─────────────
    const Q = S * sinPhi;           // [VAR]

    // ── Paso 6: Impedancia aparente  Z = Vrms / Irms ──────────
    const Z = Vrms / Irms;          // [Ω]

    // ── Paso 7: Resistencia equivalente  R = Z · cos(φ) ───────
    const R = Z * cosPhi;           // [Ω]

    // ── Paso 8: Reactancia equivalente  X = Z · sin(φ) ────────
    const X = Z * sinPhi;           // [Ω]

    // ── Verificación  S² = P² + Q² ────────────────────────────
    const S_check = Math.sqrt(P ** 2 + Q ** 2);

    this.mostrarResultado(`
      <strong>Resultados — Potencia CA</strong><br><br>
      <b>Paso 1</b> · S = Vrms × Irms = ${formatear(Vrms)} × ${formatear(Irms)}
        = <b>${prefixSI(S, "VA")}</b><br>
      <b>Paso 2</b> · P = S × cos(φ) = ${formatear(S, 4)} × ${formatear(cosPhi, 4)}
        = <b>${prefixSI(P, "W")}</b><br>
      <b>Paso 3</b> · φ = arccos(${formatear(cosPhi, 4)})
        = <b>${redondear(phi_deg, 5)}°</b> (${redondear(phi_rad, 5)} rad)<br>
      <b>Paso 4</b> · sin(φ) = ${redondear(sinPhi, 6)}<br>
      <b>Paso 5</b> · Q = S × sin(φ) = ${formatear(S, 4)} × ${redondear(sinPhi, 4)}
        = <b>${prefixSI(Q, "VAR")}</b><br>
      <b>Paso 6</b> · Z = Vrms / Irms = ${formatear(Vrms)} / ${formatear(Irms)}
        = <b>${prefixSI(Z, "Ω")}</b><br>
      <b>Paso 7</b> · R_eq = Z × cos(φ) = <b>${prefixSI(R, "Ω")}</b><br>
      <b>Paso 8</b> · X_eq = Z × sin(φ) = <b>${prefixSI(X, "Ω")}</b><br>
      <hr style="border-color:#555;margin:6px 0">
      ✔ Verificación: √(P² + Q²) = ${prefixSI(S_check, "VA")} ≈ S ✓<br>
      <em>Triángulo de potencias:</em>
        P = ${prefixSI(P,"W")}, Q = ${prefixSI(Q,"VAR")}, S = ${prefixSI(S,"VA")}
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRC
   Constante de tiempo τ y solución Vc(t).
   ───────────────────────────────────────────────────────────── */

class CircuitoRC extends Calculadora {
  /**
   * Modo "tau": calcula solo τ = R·C
   * @param {number} R
   * @param {number} C
   * @param {string} idResultado
   */
  constructor(R, C, idResultado) {
    super(idResultado);
    this.R = R;
    this.C = C;
  }

  // ── Constante de tiempo ──────────────────────────────────────
  calcularTau() {
    const { R, C } = this;

    if (!this.validarPositivos(R, C))
      return this.mostrarError("R y C deben ser números positivos.");

    // τ = R · C
    const tau = R * C;   // [s]

    // Energía almacenada a tensión V asumida de 1 V para referencia
    // E_C = ½ · C · V²  (referencia V=1 V)
    const Eref = 0.5 * C * 1;   // J

    // Frecuencia de corte del filtro pasa-bajas RC
    // fc = 1 / (2π·τ)
    const fc = 1 / (2 * Math.PI * tau);   // [Hz]

    this.mostrarResultado(`
      <strong>Resultados — Constante de Tiempo RC</strong><br><br>
      <b>Paso 1</b> · τ = R × C<br>
        &nbsp;&nbsp;τ = ${prefixSI(R, "Ω")} × ${prefixSI(C, "F")}<br>
        &nbsp;&nbsp;<b>τ = ${prefixSI(tau, "s")}</b><br><br>
      <b>Significado físico:</b><br>
        · A t = 1τ (${prefixSI(tau,"s")}), Vc alcanza el <b>63.2 %</b> del valor final.<br>
        · A t = 2τ (${prefixSI(2*tau,"s")}), Vc = <b>86.5 %</b><br>
        · A t = 3τ (${prefixSI(3*tau,"s")}), Vc = <b>95.0 %</b><br>
        · A t = 5τ (${prefixSI(5*tau,"s")}), Vc ≈ <b>99.3 %</b> → carga completa<br><br>
      <b>Paso 2</b> · Frecuencia de corte (filtro RC pasa-bajas):<br>
        &nbsp;&nbsp;f_c = 1 / (2π·τ) = 1 / (2π × ${prefixSI(tau,"s")})<br>
        &nbsp;&nbsp;<b>f_c = ${prefixSI(fc, "Hz")}</b><br><br>
      <b>Energía almacenada</b> (ref. V = 1 V):<br>
        &nbsp;&nbsp;E_C = ½ · C · V² = ${prefixSI(Eref, "J")}
    `);
  }

  calcular() {
    this.calcularTau();
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRCEDO
   Solución de la EDO: Vc(t) = V·(1 − e^(−t/RC))
   ───────────────────────────────────────────────────────────── */

class CircuitoRCEDO extends Calculadora {
  /**
   * @param {number} V   - Voltaje de alimentación (V)
   * @param {number} R   - Resistencia (Ω)
   * @param {number} C   - Capacitancia (F)
   * @param {number} t   - Instante de evaluación (s)
   * @param {string} idResultado
   */
  constructor(V, R, C, t, idResultado) {
    super(idResultado);
    this.V = V;
    this.R = R;
    this.C = C;
    this.t = t;
  }

  calcular() {
    const { V, R, C, t } = this;

    if (!this.validarPositivos(R, C, V))
      return this.mostrarError("V, R y C deben ser números positivos.");
    if (!isFinite(t) || isNaN(t) || t < 0)
      return this.mostrarError("El tiempo t debe ser ≥ 0.");

    // ── Paso 1: Constante de tiempo ────────────────────────────
    const tau = R * C;                       // τ = R·C  [s]

    // ── Paso 2: Exponente  −t / τ ─────────────────────────────
    const exponente = -t / tau;

    // ── Paso 3: e^(exponente) ─────────────────────────────────
    const eExp = Math.exp(exponente);

    // ── Paso 4: Solución de la EDO  Vc(t) = V·(1 − e^(−t/τ)) ─
    //   La EDO RC·(dVc/dt) + Vc = V tiene como solución general:
    //   Vc(t) = V·(1 − e^(−t/RC))  con condición inicial Vc(0)=0
    const Vc = V * (1 - eExp);

    // ── Paso 5: Corriente instantánea  i(t) = (V/R)·e^(−t/τ) ──
    const i_t = (V / R) * eExp;             // [A]

    // ── Paso 6: Potencia disipada en R  p_R = i²·R ────────────
    const p_R = i_t ** 2 * R;              // [W]

    // ── Paso 7: Energía almacenada en C  E_C = ½·C·Vc² ────────
    const E_C = 0.5 * C * Vc ** 2;        // [J]

    // ── Paso 8: Porcentaje de carga ────────────────────────────
    const porciento = (Vc / V) * 100;

    // ── Paso 9: Derivada  dVc/dt = (V/τ)·e^(−t/τ) ─────────────
    const dVc_dt = (V / tau) * eExp;       // [V/s]

    this.mostrarResultado(`
      <strong>Resultados — EDO Circuito RC</strong><br><br>
      <em>Ecuación: RC·(dVc/dt) + Vc = V  →  solución: Vc(t) = V·(1 − e<sup>−t/τ</sup>)</em><br><br>
      <b>Paso 1</b> · τ = R × C = ${prefixSI(R,"Ω")} × ${prefixSI(C,"F")}
        = <b>${prefixSI(tau, "s")}</b><br>
      <b>Paso 2</b> · Exponente = −t/τ = −${formatear(t,4)} / ${formatear(tau,4)}
        = <b>${formatear(exponente, 6)}</b><br>
      <b>Paso 3</b> · e<sup>${formatear(exponente,6)}</sup>
        = <b>${formatear(eExp, 8)}</b><br>
      <b>Paso 4</b> · Vc(t) = ${formatear(V,4)} × (1 − ${formatear(eExp,6)})<br>
        &nbsp;&nbsp;<b>Vc(${formatear(t,4)} s) = ${prefixSI(Vc, "V")}</b>
        (${redondear(porciento,5)} % de V)<br>
      <b>Paso 5</b> · i(t) = (V/R)·e<sup>−t/τ</sup>
        = (${formatear(V,4)}/${formatear(R,4)}) × ${formatear(eExp,6)}
        = <b>${prefixSI(i_t, "A")}</b><br>
      <b>Paso 6</b> · p_R(t) = i²·R = ${prefixSI(i_t,"A")}² × ${prefixSI(R,"Ω")}
        = <b>${prefixSI(p_R, "W")}</b><br>
      <b>Paso 7</b> · E_C = ½·C·Vc² = ½ × ${prefixSI(C,"F")} × ${prefixSI(Vc,"V")}²
        = <b>${prefixSI(E_C, "J")}</b><br>
      <b>Paso 8</b> · Carga: <b>${redondear(porciento, 4)} %</b>
        ${porciento >= 99 ? "(Carga prácticamente completa ✓)" : porciento >= 63.2 ? "(Supera τ → más de 63.2 %)" : "(Menor a τ → carga en progreso)"}<br>
      <b>Paso 9</b> · dVc/dt = (V/τ)·e<sup>−t/τ</sup>
        = <b>${prefixSI(dVc_dt, "V/s")}</b>
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRL
   Constante de tiempo τ = L/R
   ───────────────────────────────────────────────────────────── */

class CircuitoRL extends Calculadora {
  /**
   * @param {number} L  - Inductancia (H)
   * @param {number} R  - Resistencia (Ω)
   * @param {string} idResultado
   */
  constructor(L, R, idResultado) {
    super(idResultado);
    this.L = L;
    this.R = R;
  }

  calcular() {
    const { L, R } = this;

    if (!this.validarPositivos(L, R))
      return this.mostrarError("L y R deben ser números positivos.");

    // ── Paso 1: Constante de tiempo  τ = L / R ─────────────────
    const tau = L / R;   // [s]

    // ── Paso 2: Reactancia inductiva a 50 Hz  X_L = 2π·f·L ────
    const XL_50 = 2 * Math.PI * 50 * L;   // [Ω] a 50 Hz
    const XL_60 = 2 * Math.PI * 60 * L;   // [Ω] a 60 Hz

    // ── Paso 3: Energía almacenada (ref. I = 1 A) ──────────────
    //   E_L = ½ · L · I²
    const Eref = 0.5 * L * 1;   // J (a 1 A)

    this.mostrarResultado(`
      <strong>Resultados — Constante de Tiempo RL</strong><br><br>
      <b>Paso 1</b> · τ = L / R<br>
        &nbsp;&nbsp;τ = ${prefixSI(L,"H")} / ${prefixSI(R,"Ω")}<br>
        &nbsp;&nbsp;<b>τ = ${prefixSI(tau, "s")}</b><br><br>
      <b>Significado físico:</b><br>
        · A t = 1τ (${prefixSI(tau,"s")}), I alcanza el <b>63.2 %</b> de I_∞ = V/R.<br>
        · A t = 2τ (${prefixSI(2*tau,"s")}), I = <b>86.5 %</b><br>
        · A t = 3τ (${prefixSI(3*tau,"s")}), I = <b>95.0 %</b><br>
        · A t = 5τ (${prefixSI(5*tau,"s")}), I ≈ <b>99.3 %</b> → régimen permanente<br><br>
      <b>Paso 2</b> · Reactancia inductiva:<br>
        &nbsp;&nbsp;X_L (50 Hz) = 2π×50×L = <b>${prefixSI(XL_50,"Ω")}</b><br>
        &nbsp;&nbsp;X_L (60 Hz) = 2π×60×L = <b>${prefixSI(XL_60,"Ω")}</b><br><br>
      <b>Paso 3</b> · Energía magnética almacenada (ref. I = 1 A):<br>
        &nbsp;&nbsp;E_L = ½ · L · I² = ${prefixSI(Eref,"J")}
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRLEDO
   Solución de la EDO: I(t) = (V/R)·(1 − e^(−Rt/L))
   ───────────────────────────────────────────────────────────── */

class CircuitoRLEDO extends Calculadora {
  /**
   * @param {number} V   - Voltaje de alimentación (V)
   * @param {number} R   - Resistencia (Ω)
   * @param {number} L   - Inductancia (H)
   * @param {number} t   - Instante de evaluación (s)
   * @param {string} idResultado
   */
  constructor(V, R, L, t, idResultado) {
    super(idResultado);
    this.V = V;
    this.R = R;
    this.L = L;
    this.t = t;
  }

  calcular() {
    const { V, R, L, t } = this;

    if (!this.validarPositivos(V, R, L))
      return this.mostrarError("V, R y L deben ser números positivos.");
    if (!isFinite(t) || isNaN(t) || t < 0)
      return this.mostrarError("El tiempo t debe ser ≥ 0.");

    // ── Paso 1: Constante de tiempo ────────────────────────────
    const tau = L / R;                      // τ = L/R  [s]

    // ── Paso 2: Corriente de estado estacionario ───────────────
    //   Cuando t → ∞, el inductor se comporta como cortocircuito
    //   I_∞ = V / R
    const I_inf = V / R;                    // [A]

    // ── Paso 3: Exponente  −R·t / L = −t / τ ──────────────────
    const exponente = -R * t / L;

    // ── Paso 4: e^(exponente) ─────────────────────────────────
    const eExp = Math.exp(exponente);

    // ── Paso 5: Solución de la EDO ─────────────────────────────
    //   L·(di/dt) + R·i = V  →  i(t) = (V/R)·(1 − e^(−Rt/L))
    //   con condición inicial I(0) = 0
    const I_t = I_inf * (1 - eExp);        // [A]

    // ── Paso 6: Voltaje en el inductor  VL = L·(di/dt) ─────────
    //   di/dt = (V/L)·e^(−Rt/L)
    const dI_dt = (V / L) * eExp;          // [A/s]
    const V_L   = L * dI_dt;              // [V]

    // ── Paso 7: Voltaje en la resistencia  VR = i(t)·R ─────────
    const V_R = I_t * R;                   // [V]

    // ── Paso 8: Potencia instantánea total  p = V·i(t) ─────────
    const p_total = V * I_t;              // [W]

    // ── Paso 9: Potencia disipada en R  p_R = i²·R ─────────────
    const p_R = I_t ** 2 * R;             // [W]

    // ── Paso 10: Energía almacenada en L  E_L = ½·L·i² ─────────
    const E_L = 0.5 * L * I_t ** 2;       // [J]

    // ── Paso 11: Porcentaje de corriente ───────────────────────
    const porciento = (I_t / I_inf) * 100;

    // ── Verificación  VR + VL = V ──────────────────────────────
    const V_check = V_R + V_L;

    this.mostrarResultado(`
      <strong>Resultados — EDO Circuito RL</strong><br><br>
      <em>Ecuación: L·(di/dt) + R·i = V  →  solución: I(t) = (V/R)·(1 − e<sup>−Rt/L</sup>)</em><br><br>
      <b>Paso 1</b> · τ = L/R = ${prefixSI(L,"H")} / ${prefixSI(R,"Ω")}
        = <b>${prefixSI(tau,"s")}</b><br>
      <b>Paso 2</b> · I_∞ = V/R = ${formatear(V,4)} / ${formatear(R,4)}
        = <b>${prefixSI(I_inf,"A")}</b><br>
      <b>Paso 3</b> · Exponente = −Rt/L = −${formatear(R,4)}×${formatear(t,4)}/${formatear(L,4)}
        = <b>${formatear(exponente,6)}</b><br>
      <b>Paso 4</b> · e<sup>${formatear(exponente,6)}</sup>
        = <b>${formatear(eExp,8)}</b><br>
      <b>Paso 5</b> · I(t) = I_∞ × (1 − e<sup>−t/τ</sup>)
        = ${prefixSI(I_inf,"A")} × (1 − ${formatear(eExp,6)})<br>
        &nbsp;&nbsp;<b>I(${formatear(t,4)} s) = ${prefixSI(I_t,"A")}</b>
        (${redondear(porciento,4)} % de I_∞)<br>
      <b>Paso 6</b> · V_L(t) = L·(di/dt) = ${prefixSI(L,"H")} × ${prefixSI(dI_dt,"A/s")}
        = <b>${prefixSI(V_L,"V")}</b><br>
      <b>Paso 7</b> · V_R(t) = i·R = ${prefixSI(I_t,"A")} × ${prefixSI(R,"Ω")}
        = <b>${prefixSI(V_R,"V")}</b><br>
      <b>Paso 8</b> · p_total = V × i = ${prefixSI(p_total,"W")}<br>
      <b>Paso 9</b> · p_R = i²·R = <b>${prefixSI(p_R,"W")}</b><br>
      <b>Paso 10</b> · E_L = ½·L·i² = <b>${prefixSI(E_L,"J")}</b><br>
      <b>Paso 11</b> · Progreso: <b>${redondear(porciento,4)} %</b>
        ${porciento >= 99 ? "(Régimen permanente ✓)" : porciento >= 63.2 ? "(Superó τ)" : "(Transitorio en progreso)"}<br>
      <hr style="border-color:#555;margin:6px 0">
      ✔ Verificación LKV: V_R + V_L = ${prefixSI(V_R,"V")} + ${prefixSI(V_L,"V")}
        = ${prefixSI(V_check,"V")} ≈ V = ${prefixSI(V,"V")} ✓
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRLC
   Frecuencia de resonancia f₀ = 1 / (2π·√(LC))
   ───────────────────────────────────────────────────────────── */

class CircuitoRLC extends Calculadora {
  /**
   * @param {number} L  - Inductancia (H)
   * @param {number} C  - Capacitancia (F)
   * @param {string} idResultado
   */
  constructor(L, C, idResultado) {
    super(idResultado);
    this.L = L;
    this.C = C;
  }

  calcular() {
    const { L, C } = this;

    if (!this.validarPositivos(L, C))
      return this.mostrarError("L y C deben ser números positivos.");

    // ── Paso 1: Producto LC ────────────────────────────────────
    const LC = L * C;                             // [H·F = s²]

    // ── Paso 2: Raíz de LC ─────────────────────────────────────
    const sqrtLC = Math.sqrt(LC);                 // [s]

    // ── Paso 3: Pulsación natural  ω₀ = 1/√(LC) ───────────────
    const omega0 = 1 / sqrtLC;                    // [rad/s]

    // ── Paso 4: Frecuencia de resonancia  f₀ = ω₀ / (2π) ──────
    const f0 = omega0 / (2 * Math.PI);            // [Hz]

    // ── Paso 5: Período de resonancia  T = 1/f₀ ───────────────
    const T = 1 / f0;                             // [s]

    // ── Paso 6: Longitud de onda equivalente a 3×10⁸ m/s ──────
    const lambda = 3e8 / f0;                      // [m]

    this.mostrarResultado(`
      <strong>Resultados — Frecuencia de Resonancia RLC</strong><br><br>
      <b>Paso 1</b> · L × C = ${prefixSI(L,"H")} × ${prefixSI(C,"F")}
        = <b>${formatear(LC,6)} s²</b><br>
      <b>Paso 2</b> · √(LC) = <b>${prefixSI(sqrtLC,"s")}</b><br>
      <b>Paso 3</b> · ω₀ = 1/√(LC) = 1/${prefixSI(sqrtLC,"s")}
        = <b>${prefixSI(omega0,"rad/s")}</b><br>
      <b>Paso 4</b> · f₀ = ω₀ / (2π) = ${prefixSI(omega0,"rad/s")} / (2π)
        = <b>${prefixSI(f0,"Hz")}</b><br>
      <b>Paso 5</b> · Período T = 1/f₀ = <b>${prefixSI(T,"s")}</b><br>
      <b>Paso 6</b> · Longitud de onda equivalente: λ = c/f₀
        = <b>${prefixSI(lambda,"m")}</b><br><br>
      <em>En resonancia: X_L = X_C → impedancia puramente resistiva (mínima),
      corriente máxima.</em>
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: CircuitoRLCEDO
   Análisis completo de la respuesta natural del circuito RLC.
   EDO: L·(d²q/dt²) + R·(dq/dt) + (1/C)·q = 0
   ───────────────────────────────────────────────────────────── */

class CircuitoRLCEDO extends Calculadora {
  /**
   * @param {number} R  - Resistencia (Ω)
   * @param {number} L  - Inductancia (H)
   * @param {number} C  - Capacitancia (F)
   * @param {string} idResultado
   */
  constructor(R, L, C, idResultado) {
    super(idResultado);
    this.R = R;
    this.L = L;
    this.C = C;
  }

  calcular() {
    const { R, L, C } = this;

    if (!this.validarPositivos(R, L, C))
      return this.mostrarError("R, L y C deben ser números positivos.");

    // ── Paso 1: Frecuencia natural ω₀ = 1/√(LC) ───────────────
    const omega0 = 1 / Math.sqrt(L * C);              // [rad/s]

    // ── Paso 2: Coeficiente de amortiguamiento  α = R/(2L) ─────
    //   Proviene de la ecuación característica: s² + (R/L)·s + 1/(LC) = 0
    //   y la forma estándar s² + 2α·s + ω₀² = 0
    const alpha = R / (2 * L);                         // [Np/s]

    // ── Paso 3: Factor de calidad  Q = ω₀/(2α) = (1/R)·√(L/C) ─
    const Q_factor = omega0 / (2 * alpha);             // adimensional

    // ── Paso 4: Discriminante  Δ = α² − ω₀² ──────────────────
    const discriminante = alpha ** 2 - omega0 ** 2;

    // ── Paso 5: Resistencia crítica  R_c = 2·√(L/C) ────────────
    const R_critica = 2 * Math.sqrt(L / C);           // [Ω]

    // ── Paso 6: Clasificación del régimen ─────────────────────
    let regimen, detalle, raices;

    if (Math.abs(discriminante) < 1e-20 * omega0 ** 2) {
      // ── Críticamente amortiguado  α = ω₀ ──────────────────
      //   Raíz doble real: s₁ = s₂ = −α
      regimen = "⚖ Críticamente Amortiguado";
      const s1 = -alpha;
      raices = `s₁ = s₂ = −α = ${formatear(s1, 6)} rad/s (raíz doble real)`;
      detalle = `
        Solución: q(t) = (A₁ + A₂·t) · e<sup>${formatear(s1,4)}·t</sup><br>
        Es el límite entre oscilación y decaimiento puro.
        Regresa al equilibrio en el menor tiempo posible sin oscilar.`;

    } else if (discriminante > 0) {
      // ── Sobreamortiguado  α > ω₀ ──────────────────────────
      //   Dos raíces reales distintas negativas
      regimen = "📉 Sobreamortiguado";
      const sqrtD = Math.sqrt(discriminante);
      const s1 = -alpha + sqrtD;
      const s2 = -alpha - sqrtD;
      raices = `s₁ = ${formatear(s1,6)} rad/s,  s₂ = ${formatear(s2,6)} rad/s (reales distintas)`;
      detalle = `
        Solución: q(t) = A₁·e<sup>${formatear(s1,4)}·t</sup> + A₂·e<sup>${formatear(s2,4)}·t</sup><br>
        Decaimiento exponencial puro sin oscilaciones.
        La respuesta más lenta de las tres.`;

    } else {
      // ── Subamortiguado  α < ω₀ ────────────────────────────
      //   Dos raíces complejas conjugadas
      regimen = "〰 Subamortiguado";
      const omega_d = Math.sqrt(-discriminante);       // frecuencia amortiguada [rad/s]
      const f_d = omega_d / (2 * Math.PI);             // [Hz]
      raices = `s₁,₂ = −α ± jω_d = ${formatear(-alpha,6)} ± j${formatear(omega_d,6)} rad/s`;
      detalle = `
        Frecuencia amortiguada: <b>ω_d = ${prefixSI(omega_d,"rad/s")}</b>
          (f_d = ${prefixSI(f_d,"Hz")})<br>
        Solución: q(t) = e<sup>−αt</sup> · [A₁·cos(ω_d·t) + A₂·sin(ω_d·t)]<br>
        Oscilación sinusoidal que decae exponencialmente con envolvente e<sup>−αt</sup>.`;
    }

    // ── Paso 7: Ancho de banda  BW = 2α = R/L ─────────────────
    const BW = 2 * alpha;   // [rad/s]

    this.mostrarResultado(`
      <strong>Resultados — Análisis EDO Circuito RLC</strong><br><br>
      <em>EDO: L·(d²q/dt²) + R·(dq/dt) + (1/C)·q = 0</em><br>
      <em>Ec. característica: s² + (R/L)·s + 1/(LC) = 0</em><br><br>

      <b>Paso 1</b> · ω₀ = 1/√(LC) = 1/√(${prefixSI(L,"H")}×${prefixSI(C,"F")})
        = <b>${prefixSI(omega0,"rad/s")}</b>
        (f₀ = ${prefixSI(omega0/(2*Math.PI),"Hz")})<br>

      <b>Paso 2</b> · α = R/(2L) = ${prefixSI(R,"Ω")} / (2×${prefixSI(L,"H")})
        = <b>${prefixSI(alpha,"Np/s")}</b><br>

      <b>Paso 3</b> · Factor de calidad Q = ω₀/(2α)
        = ${formatear(omega0,4)} / (2×${formatear(alpha,4)})
        = <b>${redondear(Q_factor,5)}</b>
        ${Q_factor > 10 ? "(alta selectividad)" : Q_factor < 0.5 ? "(muy amortiguado)" : ""}<br>

      <b>Paso 4</b> · Discriminante Δ = α² − ω₀²
        = ${formatear(alpha**2,6)} − ${formatear(omega0**2,6)}
        = <b>${formatear(discriminante,6)}</b><br>

      <b>Paso 5</b> · Resistencia crítica R_c = 2·√(L/C)
        = 2·√(${prefixSI(L,"H")}/${prefixSI(C,"F")})
        = <b>${prefixSI(R_critica,"Ω")}</b>
        (R ${R > R_critica ? ">" : R < R_critica ? "<" : "="} R_c → ${R > R_critica ? "sobreamortiguado" : R < R_critica ? "subamortiguado" : "crítico"})<br>

      <b>Paso 6</b> · Raíces de la ecuación característica:<br>
        &nbsp;&nbsp;${raices}<br>

      <b>Paso 7</b> · Ancho de banda BW = 2α = R/L
        = <b>${prefixSI(BW,"rad/s")}</b><br>

      <hr style="border-color:#555;margin:6px 0">
      <b>Régimen: ${regimen}</b><br>
      ${detalle}
    `);
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: FormController
   Vincula un <form> HTML con una calculadora, leyendo inputs
   y creando la instancia adecuada en cada submit.
   ───────────────────────────────────────────────────────────── */

class FormController {
  /**
   * @param {string}   formId    - ID del <form> en el HTML.
   * @param {Function} factory   - Función que recibe los valores del form
   *                               y devuelve una instancia de Calculadora.
   */
  constructor(formId, factory) {
    this.formId  = formId;
    this.factory = factory;
    this._bind();
  }

  /** Lee el valor numérico de un input por ID. */
  static leer(id) {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) : NaN;
  }

  /** Vincula el evento submit al formulario. */
  _bind() {
    const form = document.getElementById(this.formId);
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const calc = this.factory();
      calc.calcular();
    });
  }
}


/* ─────────────────────────────────────────────────────────────
   CLASE: App
   Punto de entrada: instancia todos los FormControllers.
   ───────────────────────────────────────────────────────────── */

class App {
  constructor() {
    this._inicializar();
  }

  _inicializar() {

    // ── 1. Potencia Activa CA ──────────────────────────────────
    new FormController("calc-form", () =>
      new PotenciaCA(
        FormController.leer("vrms"),
        FormController.leer("irms"),
        FormController.leer("cosphi"),
        "resultado"
      )
    );

    // ── 2. Calculadora τ RC ────────────────────────────────────
    new FormController("rc-form", () =>
      new CircuitoRC(
        FormController.leer("r_rc"),
        FormController.leer("c_rc"),
        "rc-resultado"
      )
    );

    // ── 3. EDO Circuito RC → Vc(t) ────────────────────────────
    new FormController("rc-eq-form", () =>
      new CircuitoRCEDO(
        FormController.leer("v_rc_t"),
        FormController.leer("r_rc_eq"),
        FormController.leer("c_rc_eq"),
        FormController.leer("t_rc_eq"),
        "rc-eq-resultado"
      )
    );

    // ── 4. Calculadora τ RL ────────────────────────────────────
    new FormController("rl-form", () =>
      new CircuitoRL(
        FormController.leer("l_rl"),
        FormController.leer("r_rl"),
        "rl-resultado"
      )
    );

    // ── 5. EDO Circuito RL → I(t) ──────────────────────────────
    new FormController("rl-eq-form", () =>
      new CircuitoRLEDO(
        FormController.leer("v_rl_t"),
        FormController.leer("r_rl_eq"),
        FormController.leer("l_rl_eq"),
        FormController.leer("t_rl_eq"),
        "rl-eq-resultado"
      )
    );

    // ── 6. Frecuencia de resonancia RLC ───────────────────────
    new FormController("rlc-form", () =>
      new CircuitoRLC(
        FormController.leer("l_rlc"),
        FormController.leer("c_rlc"),
        "rlc-resultado"
      )
    );

    // ── 7. EDO Circuito RLC → análisis completo ───────────────
    new FormController("rlc-edo-form", () =>
      new CircuitoRLCEDO(
        FormController.leer("edo_r"),
        FormController.leer("edo_l"),
        FormController.leer("edo_c"),
        "rlc-edo-resultado"
      )
    );
  }
}


/* ─────────────────────────────────────────────────────────────
   ARRANQUE
   DOMContentLoaded garantiza que todos los <form> existen
   antes de vincular los eventos.
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  new App();
});