const { Coleccion, ColeccionPublicacion } = require("../models");

// se crea sola y no se puede eliminar.
const FAVORITOS = "Favoritos";

// limpia el nombre y une favoritos, FAVORITOS en Favoritos (el UNIQUE distingue mayúsculas)
function normalizarNombre(nombre) {
  const limpio = String(nombre || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 50);
  return limpio.toLowerCase() === FAVORITOS.toLowerCase() ? FAVORITOS : limpio;
}

async function obtenerFavoritos(usuarioId) {
  const [coleccion] = await Coleccion.findOrCreate({
    where: { nombre: FAVORITOS, usuario_id: usuarioId },
  });
  return coleccion;
}

async function esFavorita(usuarioId, publicacionId) {
  const coleccion = await Coleccion.findOne({
    where: { nombre: FAVORITOS, usuario_id: usuarioId },
    attributes: ["id"],
  });
  if (!coleccion) return false;
  const fila = await ColeccionPublicacion.findOne({
    where: { coleccion_id: coleccion.id, publicacion_id: publicacionId },
  });
  return !!fila;
}

module.exports = { FAVORITOS, normalizarNombre, obtenerFavoritos, esFavorita };
