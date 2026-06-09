const Usuario = require("../models/Usuario");
//perfil propio
exports.miPerfil = (req, res) => {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }
  res.redirect(`/perfil/${req.session.usuario.id}`);
};
// perfil del usuario especifico
exports.verPerfil = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const usuarioPerfil = await Usuario.findByPk(usuarioId);

    if (!usuarioPerfil) {
      return res.status(404).send("Usuario no encontrado");
    }

    const { Seguimiento, Publicacion, Imagen } = require("../models");

    const seguidores = await Seguimiento.count({
      where: { seguido_id: usuarioId },
    });

    const seguidos = await Seguimiento.count({
      where: { seguidor_id: usuarioId },
    });

    const yaSigo = await Seguimiento.findOne({
      where: { seguidor_id: req.session.usuario.id, seguido_id: usuarioId },
    });

    const publicaciones = await Publicacion.findAll({
      where: { usuario_id: usuarioId },
      include: [Imagen],
      order: [["fecha_creacion", "DESC"]],
    });

    res.render("perfil", {
      usuarioPerfil,
      seguidores,
      seguidos,
      yaSigo: !!yaSigo,
      publicaciones,
      esPropioPerfil: req.session.usuario.id == usuarioId,
    });
  } catch (error) {
    res.status(500).send("Error al cargar perfil");
  }
};

exports.seguirUsuario = async (req, res) => {
  try {
    const { Seguimiento, Notificacion } = require("../models");
    const seguidor_id = req.session.usuario.id;
    const seguido_id = req.params.usuario_id;

    if (seguidor_id == seguido_id) {
      return res.status(400).send("No podes seguirte a vos mismo");
    }

    const existente = await Seguimiento.findOne({
      where: { seguidor_id, seguido_id },
    });

    if (!existente) {
      await Seguimiento.create({ seguidor_id, seguido_id });

      await Notificacion.create({
        tipo_evento: "seguimiento",
        usuario_id: seguido_id,
        actor_id: seguidor_id,
        referencia_id: null,
        referencia_tipo: null,
      });
    }

    res.redirect("/perfil/" + seguido_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al seguir");
  }
};

exports.dejarDeSeguirUsuario = async (req, res) => {
  try {
    const { Seguimiento } = require("../models");
    const seguidor_id = req.session.usuario.id;
    const seguido_id = req.params.usuario_id;

    await Seguimiento.destroy({
      where: { seguidor_id, seguido_id },
    });

    res.redirect("/perfil/" + seguido_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al dejar de seguir");
  }
};
