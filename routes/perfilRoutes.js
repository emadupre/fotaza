const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { requiereAutenticacion } = require('../middlewares/auth');

router.get('/perfil/', requiereAutenticacion, perfilController.miPerfil);
router.get('/perfil/:id', requiereAutenticacion, perfilController.verPerfil);

router.post('/seguir/:usuario_id', requiereAutenticacion, perfilController.seguirUsuario);
router.post('/dejar-de-seguir/:usuario_id', requiereAutenticacion, perfilController.dejarDeSeguirUsuario);

module.exports = router;