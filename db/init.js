require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const sequelize = require("../config/database");
const { Usuario } = require("../models"); // además registra todos los modelos para sync
const { seed } = require("../seeders/seed");

const REQUERIDAS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];

function verificarEntorno() {
  const faltan = REQUERIDAS.filter((k) => process.env[k] === undefined);
  if (faltan.length > 0) {
    console.error(`Faltan variables de entorno: ${faltan.join(", ")}`);
    console.error(
      "Copiá .env.example a .env y completá los datos de PostgreSQL.",
    );
    process.exit(1);
  }
}

// Crea la base si no existe (pasa en local; en Render ya viene creada)
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

async function conectar() {
  try {
    await sequelize.authenticate();
  } catch (error) {
    // 3D000 = la base no existe
    if (error.original?.code !== "3D000") throw error;
    await crearBase();
    await sequelize.authenticate();
  }
}

// CHECK, defaults y comentarios que Sequelize no genera desde los modelos
async function aplicarRestricciones() {
  const sql = fs.readFileSync(path.join(__dirname, "constraints.sql"), "utf8");
  await sequelize.query(sql);
  console.log("Restricciones y comentarios aplicados.");
}

// Solo carga datos de prueba si todavía no hay usuarios (no pisa datos existentes)
async function cargarDatosDePrueba() {
  if ((await Usuario.count()) > 0) {
    console.log("Ya hay usuarios: no se cargan datos de prueba.");
    return;
  }
  console.log("Cargando datos de prueba...");
  await seed();
}

function mostrarError(error) {
  console.error("Error al inicializar la base de datos:");
  console.error(error.message || "(sin mensaje)");
  if (error.original)
    console.error(
      "Postgres:",
      error.original.message,
      error.original.detail || "",
    );
  if (error.sql) console.error("SQL:", error.sql.slice(0, 300));
  for (const e of error.errors || []) {
    const items = e.errors?.errors || []; // AggregateError -> BulkRecordError -> ValidationError
    if (items.length)
      items.forEach((i) =>
        console.error(" - validación:", i.path, "->", i.message),
      );
    else console.error(" -", e.message || e);
  }
  console.error(error.stack);
}

async function init() {
  verificarEntorno();
  try {
    await conectar();
    await sequelize.sync({ force: false, alter: false });
    console.log("Tablas listas.");
    await aplicarRestricciones();
    await cargarDatosDePrueba();
    console.log("Base de datos inicializada.");
  } catch (error) {
    mostrarError(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

init();
