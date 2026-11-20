const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DenunciaImagen = sequelize.define(
  "DenunciaImagen",
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
    estado: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "pendiente", // pendiente | desestimada | aceptada -> por el CHECK está en constraints.sql
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imagen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "denuncias_imagenes",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["usuario_id", "imagen_id"] },
      { fields: ["imagen_id", "estado"] },
    ],
  },
);

module.exports = DenunciaImagen;
