const express = require("express");
const router = express.Router();
const coleccionController = require("../controllers/coleccionController");
const { requiereAutenticacion } = require("../middlewares/auth");

router.get(
  "/colecciones",
  requiereAutenticacion,
  coleccionController.listarColecciones,
);
router.post(
  "/colecciones",
  requiereAutenticacion,
  coleccionController.guardarEnColeccion,
);
router.post(
  "/colecciones/nueva",
  requiereAutenticacion,
  coleccionController.crearColeccion,
);
router.post(
  "/colecciones/:id/quitar/:publicacion_id",
  requiereAutenticacion,
  coleccionController.quitarDeColeccion,
);
router.post(
  "/colecciones/:id/borrar",
  requiereAutenticacion,
  coleccionController.borrarColeccion,
);
router.post(
  "/favoritos/:publicacion_id",
  requiereAutenticacion,
  coleccionController.alternarFavorito,
);

module.exports = router;
