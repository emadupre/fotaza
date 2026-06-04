require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");
const { Sequelize } = require("sequelize");
require("./models");
const Usuario = require("./models/Usuario");
const bcrypt = require("bcrypt");
const {
  requiereAutenticacion,
  requiereInvitado,
  requiereRolValidador,
} = require("./middlewares/auth");
const { url } = require("inspector");
const { group } = require("console");
const { crearMarcaAgua } = require('./helpers/marcaAgua');

const app = express();


// para las sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // va true cuando esté en produccion
  }),
);

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middleware para pasar los usuarios
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));


// rutas

//correcion del home.
app.get("/", async (req, res) => {
  // si el usuario no esta logueado tieen que mostrar la home normal hasta ahora
  if (!req.session.usuario) {
    return res.render("home");
  }

  try {
    const {
      Seguimiento,
      Publicacion,
      Imagen,
      Usuario: UsuarioModel,
      MensajePrivado,
    } = require("./models");
    const Op = require("sequelize").Op;

    //obtener los id de usuarios seguidos
    const seguidos = await Seguimiento.findAll({
      where: { seguidor_id: req.session.usuario.id },
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
          { model: UsuarioModel, attributes: ["id", "nombre"] },
        ],
        order: [["fecha_creacion", "DESC"]],
        limit: 15,
      });
    }

    // publicaciones populares, las mayores o iguales a 4 y minimo con 10 votos.
    const publicacionesPopulares = await Publicacion.findAll({
      where: {
        estado: { [Op.ne]: "baja" },
        ...(idsSeguidos.length > 0
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
        { model: UsuarioModel, attributes: ["id", "nombre"] },
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
        ...(idsSeguidos.length > 0
          ? { usuario_id: { [Op.notIn]: idsSeguidos } }
          : {}),
      },
      include: [
        { model: Imagen },
        { model: UsuarioModel, attributes: ["id", "nombre"] },
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
    res.status(500).send("Error al cargar la home");
  }
});

//routes
app.use('/', require('./routes/perfilRoutes'));
app.use('/', require('./routes/publicacionRoutes'));

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario || !usuario.cuenta_activa) {
    return res.send("Usuario no encontrado o cuenta inactiva");
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return res.send("Contraseña incorrecta");
  }

  req.session.usuario = {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };
  res.redirect("/");
});

app.get("/registro", (req, res) => {
  res.render("registro");
});

