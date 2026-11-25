const express = require("express");
const router = express.Router();
const denunciasController = require("../controllers/denunciasController");
const { requiereAutenticacion } = require("../middlewares/auth");

router.get(
  "/mis-denuncias",
  requiereAutenticacion,
  denunciasController.panelAutor,
);
router.post(
  "/mis-denuncias/comentarios/:comentario_id/borrar",
  requiereAutenticacion,
  denunciasController.borrarComentarioDenunciado,
);
router.post(
  "/mis-denuncias/comentarios/:comentario_id/desestimar",
  requiereAutenticacion,
  denunciasController.desestimarDenunciasComentario,
);

module.exports = router;