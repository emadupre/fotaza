require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");
require("./models");
const Usuario = require('./models/Usuario');
const bcrypt = require('bcrypt');

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

// middleware para pasar los usuarios
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// rutas
app.get("/", (req, res) => {
  res.render('home');
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario || !usuario.cuenta_activa) {
    return res.send('Usuario no encontrado o cuenta inactiva');
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return res.send('Contraseña incorrecta');
  }

  req.session.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
  res.redirect('/');
});

app.get('/registro', (req, res) => {
  res.render('registro');
});

app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await Usuario.create({ nombre, email, password_hash: passwordHash });
    res.redirect('/login');
  } catch (error) {
    res.send('Error al registrar.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
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
      console.log(`Servidor corriendo en https://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error:", err);
  });
