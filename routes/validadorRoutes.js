const express = require("express");
const router = express.Router();
const validadorController = require("../controllers/validadorController");
const { requiereRolValidador } = require("../middlewares/auth");

router.get("/validador", requiereRolValidador, validadorController.panel);
router.post(
  "/validador/bajar/:publicacion_id",
  requiereRolValidador,
  validadorController.bajarPublicacion,
);
router.post(
  "/validador/desestimar/:publicacion_id",
  requiereRolValidador,
  validadorController.desestimarDenuncias,
);

module.exports = router;
