const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { validateEmail } = require("../../utils/auth");
const { userAuth } = require("../../utils/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");

const errorHandler = (err) => {
  console.log("ERROR:", err);
};

// @route       POST api/auth
// @desc        Authenticate current user
// @access      Public
router.get("/", userAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to Authenticate User" }],
      success: false,
    });
  }
});

// @route       POST api/auth/login
// @desc        Authenticate User & Return Token (Login)
// @access      Public
router.post(
  "/login",
  [
    check("email", "Please enter your login ID").not().isEmpty(),
    check("password", "please enter password").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    try {
      const { email, password } = req.body;
      // find user in DB
      const user = await User.scope("login").findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          errors: [
            { msg: "User is not found. Please check your login credentials" },
          ],
          success: false,
        });
      }

      // check password
      let isMatch = await bcrypt.compare(password, user.password);

      // sign in token and issue it to user
      if (isMatch) {
        let token = jwt.sign(
          {
            user_id: user.id,
            role: user.role,
            email: user.email,
          },
          process.env.JWT_SECRET_TOKEN
        );

        let results = {
          role: user.role,
          email: user.email,
          token: `Bearer ${token}`,
        };

        return res.status(200).json({
          ...results,
          message: ["Login Successful"],
          success: true,
        });
      } else {
        return res.status(401).json({
          errors: [{ msg: "Incorrect Password" }],
          success: false,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to login" }],
        success: false,
      });
    }
  }
);

// @route       POST api/auth/register
// @desc        Register User
// @access      Public
router.post(
  "/register",
  [
    check("password", "please enter a password").not().isEmpty(),
    check("confirmPassword", "passwords must match")
      .not()
      .isEmpty()
      .custom((value, { req }) => value === req.body.password)
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i")
      .withMessage(
        "Password must be at least 8 characters long, contain at least 1 lowercase letter, contain at least 1 uppercase letter, and 1 number"
      ),
    check("email", "please your email").isEmail(),
    check("firstName", "please enter your first name").not().isEmpty(),
    check("lastName", "please enter your last name").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    let { firstName, lastName, email, password, phone } = req.body;

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
      User.create({
        firstName,
        lastName,
        email,
        defaultPhone: phone || null,
        password: hashedPassword,
      })
        .then(
          res.status(201).json({ message: ["Account added"], success: true })
        )
        .catch((err) => console.log(errorHandler(err)));
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to create account" }],
        success: false,
      });
    }
  }
);

module.exports = router;
