// dsp.js — Processamento de Sinais do RastreaSPDA
// O histórico de resistência de um ponto é tratado como sinal discreto x[n].
// Lógica protegida — não alterar as fórmulas sem revisar com a Suamí.

// Filtro IIR de 1ª ordem (média móvel exponencial — EMA).
// H(z) = α / (1 − (1−α)·z⁻¹) — polo em z = 1−α (estável, dentro do círculo unitário).
// Alpha padrão sugerido: 0.3 (suavização moderada).
export function emaFilter(alpha, xArr) {
  const y = [];
  for (let n = 0; n < xArr.length; n++) {
    y[n] = n === 0
      ? xArr[0]
      : alpha * xArr[n] + (1 - alpha) * y[n - 1];
  }
  return y;
}

// Detecção de anomalia por desvio em relação à média.
// Retorna array de booleanos: true onde |x[n] − μ| > k·σ.
// k = 2 → 2 desvios-padrão.
export function detectAnomaly(xArr, k = 2) {
  const { mu, sigma } = dspStats(xArr);
  return xArr.map(v => Math.abs(v - mu) > k * sigma);
}

// Estatísticas básicas do sinal — usadas para desenhar as faixas μ ± kσ no gráfico.
export function dspStats(xArr) {
  const n = xArr.length;
  if (n === 0) return { mu: 0, sigma: 0 };
  const mu = xArr.reduce((a, b) => a + b, 0) / n;
  const sigma = Math.sqrt(xArr.reduce((s, v) => s + (v - mu) ** 2, 0) / n);
  return { mu, sigma };
}
