const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Publicacion = sequelize.define(
  "Publicacion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM("activa", "en_revision", "baja"),
      defaultValue: "activa",
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "publicaciones",
    timestamps: false,
    indexes: [
      { fields: ["usuario_id"] },
      { fields: ["estado", "fecha_creacion"] },
    ],
  },
);

module.exports = Publicacion;
