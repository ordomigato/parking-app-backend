const express = require("express");
const router = express.Router();
const { userAuth, checkRole } = require("../../utils/auth");
const { check, validationResult } = require("express-validator");
const { validateEmail } = require("../../utils/auth");
const { User, Permit } = require("../../models");
const bcrypt = require("bcryptjs");

// THESE ROUTES ARE ONLY FOR ADMINS

// @route       GET api/users
// @desc        Get all users
// @access      Admin Only
router.get("/", [userAuth, checkRole([1, 2])], async (req, res) => {
  try {
    const users = await User.findAll({
      include: ["permits"],
      order: [["createdAt", "DESC"]],
    });

    return res
      .status(200)
      .json({ message: ["Users were found"], success: true, users });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find users" }],
      success: false,
    });
  }
});

// @route       PUT api/users/change-password
// @desc        change a user's password
// @access      current-user
router.put(
  "/change-password",
  [
    userAuth,
    [
      check("oldPassword", "Please enter your old password").not().isEmpty(),
      check("newPassword", "Please enter your new password").exists(),
      check("confirmNewPassword", "Passwords must match")
        .not()
        .isEmpty()
        .custom((value, { req }) => value === req.body.newPassword)
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i")
        .withMessage(
          "Password must be at least 8 characters long, contain at least 1 lowercase letter, contain at least 1 uppercase letter, and 1 number"
        ),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      // find user (requires password to be returned)
      const user = await User.scope("login").findOne({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(401).json({
          errors: [
            { msg: "Something went wrong, refresh the page and try again" },
          ],
          success: false,
        });
      }

      // check old password
      let isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({
          errors: [{ msg: "Old password is incorrect" }],
          success: false,
        });
      }

      // check new password is not the same as old password
      let oldVsNewIsMatch = await bcrypt.compare(newPassword, user.password);

      if (oldVsNewIsMatch) {
        return res.status(401).json({
          errors: [{ msg: "New password must be different than old password" }],
          success: false,
        });
      }

      // hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;

      await user.save();

      // return new user object
      return res
        .status(200)
        .json({ message: ["Password was changed"], success: true });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to change password" }],
        success: false,
      });
    }
  }
);

// @route       GET api/users/:id
// @desc        Get a user by its ID
// @access      Admin Only
router.get("/:id", [userAuth, checkRole([1, 2])], async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        errors: [{ msg: "No user was found" }],
        success: false,
      });
    }

    return res
      .status(200)
      .json({ message: ["User was found"], success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find user" }],
      success: false,
    });
  }
});

// @route       POST api/users
// @desc        Add a user
// @access      Admin Only
router.post(
  "/",
  [
    userAuth,
    checkRole([1, 2]),
    [
      check("firstName", "Please enter a first name").not().isEmpty(),
      check("lastName", "please enter a last name").exists(),
      check("email", "please enter an email").exists(),
      check("password", "please enter a password").exists(),
      check("role", "please select a role").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    let { firstName, lastName, email, password, defaultPhone, role } = req.body;

    try {
      // validate email
      let emailTaken = await validateEmail(email);
      if (emailTaken) {
        return res.status(400).json({
          errors: [{ msg: "Email is already taken" }],
          success: false,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into table
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        defaultPhone,
        role,
      });

      return res
        .status(200)
        .json({ message: ["User was added"], success: true, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to create account" }],
        success: false,
      });
    }
  }
);

// @route       PUT api/users/update/current-user
// @desc        Edit current user
// @access      Current user only
router.put(
  "/update/current-user",
  [
    userAuth,
    [
      check("firstName", "First name cannot be empty").not().isEmpty(),
      check("lastName", "Last name cannot be empty").exists(),
      check("email", "Email cannot be empty").exists(),
      check("defaultPhone", "Please enter your phone number").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { firstName, lastName, email, defaultPhone } = req.body;

    try {
      // find user
      const user = await User.findOne({ where: { id: req.user.id } });

      if (!user) {
        return res.status(401).json({
          errors: [
            { msg: "Something went wrong, refresh the page and try again" },
          ],
          success: false,
        });
      }

      // update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.defaultPhone = defaultPhone || user.defaultPhone;

      // save user
      await user.save();

      // return new user object
      return res
        .status(200)
        .json({ message: ["User was updated"], success: true, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to update user" }],
        success: false,
      });
    }
  }
);

// @route       PUT api/users/update/:id
// @desc        Edit a user by its ID
// @access      Admin Only
router.put(
  "/update/:id",
  [
    userAuth,
    checkRole([1, 2]),
    [
      check("firstName", "Please enter a first name").not().isEmpty(),
      check("lastName", "please enter a last name").exists(),
      check("email", "please enter an email").exists(),
      check("role", "please select a role").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { firstName, lastName, email, role, defaultPhone } = req.body;

    try {
      // find user
      const user = await User.findOne({ where: { id: req.params.id } });

      if (!user) {
        return res.status(401).json({
          errors: [{ msg: "No user was found to update" }],
          success: false,
        });
      }

      // update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.role = role || user.roleId;
      user.defaultPhone = defaultPhone;

      // save user
      await user.save();

      // return new user object
      return res
        .status(200)
        .json({ message: ["User was updated"], success: true, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to update user" }],
        success: false,
      });
    }
  }
);

// @route       DELETE api/users/delete/:id
// @desc        Delete a user by its ID
// @access      Admin Only
router.delete(
  "/delete/:id",
  [userAuth, checkRole([1, 2])],
  async (req, res) => {
    try {
      const user = await User.findOne({
        where: {
          id: req.params.id,
        },
      });

      if (!user) {
        return res.status(401).json({
          errors: [{ msg: "User was not found to delete" }],
          success: false,
        });
      }

      user.destroy();

      return res
        .status(200)
        .json({ message: ["user was deleted"], success: true, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to delete user" }],
        success: false,
      });
    }
  }
);

module.exports = router;
