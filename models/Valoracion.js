const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Valoracion = sequelize.define(
  "Valoracion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
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
    tableName: "valoraciones",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["usuario_id", "imagen_id"] },
      { fields: ["imagen_id"] },
    ],
  },
);

module.exports = Valoracion;
