const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

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
      // This is no longer in use. Remove it sometime in the future.
      type: DataTypes.ENUM("default", "moderator", "admin"),
      defaultValue: "default",
      allowNull: false,
    },
    permissions: {
      type: DataTypes.STRING(10000),
      allowNull: false,
      defaultValue: "",
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
