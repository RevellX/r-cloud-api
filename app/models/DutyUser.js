const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const DutyUser = sequelize.define(
  "dutyUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shortcut: {
      type: DataTypes.STRING,
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
    paranoid: true,
  }
);

module.exports = DutyUser;
