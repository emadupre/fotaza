const express = require("express");
const router = express.Router();
const upload = require("../config/cloudinary").upload;
const publicacionController = require("../controllers/publicacionController");
const { requiereAutenticacion } = require("../middlewares/auth");

function subirImagenes(req, res, next) {
  upload.array("imagenes", 5)(req, res, (err) => {
    if (!err) return next();
    const mensajes = {
      LIMIT_FILE_SIZE: "Cada imagen puede pesar como máximo 5 MB",
      LIMIT_UNEXPECTED_FILE: "Podés subir hasta 5 imágenes",
    };
    res.status(400).render("publicar", {
      error: mensajes[err.code] || err.message,
      valores: req.body,
    });
  });
}

//form y crear publicacion
router.get(
  "/publicar",
  requiereAutenticacion,
  publicacionController.mostrarFormulario,
);
router.post(
  "/publicar",
  requiereAutenticacion,
  subirImagenes,
  publicacionController.crearPublicacion,
);

//ver detalles
router.get("/publicaciones/:id", publicacionController.verPublicacion);

//comentarios
router.post(
  "/comentar/:imagen_id",
  requiereAutenticacion,
  publicacionController.comentar,
);
router.post(
  "/cerrar-comentarios/:imagen_id",
  requiereAutenticacion,
  publicacionController.cerrarComentarios,
);
router.post(
  "/borrar-comentario/:comentario_id",
  requiereAutenticacion,
  publicacionController.borrarComentario,
);

//valoracion
router.post(
  "/valorar/:imagen_id",
  requiereAutenticacion,
  publicacionController.valorar,
);

// interes
router.post(
  "/me-interesa/:imagen_id",
  requiereAutenticacion,
  publicacionController.marcarInteres,
);

//denuncias imagen
router.get(
  "/denunciar/imagen/:imagen_id",
  requiereAutenticacion,
  publicacionController.mostrarDenunciarImagen,
);
router.post(
  "/denunciar/imagen/:imagen_id",
  requiereAutenticacion,
  publicacionController.procesarDenunciarImagen,
);

// denuncias comentario
router.get(
  "/denunciar/comentario/:comentario_id",
  requiereAutenticacion,
  publicacionController.mostrarDenunciaComentario,
);
router.post(
  "/denunciar/comentario/:comentario_id",
  requiereAutenticacion,
  publicacionController.procesarDenunciarComentario,
);

//edicion de publicacion
router.get(
  "/publicaciones/:id/editar",
  requiereAutenticacion,
  publicacionController.mostrarEditarPublicacion,
);
router.post(
  "/publicaciones/:id/editar",
  requiereAutenticacion,
  publicacionController.editarPublicacion,
);

module.exports = router;
