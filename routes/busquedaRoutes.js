const express = require("express");
const router = express.Router();
const busquedaController = require("../controllers/busquedaController");

router.get("/buscar", busquedaController.buscar);

module.exports = router;
