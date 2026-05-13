const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MensajePrivado = sequelize.define(
  "MensajePrivado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    asunto: {
      type: DataTypes.STRING,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    remitente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    destinatario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imagen_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "mensajes_privados",
    timestamps: false,
  },
);

module.exports = MensajePrivado;
