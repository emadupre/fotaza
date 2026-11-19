require("dotenv").config;
const { Client } = require("pg");
const sequelize = require("../config/database");
const { Usuario } = require("../models");
const { seed } = require("../seeders/seed");

const REQUERIDAS = ["DB_HOST", "DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];

function verificarEntorno() {
  const faltan = REQUERIDAS.filter((k) => process.env[k] === undefined);
  if (faltan.length > 0) {
    console.error(`Faltan variables de entorno: ${faltan.join(", ")}`);
    console.error(
      "Copia .env.example a .env y completa los datos de PostgreSQL. ",
    );
    process.exit(1);
  }
}

async function crearBase() {
  const admin = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  await admin.connect();
  try {
    const nombre = '"' + process.env.DB_NAME.replace(/"/g, '""') + '"';
    await admin.query(`CREATE DATABASE ${nombre}`);
    console.log(`Base ${process.env.DB_NAME} creada.`);
  } finally {
    await admin.end();
  }
}

async function init() {
  verificarEntorno();
  try {
    await conectar();
    await sequelize.sync({ force: false, alter: false });
    console.log("Tablas listas");
    await cargarDatosDePrueba();
    console.log("Base de datos inicializada");
  } catch (error) {
    console.log("Error al inicializar la base de datos:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

init();
