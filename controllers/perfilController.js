const Usuario = require("../models/Usuario");
//perfil propio
exports.miPerfil = (req, res) => {
  res.redirect(`/perfil/${req.session.usaurio.id}`);
};
// perfil del usuario especifico
exports.verPerfil = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const usuarioPerfil = await Usuario.findByPk(usuarioId);

    if (!usuarioPerfil) {
      return res.status(404).send('Usuario no encontrado');
    }

    const { Seguimiento, Publicacion } = require('../models');

    const seguidores = await Seguimiento.count({
      where: { seguidor_id: usuarioId },
    });

    const seguidos = await Seguimiento.count({
      where: { seguidor_id: usuarioId },
    });
    
    const yaSigo = await Seguimiento.findOne({
      where: { seguidor_id: req.session.usuario.id, seguido_id: usuarioId },
    });

    const publicaciones = await Publicacion.findAll({
      where: { usuario_id: usuarioId },
      order: [['fecha_creacion', 'DESC']],
    });

    res.render('perfil', {
      usuarioPerfil,
      seguidores,
      seguidos,
      yaSigo: !!yaSigo,
      publicaciones,
      esPropioPerfil: req.session.usuario.id == usuarioId,
    });

  } catch (error) {
    res.status(500).send('Eror al cargar perfil');
  }
};
