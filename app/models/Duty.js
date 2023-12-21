const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Duty = sequelize.define(
  "duty",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
    tableName: "duties",
  }
);

module.exports = Duty;
