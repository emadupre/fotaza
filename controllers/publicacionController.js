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
} = require("../models");
const { procesarImagen } = require("../services/imagenService");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

// form publicar
exports.mostrarFormulario = (req, res) => {
  res.render("publicar");
};

//procesar nueva publicacion

exports.crearPublicacion = async (req, res) => {
  try {
    const { titulo, descripcion, etiquetas, licencia, marca_agua_texto } =
      req.body;
    //creamos la publi
    const publicacion = await Publicacion.create({
      titulo,
      descripcion,
      usuario_id: req.session.usuario.id,
    });

    // acá procesamos todas las imagenes en caso de haber + de 1 imagen
    // implementación futura (investigar) si es posible poder subir fotos de + de 5mb y comprimirlas
    for (const file of req.files) {
      const url = await procesarImagen(
        file,
        licencia,
        marca_agua_texto,
        req.session.usuario.nombre,
      );

      await Imagen.create({
        url,
        publicacion_id: publicacion.id,
        licencia,
        marca_agua_texto:
          licencia === "con_copyright" ? marca_agua_texto : null,
      });
    }

    //procesamos las etiquetas de la publi
    if (etiquetas) {
      const nombresEtiquetas = etiquetas
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);
      for (const nombre of nombresEtiquetas) {
        const [etiqueta] = await Etiqueta.findOrCreate({ where: { nombre } });
        //aca usamos directamente la tabla intermedia
        await PublicacionEtiqueta.create({
          publicacion_id: publicacion.id,
          etiqueta_id: etiqueta.id,
        }).catch((err) => {
          //ignoramos si ya existe por la PK compuesta
          if (err.name !== "SequelizeUniqueConstraintError") throw err;
        });
      }
    }

    res.redirect("/perfil");
  } catch (error) {
    console.error(error);
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
        { model: require("../models/Usuario"), attributes: ["id", "nombre"] },
      ],
    });

    if (!publicacion) {
      return res.status(400).send("Publicacion no encontrada");
    }

    //comentarios
    const comentarios = await Comentario.findAll({
      where: { imagen_id: publicacion.Imagens[0]?.id, borrado: false },
      include: [
        { model: require("../models/Usuario"), attributes: ["id", "nombre"] },
      ],
      order: [["fecha", "ASC"]],
    });

    // traemos las colecciones del usuario
    let coleccionesUsuario = [];
    if (req.session.usuario) {
      coleccionesUsuario = await Coleccion.findAll({
        where: { usuario_id: req.session.usuario.id },
      });
    }

    res.render("publicacion", {
      publicacion,
      comentarios,
      esAutor:
        req.session.usuario &&
        req.session.usuario.id === publicacion.usuario_id,
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
    const { texto } = req.body;
    const imagen_id = req.params.imagen_id;

    //chequeo si la imagen existe y que no esten los comentarios cerrados
    const imagen = await Imagen.findByPk(imagen_id);
    if (!imagen || imagen.comentarios_cerrados) {
      return res.status(400).send("No se puede comentar");
    }

    await Comentario.create({
      texto,
      usuario_id: req.session.usuario.id,
      imagen_id,
    });

    //notificacion para el creador de la publicacion
    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (publicacion.usuario_id !== req.session.usuario.id) {
      await Notificacion.create({
        tipo_evento: "comentario",
        usuario_id: publicacion.usuario_id,
        actor_id: req.session.usuario.id,
        referencia_id: imagen_id,
        referencia_tipo: "imagen",
      });
    }

    res.redirect("/publicaciones/" + imagen.publicacion_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al comentar");
  }
};

//valorar/puntuar imagen
exports.valorar = async (req, res) => {
  try {
    const { puntuacion } = req.body;
    const imagen_id = req.params.imagen_id;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).send("Puntuacion invalida");
    }

    //chequeo que no es el autor propio de la imagen
    const imagen = await Imagen.findByPk(imagen_id);
    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

    if (publicacion.usuario_id === req.session.usuario.id) {
      return res.status(400).send("No podes votar tu propia publicación.");
    }

    //chequeo que no hayan votado antes
    const existente = await Valoracion.findOne({
      where: { usuario_id: req.session.usuario.id, imagen_id },
    });

    if (existente) {
      return res.status(400).send("Ya votaste");
    }

    await Valoracion.create({
      puntuacion,
      usuario_id: req.session.usuario.id,
      imagen_id,
    });

    //actualizamos la valoracion es decir el promedio y el total.
    const resultado = await Valoracion.findAll({
      where: { imagen_id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      raw: true,
    });

    await imagen.update({
      promedio_valoracion: parseFloat(resultado[0].promedio),
      total_votos: parseInt(resultado[0].total),
    });

    await Notificacion.create({
      tipo_evento: "valoracion",
      usuario_id: publicacion.usuario_id,
      actor_id: req.session.usuario.id,
      referencia_id: imagen_id,
      referencia_tipo: "imagen",
    });

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al votar");
  }
};

