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
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const { url } = require("inspector");
const { group } = require("console");

const app = express();

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

// funcion para las marcas de agua, creamos un SVG
async function crearMarcaAgua(texto) {
  const textoEscapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `
    <svg width="400" height="60" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="40" font-family="Arial" font-size="20" fill="white" opacity="0.7">
        ${textoEscapado}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

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

//perfil propio
app.get("/perfil", requiereAutenticacion, async (req, res) => {
  return res.redirect(`/perfil/${req.session.usuario.id}`);
});

// perfil del usuario especifico
app.get("/perfil/:id", requiereAutenticacion, async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const usuarioPerfil = await Usuario.findByPk(usuarioId);

    if (!usuarioPerfil) {
      return res.status(404).send("Usuario no encontrado");
    }

    //cuento los seguidores y seguidos
    const { Seguimiento, Publicacion } = require("./models");

    const seguidores = await Seguimiento.count({
      where: { seguido_id: usuarioId },
    });
    const seguidos = await Seguimiento.count({
      where: {
        seguidor_id: usuarioId,
      },
    });

    // chequeamos si el user actual sigue a X perfil
    const yaSigo = await Seguimiento.findOne({
      where: { seguidor_id: req.session.usuario.id, seguido_id: usuarioId },
    });

    // cargamos las publis
    const publicaciones = await Publicacion.findAll({
      where: { usuario_id: usuarioId },
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
});

// form publicar
app.get("/publicar", requiereAutenticacion, (req, res) => {
  res.render("publicar");
});

//procesar nueva publicacion
app.post(
  "/publicar",
  requiereAutenticacion,
  uploads.array("imagenes", 5),
  async (req, res) => {
    try {
      const { titulo, descripcion, etiquetas, licencia, marca_agua_texto } =
        req.body;
      const { Publicacion, Imagen, Etiqueta } = require("./models");
      //creamos la publi
      const publicacion = await Publicacion.create({
        titulo,
        descripcion,
        usuario_id: req.session.usuario.id,
      });

      // acá procesamos todas las imagenes en caso de haber + de 1 imagen
      // implementación futura (investigar) si es posible poder subir fotos de + de 5mb y comprimirlas
      for (const file of req.files) {
        let nombreArchivo = file.filename;

        //si tiene copy aplica marca de agua
        if (licencia === "con_copyright" && marca_agua_texto) {
          const nombreConMarca = "wm-" + file.filename;
          const texto = marca_agua_texto || "© " + req.session.usuario.nombre;

          await sharp(file.path)
            .composite([
              {
                input: await crearMarcaAgua(texto),
                gravity: "southeast",
              },
            ])
            .toFile("uploads/" + nombreConMarca);

          //y eliminamos el archivo original
          fs.unlinkSync(file.path);
          nombreArchivo = nombreConMarca;
        }

        //guardamos en la BD
        await Imagen.create({
          url: "/uploads/" + nombreArchivo,
          publicacion_id: publicacion.id,
          licencia,
          marca_agua_texto:
            licencia === "con_copyright" ? marca_agua_texto : null,
        });
      }

      //procesamos las etiquetas de la publi
      if (etiquetas) {
        const { PublicacionEtiqueta } = require("./models");
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
  },
);

// ver publicacion
app.get("/publicaciones/:id", async (req, res) => {
  try {
    const {
      Publicacion,
      Imagen,
      Etiqueta,
      Comentario,
      Usuario: UsuarioModel,
    } = require("./models");

    const publicacion = await Publicacion.findByPk(req.params.id, {
      include: [
        {
          model: Imagen,
        },
        {
          model: Etiqueta,
        },
        {
          model: UsuarioModel,
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (!publicacion) {
      return res.status(400).send("Publicacion no encontrada");
    }

    //comentarios
    const comentarios = await Comentario.findAll({
      where: {
        imagen_id: publicacion.Imagens[0]?.id,
        borrado: false,
      },
      include: [
        {
          model: UsuarioModel,
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha", "ASC"]],
    });

    res.render("publicacion", {
      publicacion,
      comentarios,
      esAutor:
        req.session.usuario &&
        req.session.usuario.id === publicacion.usuario_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar publicacion");
  }
});

//comentar una imagen
app.post("/comentar/:imagen_id", requiereAutenticacion, async (req, res) => {
  try {
    const {
      Comentario,
      Imagen,
      Notificacion,
      Publicacion,
    } = require("./models");
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
});

//valorar/puntuar imagen
app.post("/valorar/:imagen_id", requiereAutenticacion, async (req, res) => {
  try {
    const {
      Valoracion,
      Imagen,
      Notificacion,
      Publicacion,
    } = require("./models");
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
});

// marcar interes en una publicacion/imagen
app.post("/me-interesa/:imagen_id", requiereAutenticacion, async (req, res) => {
  try {
    const { Interes, Imagen, Notificacion, Publicacion } = require("./models");
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

    res.redirect(`/mensajes/enviar/${publicacion.usuario_id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al marcar interes");
  }
});

