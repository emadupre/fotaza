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
} = require("./middlewares/auth");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const { url } = require("inspector");

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
app.get("/", (req, res) => {
  res.render("home");
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

    res.redirect("back");
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

    res.redirect("back");
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
    await Notification.create({
      tipo_evento: "me_interesa",
      usuario_id: publicacion.usuario_id,
      actor_id: req.session.usuario.id,
      referencia_id: imagen_id,
      referencia_tipo: "imagen",
    });

    res.redirect(`/mensajes/enviar/${publicacion.usuario.id}`);
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
      res.redirect("back");
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

      res.redirect("back");
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
      const { DenunciaImagen, Imagen, Publicacion } = require("./models");
      const imagen_id = req.params.imagen_id;
      const { motivo, descripcion } = req.body;

      await DenunciaImagen.create({
        motivo,
        descripcion,
        usuario_id: req.session.usuario.id,
        imagen_id,
      });

      //no se puede editar la imagen si tiene denuncias
      const image = await Imagen.findByPk(imagen_id);
      const publicacion = await Publicacion.findByPk(imagen.publicacion_id);
      // aca lo que podemos hacer es cambiar el estado de la iamgen a "en revision"
      // si tiene alguna denuncia

      if (publicacion.estado === "activa") {
        await publicacion.update({ estado: "en_revision" });
      }

      res.redirect(`/publicaciones/${publicacion.id}`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al denunciar imagen");
    }
  },
);

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
