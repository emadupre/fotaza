function normalizarEtiquetas(texto) {
  const unicas = new Set(
    String(texto || "")
      .split(",")
      .map((e) => e.trim().toLowerCase().replace(/\s+/g, " "))
      .filter((e) => e && e.length <= 30),
  );
  return [...unicas];
}

module.exports = { normalizarEtiquetas };
