const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PublicacionEtiqueta = sequelize.define(
  "PublicacionEtiqueta",
  {
    publicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    etiqueta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "publicaciones_etiquetas",
    timestamps: false,
  },
);

module.exports = PublicacionEtiqueta;
