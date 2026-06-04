require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");
require("./models");

const app = express();

// estaticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
})

// vistas pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// rutas
app.use('/', require('./routes/homeRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use("/", require("./routes/perfilRoutes"));
app.use("/", require("./routes/publicacionRoutes"));
app.use("/", require("./routes/busquedaRoutes"));
app.use("/", require("./routes/validadorRoutes"));
app.use("/", require("./routes/notificacionRoutes"));
app.use("/", require("./routes/mensajeRoutes"));
app.use("/".require("./routes/coleccionRoutes"));

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
