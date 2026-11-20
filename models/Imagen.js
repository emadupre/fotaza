const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Imagen = sequelize.define(
  "Imagen",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    licencia: {
      type: DataTypes.ENUM("con_copyright", "sin_copyright"),
      defaultValue: "sin_copyright",
    },
    marca_agua_texto: {
      type: DataTypes.STRING,
    },
    comentarios_cerrados: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    promedio_valoracion: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    total_votos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "imagenes",
    timestamps: false,
    indexes: [{ fields: ["publicacion_id"] }],
  },
);

module.exports = Imagen;
