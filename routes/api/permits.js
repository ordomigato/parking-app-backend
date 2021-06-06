const express = require("express");
const router = express.Router();
const { userAuth, checkRole } = require("../../utils/auth");
const { check, validationResult } = require("express-validator");
const moment = require("moment");
const { Permit, Location, User } = require("../../models");

// @route       GET api/permits
// @desc        Get all Permit
// @access      Admin Only
router.get(
  "/",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
  ],
  async (req, res) => {
    try {
      const permits = await Permit.findAll({
        include: ["location", "sublocation", "user"],
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        message: ["Permits were found"],
        success: true,
        permits,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to find permits" }],
        success: false,
      });
    }
  }
);

// @route       GET api/permits/current-user
// @desc        Get all Permit
// @access      Current Logged In User Only
router.get("/current-user", [userAuth], async (req, res) => {
  try {
    const permits = await Permit.findAll({
      where: { userId: req.user.id },
      include: ["location", "sublocation"],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: ["Permits were found"],
      success: true,
      permits,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find permits" }],
      success: false,
    });
  }
});

// @route       GET api/permits/:id
// @desc        Get a permit by its ID
// @access      Admin Only
router.get(
  "/:id",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
  ],
  async (req, res) => {
    try {
      const permit = await Permit.findOne({ where: { id: req.params.id } });

      if (!permit) {
        return res.status(401).json({
          errors: [{ msg: "No permit was found" }],
          success: false,
        });
      }

      return res
        .status(200)
        .json({ message: ["Permit was found"], success: true, permit });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to find locations" }],
        success: false,
      });
    }
  }
);

// @route       POST api/permits
// @desc        Add a permit
// @access      public
router.post(
  "/",
  [
    check("location", "Please select a location").not().isEmpty(),
    check("unit", "please enter the unit number of the person you are visiting")
      .not()
      .isEmpty(),
    check("duration", "please select how many days you wish to stay")
      .not()
      .isEmpty()
      .isNumeric()
      .withMessage("Duration must be numeric"),
    check("firstName", "please enter your first name").not().isEmpty(),
    check("lastName", "please enter your last name").not().isEmpty(),
    check("email", "please enter your email")
      .not()
      .isEmpty()
      .isEmail()
      .withMessage("please enter a valid email"),
    check("defaultPhone", "please enter your phone number")
      .not()
      .isEmpty()
      .isMobilePhone()
      .withMessage("please enter a valid phone number"),
    check("vplate", "please enter your vehicle's plate number").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    try {
      let {
        userId,
        firstName,
        lastName,
        email,
        defaultPhone,
        vplate,
        vmake,
        vmodel,
        vcolor,
        location: locationId,
        sublocation: sublocationId,
        duration,
        unit,
      } = req.body;

      // get location data for further processing
      const locationData = await Location.findOne({
        where: { id: locationId },
      });

      // ensure location exists
      if (!locationData) {
        return res.status(401).json({
          errors: [{ msg: "Something went wrong finding the location" }],
          success: false,
        });
      }

      // check if licence plate can be registered
      const prevPermits = await Permit.findAll({
        where: { vplate },
        order: [["createdAt", "DESC"]],
      });

      // check if most recent entry is still active
      if (prevPermits.length > 0) {
        const mostRecentPermitExpiry = moment(prevPermits[0].expDate).format(
          "YYYY-MM-DD HH:mm:ss"
        );
        const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

        if (mostRecentPermitExpiry > currentTime) {
          return res.status(409).json({
            errors: [
              {
                msg: `The license plate: ${vplate} already has an active permit`,
              },
            ],
            success: false,
          });
        }

        // check if max allotment has been exceeded
        const accumulatedDuration = prevPermits.reduce(
          (prev, next) => prev + next.duration,
          duration
        );

        if (locationData.maxMonthlyDuration) {
          if (accumulatedDuration > locationData.maxMonthlyDuration)
            return res.status(409).json({
              errors: [
                {
                  msg:
                    "You have reached the max allotment of time you may register for",
                },
              ],
              success: false,
            });
        }
      }

      // calculate expiry date
      const curfew = locationData.curfewReset;
      const currentDate = moment().format("YYYY-MM-DD");
      const dateWithCurfew = moment(currentDate + " " + curfew);

      const expDate =
        duration === 0
          ? moment(dateWithCurfew).format("YYYY-MM-DD HH:mm:ss")
          : moment(dateWithCurfew)
              .add(duration, "days")
              .format("YYYY-MM-DD HH:mm:ss");

      // insert into table
      const permit = await Permit.create({
        userId,
        firstName,
        lastName,
        email,
        phone: defaultPhone,
        vplate,
        vmake,
        vmodel,
        vcolor,
        locationId,
        sublocationId,
        unit,
        duration,
        expDate,
      });

      // check if user exists
      const userData = await User.findOne({
        where: { id: userId },
      });

      // ensure user exists
      if (!userData) {
        return res.status(401).json({
          errors: [{ msg: "User does not exist" }],
          success: false,
        });
      }

      // find the new permit and return it with its associations
      const createdPermit = await Permit.findOne({
        where: { id: permit.id },
        include: ["location", "sublocation", "user"],
      });

      return res.status(200).json({
        message: ["Permit was created"],
        success: true,
        createdPermit,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to create permit" }],
        success: false,
      });
    }
  }
);

