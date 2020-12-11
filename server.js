const express = require("express");
const dotenv = require("dotenv");
const passport = require("passport");
const { sequelize } = require("./models");
const cors = require("cors");
dotenv.config();

const app = express();

// Passport
const initializePassport = require("./middleware/passport");
initializePassport(passport);

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Define Routes

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/permits", require("./routes/api/permits"));
// app.use("/api/reports", require("./routes/api/reports"));
app.use("/api/locations", require("./routes/api/locations"));
app.use("/api/sublocations", require("./routes/api/sublocations"));
// app.use("/api/punchclock", require("./routes/api/punchclock"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log("Server up on ", PORT);
  await sequelize.authenticate();
  console.log("Database Synced!");
});
