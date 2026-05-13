require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const sequelize = require("./config/database");

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

// pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// rutas
app.get("/", (req, res) => {
  res.send("Server funcionando");
});

//sync bd y arrancar el servidor
const PORT = process.env.PORT || 3001;

sequelize.sync({ force: false, alter: false })
  .then(() => {
    console.log("Base de datos sincronizada");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en https://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al sincronizar la BD:", err);
  });
