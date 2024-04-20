const { DataTypes, Sequelize } = require("sequelize");

const sequelize = require("../config/database");

const Message = sequelize.define(
  "message",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderId: {
      //   type: DataTypes.STRING, // Change to UUID after testing
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiverId: {
      //   type: DataTypes.STRING, // Change to UUID after testing
      type: DataTypes.UUID,
      allowNull: false,
    },
    sentAt: {
      type: DataTypes.DATE(6),
      defaultValue: Sequelize.NOW,
    },
  },
  {
    indexes: [{ unique: true, fields: ["id"] }],
  }
);

module.exports = Message;
