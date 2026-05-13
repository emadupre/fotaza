const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  biografia: {
    type: DataTypes.TEXT,
  },
  avatar: {
    type: DataTypes.STRING,
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  cuenta_activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rol: {
    type: DataTypes.ENUM('usuario', 'validador'),
    defaultValue: 'usuario',
  }
}, {
  tableName: 'usuarios',
  timestamps: false,
});

module.exports = Usuario;