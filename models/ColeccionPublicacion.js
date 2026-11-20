const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ColeccionPublicacion = sequelize.define(
  "ColeccionPublicacion",
  {
    coleccion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    publicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "colecciones_publicaciones",
    timestamps: false,
    indexes: [{ fields: ["publicacion_id"] }],
  },
);

module.exports = ColeccionPublicacion;
