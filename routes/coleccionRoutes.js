const express = require("express");
const router = express.Router();
const coleccionController = require('../controllers/coleccionController');
const { requiereAutenticacion } = require('../middlewares/auth');

router.get('/colecciones', requiereAutenticacion, coleccionController.listarColecciones);
router.post('/colecciones', requiereAutenticacion, coleccionController.guardarEnColeccion);

module.exports = router;