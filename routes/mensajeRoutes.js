const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');
const { requireAutenticacion } = require('../middlewares/auth');

router.get('/mensajes', requireAutenticacion, mensajeController.listarConversaciones);
router.get('/mensajes/enviar/:usuario_id', requireAutenticacion, mensajeController.mostrarEnviarMensaje);
router.post('/mensajes/enviar', requireAutenticacion, mensajeController.enviarMensaje);
router.get('/mensajes/conversacion/:otro_usuario_id', requireAutenticacion, mensajeController.verConversacion);

module.exports = router;