const {
  Publicacion,
  Imagen,
  Etiqueta,
  PublicacionEtiqueta,
  Comentario,
  Valoracion,
  Notificacion,
  Interes,
  MensajePrivado,
  DenunciaImagen,
  DenunciaComentario,
  Coleccion,
  Usuario,
} = require("../models");
const { procesarImagen } = require("../services/imagenService");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const { normalizarEtiquetas } = require("../helpers/etiquetas");
const { FAVORITOS, esFavorita } = require("../helpers/colecciones");

// form publicar
exports.mostrarFormulario = (req, res) => {
  res.render("publicar");
};

//procesar nueva publicacion

exports.crearPublicacion = async (req, res) => {
  const sesion = req.session.usuario;
  const titulo = (req.body.titulo || "").trim();
  const descripcion = (req.body.descripcion || "").trim() || null;
  const licencia = req.body.licencia;
  const etiquetas = normalizarEtiquetas(req.body.etiquetas);
  const archivos = req.files || [];
  // con copyright siempre lleva marca: si el autor no escribe una, se usa «© nombre»
  const marca =
    licencia === "con_copyright"
      ? (req.body.marca_agua_texto || "").trim().slice(0, 60) ||
        `© ${sesion.nombre}`
      : null;

  const volver = (error) =>
    res.status(400).render("publicar", { error, valores: req.body });

  if (!titulo || titulo.length > 150)
    return volver("El título es obligatorio (máximo 150 caracteres)");
  if (descripcion && descripcion.length > 2000)
    return volver("La descripción es demasiado larga (máximo 2000 caracteres)");
  if (!["con_copyright", "sin_copyright"].includes(licencia))
    return volver("Elegí una licencia");
  if (archivos.length === 0) return volver("Subí al menos una imagen");
  if (etiquetas.length === 0) return volver("Agregá al menos una etiqueta");
  if (etiquetas.length > 10) return volver("Podés usar hasta 10 etiquetas");

  try {
    // 1) primero las imágenes: si Cloudinary falla no queda nada a medias en la base
    const urls = await Promise.all(
      archivos.map((file) =>
        procesarImagen(file, licencia, marca, sesion.nombre),
      ),
    );

    // 2) después todo junto en una transacción: publicación, imágenes y etiquetas
    const publicacion = await sequelize.transaction(async (t) => {
      const pub = await Publicacion.create(
        { titulo, descripcion, usuario_id: sesion.id },
        { transaction: t },
      );
      await Imagen.bulkCreate(
        urls.map((url) => ({
          url,
          publicacion_id: pub.id,
          licencia,
          marca_agua_texto: marca,
        })),
        { transaction: t },
      );
      for (const nombre of etiquetas) {
        const [etiqueta] = await Etiqueta.findOrCreate({
          where: { nombre },
          transaction: t,
        });
        await PublicacionEtiqueta.create(
          { publicacion_id: pub.id, etiqueta_id: etiqueta.id },
          { transaction: t },
        );
      }
      return pub;
    });

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    if (
      error.http_code === 400 ||
      /unsupported image format|Input buffer/i.test(error.message || "")
    ) {
      return volver("Alguno de los archivos no es una imagen valida");
    }
    res.status(500).send("Error al crear la publicacion");
  }
};

