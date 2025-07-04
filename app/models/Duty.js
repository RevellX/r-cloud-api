const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

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
    dutyUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
    tableName: "duties",
    paranoid: true,
  }
);

module.exports = Duty;
