const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Coleccion = sequelize.define(
  "Coleccion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "colecciones",
    timestamps: false,
  },
);

module.exports = Coleccion;
