const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const { requiereInvitado } = require('../middlewares/auth');

router.get('/login', requiereInvitado, authController.mostrarLogin);
router.post('/login', requiereInvitado, authController.procesarLogin);
router.get('/registro', requiereInvitado, authController.mostrarRegistro);
router.post('/registro', requiereInvitado, authController.procesarRegistro);
router.get('/logout', authController.logout);

module.exports = router;