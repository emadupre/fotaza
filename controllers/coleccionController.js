const {
  Coleccion,
  ColeccionPublicacion,
  Publicacion,
  Imagen,
} = require("../models");
const { Op } = require("sequelize");
const {
  FAVORITOS,
  normalizarNombre,
  obtenerFavoritos,
} = require("../helpers/colecciones");

const aviso = (req, tipo, texto) => {
  req.session.aviso = { tipo, texto };
};
const noEncontrada = (res) =>
  res.status(404).render("error", {
    codigo: 404,
    mensaje: "No encontramos lo que buscabas",
  });

// Una colección solo existe para su dueño: si no es suya, se responde como si no existiera
async function coleccionPropia(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return null;
  return Coleccion.findOne({
    where: { id, usuario_id: req.session.usuario.id },
  });
}

exports.listarColecciones = async (req, res) => {
  try {
    await obtenerFavoritos(req.session.usuario.id); // «Favoritos» siempre aparece
    const colecciones = await Coleccion.findAll({
      where: { usuario_id: req.session.usuario.id },
      include: [
        {
          model: Publicacion,
          where: { estado: { [Op.ne]: "baja" } },
          required: false,
          through: { attributes: [] },
          include: [{ model: Imagen }],
        },
      ],
    });
    colecciones.sort((a, b) =>
      a.nombre === FAVORITOS
        ? -1
        : b.nombre === FAVORITOS
          ? 1
          : a.nombre.localeCompare(b.nombre, "es"),
    );
    res.render("colecciones", { colecciones, FAVORITOS });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar");
  }
};

// crear una colección vacía
exports.crearColeccion = async (req, res) => {
  try {
    const nombre = normalizarNombre(req.body.nombre);
    if (!nombre) {
      aviso(
        req,
        "danger",
        "Escribí un nombre para la colección (hasta 50 caracteres)",
      );
      return res.redirect("/colecciones");
    }
    const [, creada] = await Coleccion.findOrCreate({
      where: { nombre, usuario_id: req.session.usuario.id },
    });
    aviso(
      req,
      creada ? "success" : "info",
      creada
        ? `Colección «${nombre}» creada`
        : `Ya tenés una colección llamada «${nombre}»`,
    );
    res.redirect("/colecciones");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear la colección");
  }
};

// guardar una publicación en una colección existente o en una nueva
exports.guardarEnColeccion = async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const publicacionId = Number(req.body.publicacion_id);
    if (!Number.isInteger(publicacionId)) return noEncontrada(res);

    const publicacion = await Publicacion.findByPk(publicacionId);
    if (!publicacion || publicacion.estado === "baja") return noEncontrada(res);
    const volver = "/publicaciones/" + publicacionId;

    let coleccion;
    const coleccionId = Number(req.body.coleccion_id);
    if (req.body.coleccion_id && Number.isInteger(coleccionId)) {
      coleccion = await Coleccion.findOne({
        where: { id: coleccionId, usuario_id: usuarioId },
      });
      if (!coleccion) return noEncontrada(res);
    } else {
      const nombre = normalizarNombre(req.body.nombre);
      if (!nombre) {
        aviso(
          req,
          "danger",
          "Elegí una colección o escribí un nombre para crear una nueva",
        );
        return res.redirect(volver);
      }
      [coleccion] = await Coleccion.findOrCreate({
        where: { nombre, usuario_id: usuarioId },
      });
    }

    // la clave primaria compuesta impide guardar dos veces la misma publicación en la misma colección
    const [, agregada] = await ColeccionPublicacion.findOrCreate({
      where: { coleccion_id: coleccion.id, publicacion_id: publicacionId },
    });
    aviso(
      req,
      agregada ? "success" : "info",
      agregada
        ? `Guardada en «${coleccion.nombre}»`
        : `Ya estaba guardada en «${coleccion.nombre}»`,
    );
    res.redirect(volver);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al guardar en colección.");
  }
};

// botón ★: agrega o quita la publicación de «Favoritos»
exports.alternarFavorito = async (req, res) => {
  try {
    const publicacionId = Number(req.params.publicacion_id);
    if (!Number.isInteger(publicacionId)) return noEncontrada(res);
    const publicacion = await Publicacion.findByPk(publicacionId);
    if (!publicacion || publicacion.estado === "baja") return noEncontrada(res);

    const favoritos = await obtenerFavoritos(req.session.usuario.id);
    const donde = { coleccion_id: favoritos.id, publicacion_id: publicacionId };
    const [, agregada] = await ColeccionPublicacion.findOrCreate({
      where: donde,
    });
    if (!agregada) await ColeccionPublicacion.destroy({ where: donde });

    aviso(
      req,
      "success",
      agregada ? "Agregada a tus favoritos" : "Quitada de tus favoritos",
    );
    res.redirect("/publicaciones/" + publicacionId);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar favoritos");
  }
};

exports.quitarDeColeccion = async (req, res) => {
  try {
    const coleccion = await coleccionPropia(req);
    const publicacionId = Number(req.params.publicacion_id);
    if (!coleccion || !Number.isInteger(publicacionId))
      return noEncontrada(res);

    await ColeccionPublicacion.destroy({
      where: { coleccion_id: coleccion.id, publicacion_id: publicacionId },
    });
    aviso(req, "success", `Quitada de «${coleccion.nombre}»`);
    res.redirect("/colecciones");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al quitar de la colección");
  }
};

exports.borrarColeccion = async (req, res) => {
  try {
    const coleccion = await coleccionPropia(req);
    if (!coleccion) return noEncontrada(res);
    if (coleccion.nombre === FAVORITOS) {
      aviso(req, "danger", "«Favoritos» no se puede eliminar");
      return res.redirect("/colecciones");
    }
    await coleccion.destroy(); // ON DELETE CASCADE quita sus filas en colecciones_publicaciones; las publicaciones no se tocan
    aviso(req, "success", `Colección «${coleccion.nombre}» eliminada`);
    res.redirect("/colecciones");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar la colección");
  }
};
