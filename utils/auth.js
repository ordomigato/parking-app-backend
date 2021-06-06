const passport = require("passport");
const { User } = require("../models");

/*
  @DESC Validate Email, Username, role & JWT
*/

const validateEmail = async email => {
  const findEmail = await User.findOne({ where: { email } });
  return findEmail ? true : false;
};

const validateUsername = async username => {
  const findUsername = await User.findOne({ where: { username } });
  console.log(findUsername);
  return findUsername ? true : false;
};

const userAuth = passport.authenticate("jwt", { session: false });

const checkRole = roles => (req, res, next) =>
  !roles.includes(req.user.role)
    ? res.status(401).json({
        message: ["Unauthorized"],
        success: false,
      })
    : next();

const serializeUser = user => {
  return {
    username: user.username,
    email: user.email,
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
  };
};

module.exports = {
  userAuth,
  checkRole,
  validateEmail,
  validateUsername,
  serializeUser,
};
