const express = require('express');
const router = express.Router();
const notifiacionController = require('../controllers/notificacionesController');
const { requiereAutenticacion } = require('../middlewares/auth');

router.get('/notificaciones', requiereAutenticacion, notifiacionController.listar);
router.post('/notificaciones/:id/leida', requiereAutenticacion, notifiacionController.marcarLeida);
router.post('/notificaciones/leer-todas', requiereAutenticacion, notifiacionController.marcarTodasLeidas);

module.exports = router;