require("dotenv").config();
const bcrypt = require("bcrypt");
const { Usuario } = require("../models");

async function seed() {
  try {
    const passwordHash = await bcrypt.hash("123456", 10);

    const usuarios = await Usuario.bulkCreate(
      [
        {
          nombre: "Admin",
          email: "validador@fotaza.com",
          password_hash: passwordHash,
          biografia: "Ema Dupre CEO de Fotaza",
          rol: "validador",
          cuenta_activa: true,
        },
        {
          nombre: "Jose Bossa",
          email: "jose@fotaza.com",
          password_hash: passwordHash,
          biografia: "Fotografo profesional",
          rol: "usuario",
          cuenta_activa: true,
        },
        {
          nombre: "Enzo Fet",
          email: "enzofet@fotaza.com",
          password_hash: passwordHash,
          biografia: "Artista Visual",
          rol: "usuario",
          cuenta_activa: true,
        },
        {
          nombre: "Naiara Bongiovanni",
          email: "naib@fotaza.com",
          password_hash: passwordHash,
          biografia: "Viajera del mundo",
          rol: "usuario",
          cuenta_activa: true,
        },
      ],
      { validate: true },
    );

    console.log("Users creados.");
    usuarios.forEach((u) => {
      console.log(`     ${u.nombre} (${u.email}) - ${u.rol}`);
    });

    console.log("La contraseña para todos: 123456");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seed();