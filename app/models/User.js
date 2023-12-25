const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const Duty = require("./Duty");

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shortcut: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("default", "moderator", "admin"),
      defaultValue: "default",
      allowNull: false,
    },
    isDutyEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
  }
);

module.exports = User;
