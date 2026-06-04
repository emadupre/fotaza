const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');
const { requiereAutenticacion } = require('../middlewares/auth');

router.get('/mensajes', requiereAutenticacion, mensajeController.listarConversaciones);
router.get('/mensajes/enviar/:usuario_id', requiereAutenticacion, mensajeController.mostrarEnviarMensaje);
router.post('/mensajes/enviar', requiereAutenticacion, mensajeController.enviarMensaje);
router.get('/mensajes/conversacion/:otro_usuario_id', requiereAutenticacion, mensajeController.verConversacion);

module.exports = router;