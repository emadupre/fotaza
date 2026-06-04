const express = require("express");
const router = express.Router();
const validadorController = require("../controllers/validadorController");
const { requireRolValidador } = require("../middlewares/auth");

router.get("/validador", requireRolValidador, validadorController.panel);
router.post(
  "/validador/bajar/:publicacion_id",
  requireRolValidador,
  validadorController.bajarPublicacion,
);
router.post(
  "/validador/desestimar/:publicacion_id",
  requireRolValidador,
  validadorController.desestimarDenuncias,
);

module.exports = router;
