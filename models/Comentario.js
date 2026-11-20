const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comentario = sequelize.define(
  "Comentario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imagen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    borrado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "comentarios",
    timestamps: false,
    indexes: [{ fields: ["imagen_id", "fecha"] }],
  },
);

module.exports = Comentario;