// marcar interes en una publicacion/imagen
exports.marcarInteres = async (req, res) => {
  try {
    const imagen_id = req.params.imagen_id;
    const imagen = await Imagen.findByPk(imagen_id);
    if (!imagen) return res.status(404).send("Imagen no encontrada");

    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
    if (publicacion.usuario_id === req.session.usuario.id) {
      return res.status(400).send("Es tu propia publicacion papá, que haces");
    }

    // evitamos duplicados
    const existente = await Interes.findOne({
      where: { usuario_id: req.session.usuario.id, imagen_id },
    });
    if (!existente) {
      await Interes.create({
        usuario_id: req.session.usuario.id,
        imagen_id,
      });
    }

    // generamos la notificacion para el autor del post
    await Notificacion.create({
      tipo_evento: "me_interesa",
      usuario_id: publicacion.usuario_id,
      actor_id: req.session.usuario.id,
      referencia_id: imagen_id,
      referencia_tipo: "imagen",
    });

    // aca creamos un mensaje por default que referencie a la imagen que esta interesado
    await MensajePrivado.create({
      remitente_id: req.session.usuario.id,
      destinatario_id: publicacion.usuario_id,
      contenido: `Hola, estoy interesado en tu imagen "${publicacion.titulo}"`,
      imagen_id: imagen_id,
    });

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

    await imagen.update({
      comentarios_cerrados: !imagen.comentarios_cerrados,
    });
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
    const { motivo, descripcion } = req.body;
    await DenunciaImagen.create({
      motivo,
      descripcion,
      usuario_id: req.session.usuario.id,
      imagen_id: req.params.imagen_id,
    });

    //no se puede editar la imagen si tiene denuncias
    const imagen = await Imagen.findByPk(req.params.imagen_id);
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
    const { motivo, descripcion } = req.body;

    await DenunciaComentario.create({
      motivo,
      descripcion,
      usuario_id: req.session.usuario.id,
      comentario_id: req.params.comentario_id,
    });

    const comentario = await Comentario.findByPk(req.params.comentario_id);
    const imagen = await Imagen.findByPk(comentario.imagen_id);
    const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

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

    //verificamos si alguna de las imagenes tiene denuncias/reportes
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    const denuncias = await DenunciaImagen.count({
      where: { imagen_id: idsImagenes },
    });

    if (denuncias > 0) {
      return res
        .status(403)
        .send("No se puede editar, la publicacion tiene denuncias");
    }

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

    // chequear las denuncias
    const idsImagenes = publicacion.Imagens.map((img) => img.id);
    const denuncias = await DenunciaImagen.count({
      where: { imagen_id: idsImagenes },
    });
    if (denuncias > 0)
      return res.status(403).send("No puedes editar, el post tiene denuncias");

    const { titulo, descripcion, etiquetas } = req.body;
    await publicacion.update({ titulo, descripcion });

    //actualizamos las etiquetas
    await PublicacionEtiqueta.destroy({
      where: { publicacion_id: publicacion.id },
    });

    if (etiquetas) {
      const nombres = etiquetas
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);
      for (const nombre of nombres) {
        const [etiqueta] = await Etiqueta.findOrCreate({ where: { nombre } });
        if (etiqueta) {
          // solo si se obtuvo o se creo correctamente
          await PublicacionEtiqueta.create({
            publicacion_id: publicacion.id,
            etiqueta_id: etiqueta.id,
          }).catch((err) => {
            if (err.name !== "SequelizeUniqueConstraintError") throw err;
          });
        }
      }
    }

    res.redirect("/publicaciones/" + publicacion.id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al editar");
  }
};
