const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const ExpenseGroup = sequelize.define(
  "expenseGroup",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    members: {
      type: DataTypes.STRING(10000),
      allowNull: false,
      defaultValue: "",
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
  }
);

module.exports = ExpenseGroup;
