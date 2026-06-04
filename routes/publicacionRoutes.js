const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const publicacionController = require('../controllers/publicacionController');
const { requiereAutenticacion } = require('../middlewares/auth');
const { route } = require('./perfilRoutes');

//form y crear publicacion
router.get('/publicar', requiereAutenticacion, publicacionController.mostrarFormulario);
router.post('/publicar', requiereAutenticacion, upload.array('imagenes', 5), publicacionController.crearPublicacion);

//ver detalles
router.get('/publicaciones/:id', publicacionController.verPublicacion);

//comentarios
router.post('/comentar/:imagen_id', requiereAutenticacion, publicacionController.comentar);
router.post('/cerrar-comentarios/:imagen_id', requiereAutenticacion, publicacionController.cerrarComentarios);
router.post('/borrar-comentario/:comentario_id', requiereAutenticacion, publicacionController.borrarComentario);

//valoracion
router.post('/valorar/:imagen_id', requiereAutenticacion, publicacionController.valorar);

// interes
router.post('/me-interesa/:imagen_id', requiereAutenticacion, publicacionController.marcarInteres);

//denuncias imagen
router.get('/denunciar/imagen/:imagen_id', requiereAutenticacion, publicacionController.mostrarDenunciarImagen);
router.post('/denunciar/imagen/:imagen_id', requiereAutenticacion, publicacionController.procesarDenunciarImagen);

// denuncias comentario
router.get('/denunciar/comentario/:comentario_id', requiereAutenticacion, publicacionController.mostrarDenunciaComentario);
router.post('/denunciar/comentario/:comentario_id', requiereAutenticacion, publicacionController.procesarDenunciarComentario);

//edicion de publicacion
router.get('/publicaciones/:id/editar', requiereAutenticacion, publicacionController.mostrarEditarPublicacion);
router.post('/publicaciones/:id/editar', requiereAutenticacion, publicacionController.editarPublicacion);

module.exports = router;