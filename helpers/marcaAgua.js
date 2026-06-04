async function crearMarcaAgua(texto) {
  const textoEscapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `
    <svg width="400" height="60" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="40" font-family="Arial" font-size="20" fill="white" opacity="0.7">
        ${textoEscapado}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

module.exports = { crearMarcaAgua };