app.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await Usuario.create({ nombre, email, password_hash: passwordHash });
    res.redirect("/login");
  } catch (error) {
    res.send("Error al registrar.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


// seguir a una persona
app.post("/seguir/:usuario_id", requiereAutenticacion, async (req, res) => {
  try {
    const { Seguimiento, Notificacion } = require("./models");
    const seguidor_id = req.session.usuario.id;
    const seguido_id = req.params.usuario_id;

    if (seguidor_id == seguido_id) {
      return res.status(400).send("No podes seguirte a vos mismo papá");
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
});

// dejar de seguir
app.post(
  "/dejar-de-seguir/:usuario_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Seguimiento } = require("./models");
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
  },
);

// barra para busqueda
app.get("/buscar", async (req, res) => {
  try {
    const { q, etiqueta, usuario, licencia, valoracion_min } = req.query;
    const {
      Publicacion,
      Imagen,
      Etiqueta,
      Usuario: UsuarioModel,
      Sequelize,
    } = require("./models");
    const Op = require("sequelize").Op;

    const where = {
      estado: { [Op.ne]: "baja" }, //acá lo que descarto es que solo muestre las publicaciones activas.
    };

    if (q) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${q}%` } },
        { descripcion: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (usuario) {
      const usuarioEncontrado = await UsuarioModel.findOne({
        where: { nombre: { [Op.iLike]: `%${usuario}` } },
      });
      if (usuarioEncontrado) {
        where.usuario_id = usuarioEncontrado.id;
      } else {
        where.usuario_id = -1; // esto es sin resultados
      }
    }

    // esto lo pense para filtrar por licencia y valoracion
    const includeImagen = {
      model: Imagen,
      required: false,
      where: {},
    };

    if (licencia) {
      includeImagen.required = true;
      includeImagen.where.licencia = licencia;
    }

    if (valoracion_min) {
      includeImagen.required = true;
      includeImagen.where.promedio_valoracion = {
        [Op.gte]: parseFloat(valoracion_min),
      };
    }

    //include para las etiquetas
    const includeEtiqueta = {
      model: Etiqueta,
      required: false,
    };

    if (etiqueta) {
      includeEtiqueta.where = { nombre: { [Op.iLike]: `%${etiqueta}%` } };
      includeEtiqueta.required = true;
    }

    const publicaciones = await Publicacion.findAll({
      where,
      include: [
        includeImagen,
        includeEtiqueta,
        { model: UsuarioModel, attributes: ["id", "nombre"] },
      ],
      order: [["fecha_creacion", "DESC"]],
      limit: 50,
    });

    res.render("buscar", {
      publicaciones,
      terminos: req.query,
      usuario: req.session.usuario,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en la busqueda");
  }
});

// panel validador
app.get("/validador", requiereRolValidador, async (req, res) => {
  try {
    const {
      Publicacion,
      Imagen,
      DenunciaImagen,
      Usuario: UsuarioModel,
    } = require("./models");
    const sequelize = require("./config/database");
    const { Op } = require("sequelize");

    const [resultados] = await sequelize.query(`
      SELECT "Imagen"."publicacion_id"
      FROM "imagenes" AS "Imagen"
      INNER JOIN "denuncias_imagenes" AS "DenunciaImagen"
        ON "Imagen"."id" = "DenunciaImagen"."imagen_id"
      GROUP BY "Imagen"."id", "Imagen"."publicacion_id"
      HAVING COUNT(DISTINCT "DenunciaImagen"."usuario_id") > 3
      `);

    const idsPublicaciones = resultados.map((r) => r.publicacion_id);

    if (idsPublicaciones.length === 0) {
      return res.render("validador", {
        publicaciones: [],
        usuario: req.session.usuario,
      });
    }

    const publicaciones = await Publicacion.findAll({
      where: {
        id: idsPublicaciones,
        estado: { [Op.ne]: "baja" },
      },
      include: [
        {
          model: Imagen,
          include: [
            {
              model: DenunciaImagen,
              include: [{ model: UsuarioModel, attributes: ["id", "nombre"] }],
            },
          ],
        },
        {
          model: UsuarioModel,
          attributes: ["id", "nombre", "cuenta_activa"],
        },
      ],
    });

    res.render("validador", { publicaciones, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el panel del validador");
  }
});

// dar de baja la publicacion en su totalidad
app.post(
  "/validador/bajar/:publicacion_id",
  requiereRolValidador,
  async (req, res) => {
    try {
      const { Publicacion, Usuario: UsuarioModel } = require("./models");
      const publicacion = await Publicacion.findByPk(req.params.publicacion_id);

      if (!publicacion || publicacion.estado === "baja") {
        return res
          .status(404)
          .send("Publicacion no encontrada o ya tiene la baja.");
      }

      // cambiar estado de la publicacion
      await publicacion.update({ estado: "baja" });

      // verificar si el autor tiene 3 publicaciones bajas para inhabilitarla.
      const bajas = await Publicacion.count({
        where: { usuario_id: publicacion.usuario_id, estado: "baja" },
      });

      if (bajas >= 3) {
        await UsuarioModel.update(
          { cuenta_activa: false },
          { where: { id: publicacion.usuario_id } },
        );
      }

      res.redirect("/validador");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al dar de baja");
    }
  },
);

// desestimar las denuncias de una publicacion por si es errado
app.post(
  "/validador/desestimar/:publicacion_id",
  requiereRolValidador,
  async (req, res) => {
    try {
      const { Publicacion, Imagen, DenunciaImagen } = require("./models");
      const publicacion = await Publicacion.findByPk(
        req.params.publicacion_id,
        {
          include: [{ model: Imagen }],
        },
      );

      if (!publicacion)
        return res.status(404).send("Publicacion no encontrada");

      // eliminar todas las denuncias asociadas a la imagen de la publicacion
      const idsImagenes = publicacion.Imagens.map((img) => img.id);
      await DenunciaImagen.destroy({
        where: { imagen_id: idsImagenes },
      });

      // esto más bien es opcional pero puede sumar el volver a estado activo si estaba en revision
      if (publicacion.estado === "en_revision") {
        await publicacion.update({ estado: "activa" });
      }

      res.redirect("/validador");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al desestimar");
    }
  },
);

// notificaciones del usuario
app.get("/notificaciones", requiereAutenticacion, async (req, res) => {
  try {
    const { Notificacion, Usuario: UsuarioModel } = require("./models");

    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: req.session.usuario.id },
      include: [
        { model: UsuarioModel, as: "actor", attributes: ["id", "nombre"] },
      ],
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
});

//marcamos como leida la notificaciones
app.post(
  "/notificaciones/:id/leida",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Notificacion } = require("./models");
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
  },
);

//marcamos como leida todas las notificaciones
app.post(
  "/notificaciones/leer-todas",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Notificacion } = require("./models");
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
  },
);

// ver mensajes priv
app.get("/mensajes", requiereAutenticacion, async (req, res) => {
  try {
    const { MensajePrivado, Usuario: UsuarioModel } = require("./models");
    const Op = require("sequelize").Op;
    const sequelize = require("./config/database");

    const mensajes = await MensajePrivado.findAll({
      where: {
        [Op.or]: [
          { remitente_id: req.session.usuario.id },
          { destinatario_id: req.session.usuario.id },
        ],
      },
      include: [
        { model: UsuarioModel, as: "remitente", attributes: ["id", "nombre"] },
        {
          model: UsuarioModel,
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
});

// form para enviar el msj
app.get(
  "/mensajes/enviar/:usuario_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Usuario: UsuarioModel } = require("./models");
      const destinatario = await UsuarioModel.findByPk(req.params.usuario_id);
      if (!destinatario) return res.status(404).send("Usuario no encontrado");
      res.render("enviar_mensaje", { destinatario });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error");
    }
  },
);

app.post("/mensajes/enviar", requiereAutenticacion, async (req, res) => {
  try {
    const { MensajePrivado } = require("./models");
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
});

// conversacion
app.get(
  "/mensajes/conversacion/:otro_usuario_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const {
        MensajePrivado,
        Usuario: UsuarioModel,
        Imagen,
      } = require("./models");
      const Op = require("sequelize").Op;

      const otroUsuario = await UsuarioModel.findByPk(
        req.params.otro_usuario_id,
      );
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
            model: UsuarioModel,
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
  },
);

// colecciones
app.get("/colecciones", requiereAutenticacion, async (req, res) => {
  try {
    const { Coleccion, Publicacion, Imagen } = require("./models");
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
});

// crear coleccion y agregar publicacion
app.post("/colecciones", requiereAutenticacion, async (req, res) => {
  try {
    const { Coleccion, ColeccionPublicacion } = require("./models");
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
});

//sync bd y arrancar el servidor
const PORT = process.env.PORT || 3001;

sequelize
  .authenticate()
  .then(() => {
    console.log("Conexion establecida");
    return sequelize.sync({ force: false, alter: false });
  })
  .then(() => {
    console.log("Base de datos sincronizada");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error:", err);
  });
