const db = require("../dbService");

module.exports = (req, res, next) => {
  try {
    db.query(
      "SELECT * FROM users LEFT JOIN roles ON roles.role_id = users.role_id WHERE user_id = ?",
      [req.user.id],
      (error, results) => {
        if (error) console.log(error);
        console.log(results);
        next();
      }
    );
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};
