const express = require("express");
const router = express.Router();
const { userAuth, checkRole } = require("../../utils/auth");
const { check, validationResult } = require("express-validator");
const { Sublocation, Location } = require("../../models");

// @route       GET api/sublocations
// @desc        Get all sublocations
// @access      Public
router.get("/", async (req, res) => {
  try {
    const sublocations = await Sublocation.findAll({ include: ["location"] });

    return res.status(200).json({
      message: ["Sublocations were found"],
      success: true,
      sublocations,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find sublocations" }],
      success: false,
    });
  }
});

// @route       GET api/sublocations
// @desc        Get a sublocation by its ID
// @access      Public
router.get("/:id", async (req, res) => {
  try {
    const sublocation = await Sublocation.findOne({
      where: {
        id: req.params.id,
      },
      include: ["location"],
    });

    if (!sublocation) {
      return res.status(401).json({
        errors: [{ msg: "No sublocation was found" }],
        success: false,
      });
    }

    return res
      .status(200)
      .json({ message: ["Sublocation was found"], success: true, sublocation });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      errors: [{ msg: "SERVER ERROR: Unable to find sublocation" }],
      success: false,
    });
  }
});

// @route       POST api/sublocations
// @desc        Add a sublocation
// @access      Admin Only
router.post(
  "/",
  [
    userAuth,
    checkRole([1, 2]), // admin or superadmin
    [check("name", "Please enter the name of the sublocation").not().isEmpty()],
    [
      check("locationId", "ERROR: no location associated location")
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    try {
      let { name, locationId } = req.body;

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

      // Insert into table
      const sublocation = await Sublocation.create({
        name,
        locationId,
      });

      return res.status(200).json({
        message: ["Sublocation was added"],
        success: true,
        sublocation,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to create sublocation" }],
        success: false,
      });
    }
  }
);

// @route       EDIT api/sublocation/update/:id
// @desc        Edit a sublocation by its ID
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

    const { name } = req.body;

    try {
      // find location
      const sublocation = await Sublocation.findOne({
        Where: { id: req.params.id },
      });

      // return if no location found
      if (!sublocation) {
        return res.status(401).json({
          errors: [{ msg: "No sublocation was found to update" }],
          success: false,
        });
      }

      // update values if they exist in body
      sublocation.name = name;

      sublocation.save();

      return res.status(200).json({
        message: ["Sublocation was updated"],
        success: true,
        sublocation,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to find sublocations" }],
        success: false,
      });
    }
  }
);

// @route       DELETE api/sublocations
// @desc        Delete a sublocation by its ID
// @access      Admin Only
router.delete(
  "/delete/:id",
  userAuth,
  checkRole([1, 2]), // admin or superadmin
  async (req, res) => {
    try {
      const sublocation = await Sublocation.findOne({
        where: { id: req.params.id },
      });

      if (!sublocation) {
        return res.status(401).json({
          errors: [{ msg: "Sublocation was not found to delete" }],
          success: false,
        });
      }

      sublocation.destroy();

      return res.status(200).json({
        message: ["Sublocation was deleted"],
        success: true,
        sublocation,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        errors: [{ msg: "SERVER ERROR: Unable to delete Sublocation" }],
        success: false,
      });
    }
  }
);

module.exports = router;
