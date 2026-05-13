const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Seguimiento = sequelize.define(
  "Seguimiento",
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
    seguidor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seguido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "seguimientos",
    timestamps: false,
  },
);

module.exports = Seguimiento;
