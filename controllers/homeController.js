const { Seguimiento, Publicacion, Imagen, Usuario } = require("../models");
const Op = require("sequelize").Op;

exports.home = async (req, res) => {
  // si el usuario no esta logueado tieen que mostrar la home normal hasta ahora
  if (!req.session.usuario) {
    return res.render("home");
  }
  try {
    const seguidos = await Seguimiento.findAll({
      where: { seguido_id: req.session.usuario.id },
      attributes: ["seguido_id"],
    });
    const idsSeguidos = seguidos.map((s) => s.seguido_id);
    // publicaciones de seguidos
    let publicacionesSeguidos = [];

    if (idsSeguidos.length > 0) {
      publicacionesSeguidos = await Publicacion.findAll({
        where: {
          usuario_id: { [Op.in]: idsSeguidos },
          estado: { [Op.ne]: "baja" },
        },
        include: [
          { model: Imagen },
          { model: Usuario, attributes: ["id", "nombre"] },
        ],
        order: [["fecha_creacion", "DESC"]],
        limit: 15,
      });
    }

    // publicaciones populares, las mayores o iguales a 4 y minimo con 10 votos.
    const publicacionesPopulares = await Publicacion.findAll({
      where: {
        estado: { [Op.ne]: "baja" },
        ...(idsSeguidos.length
          ? { usuario_id: { [Op.notIn]: idsSeguidos } }
          : {}),
      },
      include: [
        {
          model: Imagen,
          where: {
            promedio_valoracion: { [Op.gte]: 4.0 },
            total_votos: { [Op.gte]: 10 },
          },
        },
        { model: Usuario, attributes: ["id", "nombre"] },
      ],
      order: [["fecha_creacion", "DESC"]],
      limit: 10,
    });

    // publicaciones más actuales de usuarios que no sigo
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const publicacionesRecientes = await Publicacion.findAll({
      where: {
        estado: { [Op.ne]: "baja" },
        fecha_creacion: { [Op.gte]: hace48h },
        ...(idsSeguidos.length
          ? { usuario_id: { [Op.notIn]: idsSeguidos } }
          : {}),
      },
      include: [
        { model: Imagen },
        { model: Usuario, attributes: ["id", "nombre"] },
      ],
      order: [["fecha_creacion", "DESC"]],
      limit: 10,
    });

    res.render("home", {
      usuario: req.session.usuario,
      publicacionesSeguidos,
      publicacionesPopulares,
      publicacionesRecientes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en cargar la home");
  }
};
