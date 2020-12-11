const express = require("express");
const router = express.Router();
const { userAuth, checkRole } = require("../../utils/auth");
const { check, validationResult } = require("express-validator");
const { Location } = require("../../models");

// @route       GET api/locations
// @desc        Get all locations
// @access      Public
router.get("/", async (req, res) => {
  try {
    const locations = await Location.findAll({ include: ["sublocations"] });

    return res.status(200).json({
      message: ["Locations were found"],
      success: true,
      locations,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find locations" }],
      success: false,
    });
  }
});

// @route       GET api/locations
// @desc        Get a location by its ID
// @access      Public
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findOne({
      where: {
        id: req.params.id,
      },
      include: ["sublocations"],
    });

    if (!location) {
      return res.status(401).json({
        errors: [{ msg: "No location was found" }],
        success: false,
      });
    }

    return res.status(200).json({
      message: ["Location was found"],
      success: true,
      location,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find locations" }],
      success: false,
    });
  }
});

// @route       POST api/locations
// @desc        Add a location
// @access      Admin Only
router.post(
  "/",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
    [check("name", "Please enter the name of the location").not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    try {
      let { name, maxFormDuration, maxMonthlyDuration, curfewReset } = req.body;

      // Insert into table
      const location = await Location.create({
        name,
        maxFormDuration,
        maxMonthlyDuration,
        curfewReset,
      });

      return res.status(200).json({
        message: ["Location was added"],
        success: true,
        location,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to create location" }],
        success: false,
      });
    }
  }
);

// @route       EDIT api/locations/update/:id
// @desc        Edit a location by its ID
// @access      Admin Only
router.put(
  "/update/:id",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
    [check("name", "Name cannot be blank").not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { name, maxFormDuration, maxMonthlyDuration, curfewReset } = req.body;

    try {
      // find location
      const location = await Location.findOne({ Where: { id: req.params.id } });

      // return if no location found
      if (!location) {
        return res.status(401).json({
          errors: [{ msg: "No location was found to update" }],
          success: false,
        });
      }

      // update values if they exist in body
      location.name = name;
      location.maxFormDuration = maxFormDuration || location.maxFormDuration;
      location.maxMonthlyDuration =
        maxMonthlyDuration || location.maxMonthlyDuration;
      location.curfewReset = curfewReset || location.curfewReset;

      location.save();

      return res.status(200).json({
        message: ["Location was updated"],
        success: true,
        location,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to find locations" }],
        success: false,
      });
    }
  }
);

// @route       DELETE api/locations
// @desc        Delete a location(s)
// @access      Admin Only
router.delete(
  "/delete",
  userAuth,
  checkRole([1, 2]), // admin or superadmin
  async (req, res) => {
    try {
      const locations = await Location.destroy({ where: { id: req.body } });

      if (!locations) {
        return res.status(401).json({
          errors: [{ msg: "Location(s) was not found to delete" }],
          success: false,
        });
      }

      return res.status(200).json({
        message: ["Location was deleted"],
        success: true,
        locations,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to delete location" }],
        success: false,
      });
    }
  }
);

module.exports = router;
