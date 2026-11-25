require("dotenv").config({ quiet: true });
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");
const { Usuario } = require("./models");

const app = express();

// estaticos
app.use(express.static(path.join(__dirname, "public")));

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
// middleware para pasar los usuarios
app.use(async (req, res, next) => {
  if (!req.session.usuario) return next();
  const u = await Usuario.findByPk(req.session.usuario.id, {
    attributes: ["id", "nombre", "rol", "cuenta_activa"],
  });
  if (!u || !u.cuenta_activa) {
    return req.session.destroy(() => res.redirect("/login"));
  }
  req.session.usuario = { id: u.id, nombre: u.nombre, rol: u.rol };
  next();
});

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  delete req.session.aviso;
  next();
});

// vistas pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// rutas
app.use("/", require("./routes/homeRoutes"));
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/perfilRoutes"));
app.use("/", require("./routes/publicacionRoutes"));
app.use("/", require("./routes/busquedaRoutes"));
app.use("/", require("./routes/validadorRoutes"));
app.use("/", require("./routes/notificacionRoutes"));
app.use("/", require("./routes/mensajeRoutes"));
app.use("/", require("./routes/coleccionRoutes"));
app.use("/", require("./routes/denunciaRoutes"));
app.use((req, res) => {
  res.status(404).render("error", {
    codigo: 404,
    mensaje: "La pagina que buscas no existe",
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    codigo: 500,
    mensaje: "Algo salio mal. Probá de nuevo",
  });
});

//sync bd y arrancar el servidor
const PORT = process.env.PORT || 3000;

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
