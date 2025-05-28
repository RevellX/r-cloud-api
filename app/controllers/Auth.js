const UserModel = require("../models/User");
const {
  sha256,
  createToken,
  isUUIDCorrect,
} = require("../utils/functions");

const isUsernameCorrect = (username) => {
  if (
    username &&
    typeof username === "string" &&
    username.length > 0 &&
    username.length < 64
  )
    return true;
  return false;
};

const isPasswordCorrect = (password) => {
  if (
    password &&
    typeof password === "string" &&
    password.length > 0 &&
    password.length < 64
  )
    return true;
  return false;
};

const checkBody = (req, res, next) => {
  const { username, password } = req.body;
  if (!isUsernameCorrect(username) || !isPasswordCorrect(password))
    return res.status(400).json({
      message: "Something is wrong with your request body",
    });
  next();
};

const checkUsernameIsUnique = (req, res, next) => {
  const { username } = req.body;

  UserModel.count({
    where: {
      username: username,
    },
  })
    .then((count) => {
      if (count > 0)
        return res.status(400).json({
          message: "User with such username already exists",
        });
      else next();
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to check username uniqueness" });
    });
};

const getPermissionsFrom = (user) => {
  // This piece of code turn permissions string into permissions object
  // Warning: There is no error control. Permission string MUST be kept in order;
  const permissions = {};
  user.permissions &&
    user.permissions
      .split(";")
      .map((permStringOne) => permStringOne.split("."))
      .map((permission) => {
        if (!permissions[permission[0]])
          permissions[permission[0]] = {};
        permissions[permission[0]][permission[1].split(":")[0]] =
          permission[1].split(":")[1];
      });
  return permissions;
};

const userHasPermission =
  (permission = undefined) =>
  (req, res, next) => {
    const { user_id } = req.tokenPayload;

    if (
      typeof permission !== "string" ||
      permission.split(".").length !== 2
    )
      return res
        .status(500)
        .json({ message: "Error while checking permission" });

    UserModel.findByPk(user_id)
      .then((user) => {
        const userPermissions = getPermissionsFrom(user);
        const [module, action] = permission.split(".");
        const permissionCheck = {
          module: module,
          action: action,
        };
        let result = false;
        if (
          userPermissions[permissionCheck.module] &&
          userPermissions[permissionCheck.module][
            permissionCheck.action
          ]
        ) {
          result =
            userPermissions[permissionCheck.module][
              permissionCheck.action
            ];
        } else if (
          userPermissions[permissionCheck.module] &&
          "*" in userPermissions[permissionCheck.module]
        ) {
          result = userPermissions[permissionCheck.module]["*"];
        }
        if (result === "true") result = true;
        else if (result === "false") result = false;
        if (result) return next();
        return res.status(403).json({ message: "No permission" });
      })
      .catch((err) =>
        res.status(400).json({ message: "Something went wrong" })
      );
  };

// This should no longer be used.
const checkUserPermission = (type) => (req, res, next) => {
  const { user_id } = req.tokenPayload;

  UserModel.findByPk(user_id)
    .then((user) => {
      if (!user) {
        throw "Unable to authorize";
      } else if (user.type !== type) {
        throw "No permission";
      } else {
        next();
      }
    })
    .catch((err) => res.status(400).json({ message: err }));
};

const swapUsers = (req, res) => {
  // const { user_id } = req.tokenPayload; // Maybe for permissions check?
  const { userOne, userTwo } = req.body;

  if (!isUUIDCorrect(userOne) || !isUUIDCorrect(userTwo))
    return res
      .status(400)
      .json({ message: "Something is wrong with your body data" });

  UserModel.findAll({
    attributes: ["id", "order"],
    where: {
      id: [userOne, userTwo],
    },
  })
    .then((users) => {
      const [userOneB, userTwoB] = users;
      const tempOrder = userOneB.order;
      userOneB.order = userTwoB.order;
      userTwoB.order = tempOrder;

      const savePromises = users.map((user) => user.save());

      Promise.all(savePromises)
        .then(() => res.json({ message: "Users swapped" }))
        .catch(() =>
          res.status(500).json({ message: "Unable to swap users" })
        );
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to swap users" });
    });
};

const register = (req, res, next) => {
  const { username, password, shortcut } = req.body;

  if (
    shortcut &&
    typeof shortcut === "string" &&
    shortcut.length === 3
  )
    sha256(password)
      .then((hashedPassword) =>
        UserModel.count().then((userCount) =>
          UserModel.create({
            username: username,
            password: hashedPassword,
            shortcut: shortcut,
            order: userCount + 1,
          })
        )
      )
      .then((user) => {
        return res.json({ message: "New account has been created" });
      })
      .catch((err) => {
        console.log(err);
        return res
          .status(500)
          .json({ message: "Unable to create new account" });
      });
  else
    return res
      .status(400)
      .json({ message: "Something is wrong with your request body" });
};

const authenticate = async (req, res, next) => {
  const { username, password } = req.body;

  const hashedPassword = await sha256(password);

  UserModel.findOne({
    attributes: ["id", "username", "type", "permissions"],
    where: {
      username: username,
      password: hashedPassword,
    },
  })
    .then((user) => {
      if (!user)
        return res.status(401).json({
          message: "Unable to authenticate with given credentials",
        });

      const permissions = getPermissionsFrom(user);

      return res.json({
        message: "Authenticated",
        user: {
          id: user.id,
          username: user.username,
          type: user.type,
          permissions: permissions,
        },
        ...createToken(user.id),
      });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to authenticate" });
    });
};

const getUser = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;

  UserModel.findByPk(loggedUser, {
    attributes: ["id", "username", "permissions"],
  }).then((user) => {
    return res.json(user);
  });
};

const updateToken = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;
  return res.json(createToken(loggedUser));
};

module.exports = {
  authenticate,
  register,
  swapUsers,
  checkBody,
  checkUsernameIsUnique,
  checkUserPermission,
  userHasPermission,
  getUser,
  updateToken,
};
