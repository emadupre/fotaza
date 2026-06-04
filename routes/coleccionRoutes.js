const express = require("express");
const router = express.Router();
const coleccionController = require('../controllers/coleccionController');
const { requireAutenticacion, requiereAutenticacion } = require('../middlewares/auth');

router.get('/colecciones', requireAutenticacion, coleccionController.listarColecciones);
router.post('/colecciones', requiereAutenticacion, coleccionController.guardarEnColeccion);

module.exports = router;