const { Notificacion, Usuario } = require("../models");

// notificaciones del usuario
exports.listar = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: req.session.usuario.id },
      include: [{ model: Usuario, as: "actor", attributes: ["id", "nombre"] }],
      order: [["fecha", "DESC"]],
      limit: 50,
    });

    // que se cuenten las no leidas
    const noLeidas = await Notificacion.count({
      where: { usuario_id: req.session.usuario.id, leida: false },
    });

    res.render("notificaciones", {
      notificaciones,
      noLeidas,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar las notificaciones del usuario");
  }
};

//marcamos como leida la notificaciones
exports.marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByPk(req.params.id);

    if (!notificacion || notificacion.usuario_id !== req.session.usuario.id) {
      return res.status(400).send("Notificacion no encontrada");
    }

    await notificacion.update({ leida: true });
    res.redirect("/notificaciones");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al marcar como leída");
  }
};

//marcamos como leida todas las notificaciones
exports.marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update(
      { leida: true },
      { where: { usuario_id: req.session.usuario.id, leida: false } },
    );
    res.redirect("/notificaciones");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("Error al marcar como leidas a todas las notificaciones");
  }
};