// ver publicacion
exports.verPublicacion = async (req, res) => {
  try {
    const publicacion = await Publicacion.findByPk(req.params.id, {
      include: [
        { model: Imagen },
        { model: Etiqueta },
        { model: Usuario, attributes: ["id", "nombre"] },
      ],
    });

    if (!publicacion) {
      return res.status(400).send("Publicacion no encontrada");
    }

    const sesion = req.session.usuario;
    const esAutor = !!sesion && sesion.id === publicacion.usuario_id;
    const esValidador = !!sesion && sesion.rol === "validador";

    //una publi dada de baja solo la ven el autor y el validador
    if (publicacion.estado === "baja" && !esAutor && !esValidador) {
      return res.status(404).send("Publicacion no encontrada");
    }

    if (!sesion) {
      const tieneCopyright = publicacion.Imagens.some(
        (img) => img.licencia === "con_copyright",
      );
      if (!tieneCopyright) {
        return res
          .status(403)
          .send(
            "Esta publicacion tiene imagenes con copyright, inicia sesión para verlas.",
          );
      }
    }

    //comentarios
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    const comentarios = await Comentario.findAll({
      where: { imagen_id: idsImagenes, borrado: false },
      include: [{ model: Usuario, attributes: ["id", "nombre"] }],
      order: [["fecha", "ASC"]],
    });
    const comentariosPorImagenes = {};
    for (const c of comentarios)
      (comentariosPorImagenes[c.imagen_id] ||= []).push(c);

    // traemos las colecciones del usuario
    let coleccionesUsuario = [];
    let favorita = false;
    if (sesion) {
      const todas = await Coleccion.findAll({
        where: { usuario_id: sesion.id },
        order: [["nombre", "ASC"]],
      });
      coleccionesUsuario = todas.filter((c) => c.nombre !== FAVORITOS); // «Favoritos» tiene su propio botón ★
      favorita = await esFavorita(sesion.id, publicacion.id);
    }

    res.render("publicacion", {
      publicacion,
      comentarios,
      comentariosPorImagenes,
      esAutor,
      coleccionesUsuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar publicacion");
  }
};

//comentar una imagen
exports.comentar = async (req, res) => {
  try {
    const texto = (req.body.texto || "").trim();
    if (!texto)
      return res.status(400).send("El comentario no puede estar vacio.");
    if (texto.length > 1000)
      return res.status(400).send("El comentario es demasiado largo");

    const imagen_id = req.params.imagen_id;

    //chequeo si la imagen existe y que no esten los comentarios cerrados
    const imagen = await Imagen.findByPk(imagen_id);
    if (!imagen || imagen.comentarios_cerrados) {
      return res.status(400).send("No se puede comentar");
    }

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (!publicacion || publicacion.estado === "baja") {
      return res.status(404).send("Publicacion no encontrada");
    }

    await Comentario.create({
      texto,
      usuario_id: req.session.usuario.id,
      imagen_id,
    });

    //notificacion para el creador de la publicacion

    if (publicacion.usuario_id !== req.session.usuario.id) {
      await Notificacion.create({
        tipo_evento: "comentario",
        usuario_id: publicacion.usuario_id,
        actor_id: req.session.usuario.id,
        referencia_id: imagen_id,
        referencia_tipo: "imagen",
      });
    }

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al comentar");
  }
};

//valorar/puntuar imagen
exports.valorar = async (req, res) => {
  try {
    const puntuacion = Number(req.body.puntuacion);
    const imagen_id = Number(req.params.imagen_id);
    const usuario_id = req.session.usuario.id;

    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).send("Puntuacion invalida");
    }
    if (!Number.isInteger(imagen_id))
      return res.status(404).send("Imagen no encontrada");

    //chequeo que no es el autor propio de la imagen
    const imagen = await Imagen.findByPk(imagen_id);
    if (!imagen) return res.status(404).send("Imagen no encontrada.");

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (!publicacion || publicacion.estado === "baja") {
      return res.status(404).send("Publicacion no encontrada");
    }

    if (publicacion.usuario_id === usuario_id) {
      return res.status(400).send("No podes votar tu propia publicación.");
    }

    try {
      await sequelize.transaction(async (t) => {
        await Imagen.findByPk(imagen_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        await Valoracion.create(
          { puntuacion, usuario_id, imagen_id },
          { transaction: t },
        );

        const [r] = await Valoracion.findAll({
          where: { imagen_id },
          attributes: [
            [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"],
            [sequelize.fn("COUNT", sequelize.col("id")), "total"],
          ],
          raw: true,
          transaction: t,
        });
        await Imagen.update(
          {
            promedio_valoracion: Number(r.promedio).toFixed(2),
            total_votos: Number(r.total),
          },
          { where: { id: imagen_id }, transaction: t },
        );

        await Notificacion.create(
          {
            tipo_evento: "valoracion",
            usuario_id: publicacion.usuario_id,
            actor_id: usuario_id,
            referencia_id: imagen_id,
            referencia_tipo: "imagen",
          },
          {
            transaction: t,
          },
        );
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).send("Ya votaste la imagen");
      }
      throw error;
    }

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al votar");
  }
};

// marcar interes en una publicacion/imagen
exports.marcarInteres = async (req, res) => {
  try {
    const imagen = await Imagen.findByPk(req.params.imagen_id);
    if (!imagen) return res.status(404).send("Imagen no encontrada");

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if ((!publicacion === publicacion.estado) === "baja") {
      return res.status(404).send("Publicacion no encontrada");
    }
    if (publicacion.usuario_id === req.session.usuario.id) {
      return res
        .status(400)
        .send("No podes marcar interes en tu propia publicacion.");
    }

    const [, creado] = await Interes.findOrCreate({
      where: { usuario_id: req.session.usuario.id, imagen_id: imagen.id },
    });

    if (creado) {
      await Notificacion.create({
        tipo_evento: "me_interesa",
        usuario_id: publicacion.usuario_id,
        actor_id: req.session.usuario.id,
        referencia_id: imagen.id,
        referencia_tipo: "imagen",
      });
      await MensajePrivado.create({
        remitente_id: req.session.usuario.id,
        destinatario_id: publicacion.usuario_id,
        contenido: `Hola, estoy interesado en tu imagen "${publicacion.titulo}"`,
        imagen_id: imagen.id,
      });
    }

    //despues redigirimos al usuario a la conversacion con el autor del post
    res.redirect("/mensajes/conversacion/" + publicacion.usuario_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al marcar interes");
  }
};

// si soy autor cerrar comentarios
exports.cerrarComentarios = async (req, res) => {
  try {
    const imagen = await Imagen.findByPk(req.params.imagen_id);
    if (!imagen) return res.status(404).send("Imagen no encontrada");

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (publicacion.usuario_id !== req.session.usuario.id) {
      return res.status(403).send("No tenes autorizacion capo");
    }

    await Imagen.update(
      { comentarios_cerrados: !imagen.comentarios_cerrados },
      { where: { publicacion_id: publicacion.id } },
    );
    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cambiar estado de comentarios");
  }
};

// si soy autor poder borrar comentarios
exports.borrarComentario = async (req, res) => {
  try {
    const comentario = await Comentario.findByPk(req.params.comentario_id);
    if (!comentario) return res.status(404).send("Comentario no encontrado");

    const imagen = await Imagen.findByPk(comentario.imagen_id);
    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

    if (
      publicacion.usuario_id !== req.session.usuario.id &&
      comentario.usuario_id !== req.session.usuario.id
    ) {
      return res.status(403).send("No autorizado");
    }

    await comentario.update({
      borrado: true,
    });

    await DenunciaComentario.update(
      { estado: "aceptada" },
      { where: { comentario_id: comentario.id, estado: "pendiente" } },
    );

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al borrar comentario");
  }
};

//hacer denuncia de imagen
exports.mostrarDenunciarImagen = (req, res) => {
  res.render("denunciar_imagen", { imagen_id: req.params.imagen_id });
};

//proceso la deuncia de la imagen
exports.procesarDenunciarImagen = async (req, res) => {
  try {
    const motivo = (req.body.motivo || "").trim();
    const descripcion = (req.body.descripcion || "").trim();
    if (!motivo || !descripcion) {
      return res.status(400).send("Elegí un motivo y escribí una descripcion");
    }

    const imagen = await Imagen.findByPk(req.params.imagen_id);
    if (!imagen) return res.status(404).send("Imagen no encontrada");

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (publicacion.usuario_id === req.session.usuario.id) {
      return res.status(400).send("No podes denunciar tu propia publicacion");
    }

    try {
      await DenunciaImagen.create({
        motivo,
        descripcion,
        usuario_id: req.session.usuario.id,
        imagen_id: imagen.id,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).send("Ya denunciaste esta imagen");
      }
      throw error;
    }

    res.redirect("/publicaciones/" + imagen.publicacion_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al denunciar imagen");
  }
};

// hacer denuncia de comentario
exports.mostrarDenunciaComentario = async (req, res) => {
  res.render("denunciar_comentario", {
    comentario_id: req.params.comentario_id,
  });
};

// proceso la denuncia de comentario
exports.procesarDenunciarComentario = async (req, res) => {
  try {
    const motivo = (req.body.motivo || "").trim();
    const descripcion = (req.body.descripcion || "").trim();
    if (!motivo || !descripcion) {
      return res.status(400).send("Elegí un motivo y escribi una descripcion");
    }

    const comentario = await Comentario.findByPk(req.params.comentario_id);
    if (!comentario) return res.status(404).send("Comentario no encontrado");

    const imagen = await Imagen.findByPk(comentario.imagen_id);
    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

    if (comentario.usuario_id === publicacion.usuario_id) {
      return res
        .status(400)
        .send("No se pueden denunciar comentarios del autor");
    }

    if (comentario.usuario_id === req.session.usuario.id) {
      return res.status(400).send("No podes denunciar tu propio comentario");
    }

    try {
      await DenunciaComentario.create({
        motivo,
        descripcion,
        usuario_id: req.session.usuario.id,
        comentario_id: comentario.id,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).send("Ya denunciaste este comentario");
      }
      throw error;
    }

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al denunciar comentario");
  }
};

//editar la publi
exports.mostrarEditarPublicacion = async (req, res) => {
  try {
    const publicacion = await Publicacion.findByPk(req.params.id, {
      include: [{ model: Imagen }, { model: Etiqueta }],
    });

    if (!publicacion) return res.status(404).send("Publicacion no encontrada");
    if (publicacion.usuario_id !== req.session.usuario.id) {
      return res.status(403).send("No sos el autor");
    }
    if (publicacion.estado === "baja")
      return res.status(403).send("La publicacion fue dada de baja");

    //verificamos si alguna de las imagenes tiene denuncias/reportes
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    const denuncias = await DenunciaImagen.count({
      where: { imagen_id: idsImagenes, estado: "pendiente" },
    });

    if (denuncias > 0) {
      return res
        .status(403)
        .send("No se puede editar, la publicacion tiene denuncias");
    }
    const multer = require("multer");
    const path = require("path");

    //config para el multer y que guarde las imagenes en ->/uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "uploads/");
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
      },
    });

    const uploads = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // con esto ya defino que el maximo de la imagen sea 5mb para ahorrar espacio en la bd
      fileFilter: (req, file, cb) => {
        const tiposPermitidos = /jpeg|jpg|png|gif|webp/;
        const ext = tiposPermitidos.test(
          path.extname(file.originalname).toLowerCase(),
        );
        const mime = tiposPermitidos.test(file.mimetype);
        if (ext && mime) {
          return cb(null, true);
        }
        cb(new Error("Solo imageenes (jpeg, jpg, png, gif, webp)"));
      },
    });

    module.exports = uploads;
    res.render("editar_publicacion", { publicacion });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar");
  }
};