// @route       EDIT api/permits/update/:id
// @desc        Edit a permit by its ID
// @access      Admin Only
router.put(
  "/update/:id",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
    [
      check("location", "Please select a location").not().isEmpty(),
      check(
        "unit",
        "please enter the unit number of the person you are visiting"
      )
        .not()
        .isEmpty(),
      check("duration", "please select how many days you wish to stay")
        .not()
        .isEmpty()
        .isNumeric(),
      check("firstName", "please enter your first name").not().isEmpty(),
      check("lastName", "please enter your last name").not().isEmpty(),
      check("email", "please enter a valid email").not().isEmpty().isEmail(),
      check("phone", "please enter a valid phone number")
        .not()
        .isEmpty()
        .isMobilePhone(),
      check("vplate", "please enter your vehicle's plate number")
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    let {
      firstName,
      lastName,
      email,
      defaultPhone,
      vplate,
      vmake,
      vmodel,
      vcolor,
      locationId,
      sublocation,
      duration,
      unit,
      expDate,
    } = req.body;

    try {
      // find permit
      const permit = await Permit.findOne({ Where: { id: req.params.id } });

      // calculate expiry date
      formattedExpDate = moment(expDate).format("YYYY-MM-DD HH:mm:ss");

      // update values if they exist in body - could refactor, but meh
      await Permit.update(
        {
          firstName: firstName || permit.firstName,
          lastName: lastName || permit.lastName,
          email: email || permit.email,
          phone: defaultPhone || permit.phone,
          vplate: vplate || permit.vplate,
          vmake: vmake || permit.vmake,
          vmodel: vmodel || permit.vmodel,
          vcolor: vcolor || permit.vcolor,
          locationId: locationId || permit.locationId,
          sublocation: sublocation || permit.sublocation,
          duration: duration === 0 ? 0 : duration || permit.duration,
          expDate: formattedExpDate || permit.expDate,
          unit: unit || permit.unit,
        },
        { where: { id: req.params.id }, returning: true, plain: true }
      );

      // find updated permit to return
      const updatedPermit = await Permit.findOne({
        where: { id: req.params.id },
        include: ["location", "sublocation", "user"],
      });

      return res.status(200).json({
        message: ["Permit was updated"],
        success: true,
        updatedPermit,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to update permit" }],
        success: false,
      });
    }
  }
);

// @route       DELETE api/permits/delete/:id
// @desc        Delete permit(s)
// @access      Admin Only
router.delete(
  "/delete",
  userAuth,
  checkRole([1, 2]), // admin or superadmin
  async (req, res) => {
    try {
      const permits = await Permit.destroy({ where: { id: req.body } });

      if (!permits) {
        return res.status(401).json({
          errors: [{ msg: "Permit(s) was not found to delete" }],
          success: false,
        });
      }

      return res.status(200).json({
        message: ["Permit(s) was deleted"],
        success: true,
        permits,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to delete permit" }],
        success: false,
      });
    }
  }
);

module.exports = router;
