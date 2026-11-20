const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DenunciaComentario = sequelize.define(
  "DenunciaComentario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comentario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "denuncias_comentarios",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["usuario_id", "comentario_id"] },
      { fields: ["comentario_id"] },
    ],
  },
);

module.exports = DenunciaComentario;
