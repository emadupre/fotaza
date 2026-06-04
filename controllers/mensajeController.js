const { MensajePrivado, Usuario, Imagen } = require("../models");
const { Op } = require("sequelize");

// ver mensajes priv
exports.listarConversaciones = async (req, res) => {
  try {
    const mensajes = await MensajePrivado.findAll({
      where: {
        [Op.or]: [
          { remitente_id: req.session.usuario.id },
          { destinatario_id: req.session.usuario.id },
        ],
      },
      include: [
        { model: Usuario, as: "remitente", attributes: ["id", "nombre"] },
        {
          model: Usuario,
          as: "destinatario",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha", "DESC"]],
    });

    // agrupamos los chats con los usuarios
    const conversacionesMap = new Map();

    for (const msg of mensajes) {
      const otroUsuario =
        msg.remitente_id === req.session.usuario.id
          ? msg.destinatario
          : msg.remitente;

      if (!conversacionesMap.has(otroUsuario.id)) {
        conversacionesMap.set(otroUsuario.id, {
          usuario: otroUsuario,
          ultimoMensaje: msg,
          noLeidos: 0,
        });
      }

      // contar los msg no leidos
      if (!msg.leido && msg.destinatario_id === req.session.usuario.id) {
        conversacionesMap.get(otroUsuario.id).noLeidos++;
      }
    }

    const conversaciones = Array.from(conversacionesMap.values());

    res.render("mensajes", { conversaciones, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar mensajes");
  }
};

// form para enviar el msj
exports.mostrarEnviarMensaje = async (req, res) => {
  try {
    const destinatario = await Usuario.findByPk(req.params.usuario_id);
    if (!destinatario) return res.status(404).send("Usuario no encontrado");
    res.render("enviar_mensaje", { destinatario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
};

// enviar msj
exports.enviarMensaje = async (req, res) => {
  try {
    const { destinatario_id, contenido } = req.body;

    await MensajePrivado.create({
      remitente_id: req.session.usuario.id,
      destinatario_id,
      contenido,
    });

    res.redirect("/mensajes/conversacion/" + destinatario_id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al enviar");
  }
};

// ver conversacion
exports.verConversacion = async (req, res) => {
  try {
    const otroUsuario = await Usuario.findByPk(req.params.otro_usuario_id);
    if (!otroUsuario) return res.status(404).send("Usuario no encontrado");

    const mensajes = await MensajePrivado.findAll({
      where: {
        [Op.or]: [
          {
            remitente_id: req.session.usuario.id,
            destinatario_id: otroUsuario.id,
          },
          {
            remitente_id: otroUsuario.id,
            destinatario_id: req.session.usuario.id,
          },
        ],
      },
      include: [
        {
          model: Usuario,
          as: "remitente",
          attributes: ["id", "nombre"],
        },
        {
          model: Imagen,
          attributes: ["id", "publicacion_id"],
        },
      ],
      order: [["fecha", "ASC"]],
    });

    //msj recibido -> msj leido
    await MensajePrivado.update(
      { leido: true },
      {
        where: {
          remitente_id: otroUsuario.id,
          destinatario_id: req.session.usuario.id,
          leido: false,
        },
      },
    );

    res.render("conversacion", {
      mensajes,
      otroUsuario,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar conversacion");
  }
};