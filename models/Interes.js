const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Interes = sequelize.define(
  "Interes",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
  },
  {
    tableName: "intereses",
    timestamps: false,
  },
);

module.exports = Interes;