// si soy autor cerrar comentarios
app.post(
  "/cerrar-comentarios/:imagen_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Imagen, Publicacion } = require("./models");
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
  },
);

// si soy autor poder borrar comentarios
app.post(
  "/borrar-comentario/:comentario_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { Comentario, Imagen, Publicacion } = require("./models");
      const comentario = await Comentario.findByPk(req.params.comentario_id);
      if (!comentario) return res.status(404).send("Comentario no encontrado");

      const imagen = await Imagen.findByPk(comentario.imagen_id);
      const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

      if (publicacion.usuario_id !== req.session.usuario.id) {
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
  },
);

//hacer denuncia de imagen
app.get("/denunciar/imagen/:imagen_id", requiereAutenticacion, (req, res) => {
  res.render("denunciar_imagen", { imagen_id: req.params.imagen_id });
});

//proceso la deuncia de la imagen
app.post(
  "/denunciar/imagen/:imagen_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { DenunciaImagen } = require("./models");
      const imagen_id = req.params.imagen_id;
      const { motivo, descripcion } = req.body;

      await DenunciaImagen.create({
        motivo,
        descripcion,
        usuario_id: req.session.usuario.id,
        imagen_id,
      });

      //no se puede editar la imagen si tiene denuncias
      const { Imagen } = require("./models");
      const imagen = await Imagen.findByPk(imagen_id);
      res.redirect(`/publicaciones/${imagen.publicacion_id}`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al denunciar imagen");
    }
  },
);

// hacer denuncia de comentario
app.get(
  "/denunciar/comentario/:comentario_id",
  requiereAutenticacion,
  (req, res) => {
    res.render("denunciar_comentario", {
      comentario_id: req.params.comentario_id,
    });
  },
);

// proceso la denuncia de comentario
app.post(
  "/denunciar/comentario/:comentario_id",
  requiereAutenticacion,
  async (req, res) => {
    try {
      const {
        DenunciaComentario,
        Comentario,
        Imagen,
        Publicacion,
      } = require("./models");
      const comentario_id = req.params.comentario_id;
      const { motivo, descripcion } = req.body;

      await DenunciaComentario.create({
        motivo,
        descripcion,
        usuario_id: req.session.usuario.id,
        comentario_id,
      });

      const comentario = await Comentario.findByPk(comentario_id);
      const imagen = await Imagen.findByPk(comentario.imagen_id);
      const publicacion = await Publicacion.findByPk(imagen.publicacion_id);

      res.redirect("/publicaciones/" + publicacion.id);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al denunciar comentario");
    }
  },
);

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
    };

    if (licencia) {
      includeImagen.where = includeImagen.where || {};
      includeImagen.where.licencia = licencia;
    }

    if (valoracion_min) {
      includeImagen.where = includeImagen.where || {};
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

    res.render("mensajes", { mensajes, usuario: req.session.usuario });
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

    res.redirect("/mensajes");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al enviar");
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
