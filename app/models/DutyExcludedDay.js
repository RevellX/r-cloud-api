const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const DutyExcludedDay = sequelize.define(
  "dutyExcludedDay",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
    tableName: "dutiesExcludedDays",
  }
);

module.exports = DutyExcludedDay;
