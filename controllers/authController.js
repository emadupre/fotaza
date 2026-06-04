const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");

exports.mostrarLogin = (req, res) => {
  res.render("login");
};

exports.procesarLogin = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ where: email });

  if (!usuario || !usuario.cuenta_activa) {
    return res.send("Usuario no encontrado");
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
};

exports.mostrarRegistro = (req, res) => {
  res.render("registro");
};

exports.procesarRegistro = async (req, res) => {
  const { nombre, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await Usuario.create({ nombre, email, password_hash: passwordHash });
    res.redirect("/login");
  } catch (error) {
    res.send("Error en el registro");
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
