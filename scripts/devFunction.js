const User = require("../app/models/User");

User.findOne({
  where: {
    username: "Kamilek",
  },
}).then((kamilek) => {
  kamilek.type = "admin";
  kamilek.save();
});