exports.editarPublicacion = async (req, res) => {
  try {
    const publicacion = await Publicacion.findByPk(req.params.id, {
      include: [Imagen],
    });
    if (!publicacion) return res.status(404).send("No encontrada");
    if (publicacion.usuario_id !== req.session.usuario.id)
      return res.status(403).send("No autorizado");
    if (publicacion.estado === "baja")
      return res.status(403).send("La publicacion fue dada de baja");

    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    const denuncias = await DenunciaImagen.count({
      where: { imagen_id: idsImagenes, estado: "pendiente" },
    });
    if (denuncias > 0)
      return res.status(403).send("No puedes editar, el post tiene denuncias");

    const titulo = (req.body.titulo || "").trim();
    const descripcion = (req.body.descripcion || "").trim() || null;
    const etiquetas = normalizarEtiquetas(req.body.etiquetas);
    if (!titulo || titulo.length > 150)
      return res
        .status(400)
        .send("El título es obligatorio (máximo 150 caracteres)");
    if (etiquetas.length === 0)
      return res.status(400).send("Agregá al menos una etiqueta");

    await sequelize.transaction(async (t) => {
      await publicacion.update({ titulo, descripcion }, { transaction: t });
      await PublicacionEtiqueta.destroy({
        where: { publicacion_id: publicacion.id },
        transaction: t,
      });
      for (const nombre of etiquetas) {
        const [etiqueta] = await Etiqueta.findOrCreate({
          where: { nombre },
          transaction: t,
        });
        await PublicacionEtiqueta.create(
          { publicacion_id: publicacion.id, etiqueta_id: etiqueta.id },
          { transaction: t },
        );
      }
    });

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al editar");
  }
};
