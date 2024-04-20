const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const Expense = sequelize.define(
  "expense",
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
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
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
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
  }
);

module.exports = Expense;
