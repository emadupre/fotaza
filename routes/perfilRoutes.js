const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { requiereAutenticacion } = require('../middlewares/auth');

router.get('/perfil/', requiereAutenticacion, perfilController.miPerfil);
router.get('/perfil/:id', requiereAutenticacion, perfilController.verPerfil);

module.exports = router;