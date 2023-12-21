const Sequelize = require("sequelize");

const sequelize = new Sequelize("rcloud", "revellx", "12345678", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
