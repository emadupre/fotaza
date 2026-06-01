// funcion para que solo los usuarios autenticados pueda entrar
function requiereAutenticacion(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }
  next();
}

// para que solo los usuarios no autenticados (osea, login/registro)
function requiereInvitado(req, res, next) {
  if (req.session.usuario) {
    return res.redirect("/");
  }
  next();
}

// para que los validadores puedan entrar
function requiereRolValidador(req, res, next) {
  if (!req.session.usuario || req.session.usuario.rol !== "validador") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}

module.exports = {
  requiereAutenticacion,
  requiereInvitado,
  requiereRolValidador,
};
