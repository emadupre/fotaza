const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notificacion = sequelize.define(
  "Notificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_evento: {
      type: DataTypes.ENUM(
        "comentario",
        "valoracion",
        "me_interesa",
        "seguimiento",
      ),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referencia_id: {
      type: DataTypes.INTEGER,
    },
    referencia_tipo: {
      type: DataTypes.ENUM("comentario", "imagen", "publicacion"),
    },
  },
  {
    tableName: "notificaciones",
    timestamps: false,
    indexes: [{ fields: ["usuario_id", "leida", "fecha"] }],
  },
);

module.exports = Notificacion;
