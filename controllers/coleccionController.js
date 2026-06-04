const {
  Coleccion,
  ColeccionPublicacion,
  Publicacion,
  Imagen,
} = require("../models");

// colecciones
exports.listarColecciones = async (req, res) => {
  try {
    const colecciones = await Coleccion.findAll({
      where: {
        usuario_id: req.session.usuario.id,
      },
      include: [
        {
          model: Publicacion,
          include: [{ model: Imagen }],
        },
      ],
    });
    res.render("colecciones", { colecciones, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar");
  }
};

// crear coleccion y agregar publicacion
exports.guardarEnColeccion = async (req, res) => {
  try {
    const { coleccion_id, nombre, publicacion_id } = req.body;

    let coleccion;

    if (coleccion_id) {
      //usar coleccion existente si es que hay
      coleccion = await Coleccion.findOne({
        where: { id: coleccion_id, usuario_id: req.session.usuario.id },
      });
      if (!coleccion) {
        return res.status(404).send("Coleccion no encontrada");
      }
    } else if (nombre) {
      //creo una coleccion
      [coleccion] = await Coleccion.findOrCreate({
        where: { nombre: nombre.trim(), usuario_id: req.session.usuario.id },
      });
    } else {
      return res
        .status(400)
        .send("Tenes que seleccionar o crear una colección");
    }

    //agregar publi a la coleccion (acá deberiamos evitar publis duplicadas)
    await ColeccionPublicacion.create({
      coleccion_id: coleccion.id,
      publicacion_id,
    }).catch((err) => {
      if (err.name !== "SequelizeUniqueConstraintError") throw err;
    });

    res.redirect("/publicaciones/" + publicacion_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al guardar en colección.");
  }
};
