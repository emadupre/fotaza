const bcrypt = require("bcrypt");

const { Usuario } = require("../models");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HASH_FALSO = bcrypt.hashSync("fotaza-sin-usuario", 10);

exports.mostrarLogin = (req, res) => {
  res.render("login");
};

exports.procesarLogin = async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";
  const fallar = (error) => res.status(401).render("login", { error, email });

  const usuario = await Usuario.findOne({ where: { email } });
  const passwordValida = await bcrypt.compare(
    password,
    usuario ? usuario.password_hash : HASH_FALSO,
  );

  if (!usuario || !passwordValida)
    return fallar("Email o contraseña incorrecta");

  if (!usuario.cuenta_activa) {
    return fallar(
      "Tu cuenta fue inactivada por acumulaar 3 publicaciones dadas de baja.",
    );
  }
  req.session.regenerate((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al iniciar sesión.");
    }

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
    res.redirect("/");
  });
};

exports.mostrarRegistro = (req, res) => res.render("registro");

exports.procesarRegistro = async (req, res) => {
  const nombre = (req.body.nombre || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";
  const volver = (error) =>
    res.status(400).render("registro", { error, nombre, email });

  if (nombre.length < 2 || nombre.length > 100)
    return volver("El nombre debe tener entre 2 y 100 caracteres");
  if (!EMAIL_RE.test(email) || email.length > 255)
    return volver("Ingresá un email valido");
  if (password.length < 6 || password.length > 72)
    return volver("La contraseña debe tener entre 6 y 72 caracteres");

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await Usuario.create({ nombre, email, password_hash: passwordHash });
    res.redirect("/login");
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError")
      return volver("Ya existe una cuenta con ese email");
    console.error(error);
    res.status(500).send("Error en el registro");
  }
};

exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};
