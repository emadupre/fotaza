require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");
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
app.get('/publicaciones/:id', async (req, res) => {
  try {
    const { Publicacion, Imagen, Etiqueta, Comentario, Usuario: UsuarioModel } = require('./models');

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
          attributes: ['id', 'nombre'],
        }
      ]
    });

    if (!publicacion) {
      return res.status(400).send('Publicacion no encontrada');
    }

    //comentarios
    const comentarios = await Comentario.findAll({
      where: {
        imagen_id: publicacion.Imagens[0]?.id
      },
      include: [
        {
          model: UsuarioModel, attributes: ['id', 'nombre']
        }
      ],
      order: [['fecha', 'ASC']]
    });

    res.render('publicacion', {
      publicacion,
      comentarios,
      esAutor: req.session.usuario && req.session.usuario.id === publicacion.usuario_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar publicacion');
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
