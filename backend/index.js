const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
const port = 3000;
const jwtPassword = "zohaib123";
const jwtPasswordAdmin = "zohaib259";
mongoose.connect(
  "mongodb+srv://admin:zohaib259@cluster0.qshup.mongodb.net/user_app"
);
app.use(
  cors({
    origin: ["http://localhost:5173", "*"],
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Middleware to parse JSON and handle CORS
app.use(express.json());
// app.use(cors());

const Users = mongoose.model("Users", {
  email: { type: String, unique: true },
  username: { type: String, unique: true }, // Ensure unique usernames
  password: String,
  confirmPassword: String,
});

// POST route to handle signup
app.post("/authsignup", async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;
    console.log(email);
    const existingUser = await Users.findOne({ username });
    console.log(existingUser);
    if (existingUser) {
      return res.status(409).json({ msg: "User already exists" });
    }

    const user = new Users({ email, username, password, confirmPassword });
    await user.save();
    res.status(200).json({ msg: "User saved in DB successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post("/authlogin", async (req, res) => {
  try {
    // Find user by username
    const existingUser = await Users.findOne({ username: req.body.username });

    // If user is not found, send 401 Unauthorized with a message
    if (!existingUser || existingUser.password !== req.body.password) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Generate token using the user's username (or any other identifier)
    const token = jwt.sign({ username: req.body.username }, jwtPassword, {
      expiresIn: "1h",
    });

    // Send back the token in response
    return res.status(200).json({ token, id: existingUser._id });
  } catch (err) {
    console.error(err); // Log errors for debugging
    return res.status(500).json({ msg: "Internal server error" }); // Send 500 Internal Server Error if something goes wrong
  }
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  console.log(token);

  if (token) {
    jwt.verify(token, jwtPassword, (err, user) => {
      if (err) {
        console.log(err, user);
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

const Interest = mongoose.model("Interest", {
  userId: String,
  id: String,
  total: String,
  principal: String,
  interestRate: String,
});

// POST route to handle interest calculation
app.post("/calculateInterestRate", authenticateJWT, async (req, res) => {
  const { principal, rate, duration, userId } = req.body;
  const interestRate =
    (parseFloat(principal) * parseFloat(rate) * parseFloat(duration)) / 100;
  const total = (parseFloat(principal) + interestRate).toFixed(2);

  const interestRateData = new Interest({
    userId,
    id: Math.random().toString(),
    total: total.toString(),
    principal: principal.toString(),
    interestRate: interestRate.toString(),
  });

  await interestRateData.save();
  res.status(200).json({
    msg: "Interest Rate Data saved in DB successfully.",
    interestRate,
    principal,
    total,
  });
});

app.get("/authinterestRate", async (req, res) => {
  const exitingUser = await Interest.find();
  console.log(exitingUser);
  res.json({ data: exitingUser });
});

app.get("/adminFetchUsersData", async (req, res) => {
  try {
    const users = await Users.find(); // Ensure 'Users' is defined and imported correctly
    console.log(users);
    if (users.length > 0) {
      return res.status(200).json({ data: users });
    } else {
      return res.status(404).json({ msg: "No users found" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
});

const Admin = mongoose.model("Admins", {
  name: String,
  username: { type: String, unique: true }, // Ensure unique usernames
  password: String,
  tel: String,
  gender: String,
});

//Admin Backend
app.post("/authadminsignup", async (req, res) => {
  try {
    const { name, username, password, tel, gender } = req.body;

    const existingUser = await Admin.findOne({ username });
    console.log(existingUser);
    if (existingUser) {
      return res.status(409).json({ msg: "User already exists" });
    }

    const user = new Admin({ name, username, password, tel, gender });
    console.log(user);
    await user.save();
    res.status(200).json({ msg: "User saved in DB successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post("/authadminlogin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const dummyUsername = "zohaib@gmail.com";
    const dummyPassword = "zohaib123";

    // const existingUser = await Admin.findOne({ username });
    console.log(username === "zohaib@gmail.com", password === "zohaib123");

    if (dummyUsername === username && dummyPassword === password) {
      const token = jwt.sign({ username: req.body.username }, jwtPasswordAdmin);

      return res.status(200).json({ token });
    }
    return res.status(401).json({ msg: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
});

//Admin autJWT
const adminAuthenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  console.log(token);

  if (token) {
    jwt.verify(token, jwtPassword, (err, user) => {
      if (err) {
        console.log(err, user);
        return res.sendStatus(403); // Forbidden
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};
//Deletion of user
app.delete("/delete-user", async (req, res) => {
  try {
    const userId = req.body.id;

    if (!userId) {
      res.json({ msg: "Invalid User ID." });
    }

    const deleteUser = await Users.findByIdAndDelete(userId);
    console.log(deleteUser);
    if (!deleteUser) {
      return res.status(404).json({ msg: "User not found." });
    }
    return res
      .status(200)
      .json({ msg: "User deleted successfully.", deleteUser });
  } catch (err) {
    return res.status(500).json({ msg: "Internal server error." });
  }
});
// Start the server
app.listen(5500, () => {
  console.log(`Server running at http://localhost:${5500}`);
});
