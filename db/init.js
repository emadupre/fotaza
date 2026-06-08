require('dotenv').config;
const sequelize = require('../config/database');
require('../models'); //importo los modelos para que el sequelize me los detecte

async function init() {
  try {
    await sequelize.authenticate();

    await sequelize.sync({ force: false, alter: false });

    process.exit(0);
  } catch (error) {
    console.error('Error al crear las tablas', error.message);
    process.exit(1);
  }
}

init();