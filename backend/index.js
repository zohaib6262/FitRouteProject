const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
const port = 3000;
const jwtPassword = "zohaib123";
mongoose.connect(
  "mongodb+srv://admin:zohaib259@cluster0.qshup.mongodb.net/user_app"
);
app.use(
  cors({
    origin: ["https://zohaibportfolio-ul.vercel.app", "*"], // Allow only this origin
    methods: ["GET", "POST"], // Allow specific methods if needed
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Middleware to parse JSON and handle CORS
app.use(express.json());
// app.use(cors());

const Users = mongoose.model("Users", {
  name: String,
  username: { type: String, unique: true }, // Ensure unique usernames
  password: String,
});

app.post("/signup", async (req, res) => {
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

// POST route to handle signup
app.post("/authsignup", async (req, res) => {
  const { name, username, password } = req.body;

  const existingUser = await Users.findOne({ username });

  if (existingUser) {
    return res.status(409).json({ msg: "User already exists" });
  }

  const user = new Users({ name, username, password });
  await user.save();
  res.status(200).json({ msg: "User saved in DB successfully" });
});

// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   console.log(username, password);
//   const existingUser = await Users.findOne({ username });

//   console.log("exiting User", existingUser);
//   if (!existingUser) {
//     return res.status(401).json({ msg: "Invalid credentials" });
//   }
//   // if (existingUser && existingUser.password === password) {
//   const token = jwt.sign({ username }, jwtPassword);
//   return res.json({ token });
//   // }
// });

// Use bcrypt for password hashing

app.post("/authlogin", async (req, res) => {
  try {
    // Find user by username
    const existingUser = await Users.findOne({ username: req.body.username });

    // If user is not found, send 401 Unauthorized with a message
    if (!existingUser) {
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

// app.post("/login", async (req, res) => {
//   console.log("jeesd");
//   const { username, password } = req.body;

//   try {
//     const existingUser = await Users.findOne({ username });

//     if (!existingUser) {
//       return res.status(401).json({ msg: "Invalid credentials" });
//     }

//     // Compare the provided password with the hashed password in the database
//     // const isMatch = await bcrypt.compare(password, existingUser.password);

//     // if (!isMatch) {
//     //   return res.status(401).json({ msg: "Invalid credentials" });
//     // }

//     // Generate the JWT token upon successful login
//     const token = jwt.sign(
//       { username: existingUser.username },
//       jwtPassword
//       // process.env.JWT_SECRET,
//       // {
//       //   expiresIn: "1h", // Token expiration
//       // }
//     );

//     return res.json({ token });
//   } catch (error) {
//     console.error("Login error: ", error);
//     return res
//       .status(500)
//       .json({ msg: "Server error. Please try again later." });
//   }
// });

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  console.log(token);

  if (token) {
    jwt.verify(token, jwtPassword, (err, user) => {
      if (err) {
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
  principle: String,
  interestRate: String,
});

// POST route to handle interest calculation
app.post("/calculateInterestRate", authenticateJWT, async (req, res) => {
  const { principle, rate, duration, userId } = req.body;
  const interestRate =
    (parseFloat(principle) * parseFloat(rate) * parseFloat(duration)) / 100;
  const total = parseFloat(principle) + interestRate;

  const interestRateData = new Interest({
    userId,
    id: Math.random().toString(),
    total: total.toString(),
    principle: principle.toString(),
    interestRate: interestRate.toString(),
  });

  await interestRateData.save();
  res.status(200).json({
    msg: "Interest Rate Data saved in DB successfully.",
    interestRate,
    total,
  });
});

app.get("/authinterestRate", authenticateJWT, async (req, res) => {
  const exitingUser = await Interest.find();
  console.log(exitingUser);
  res.json({ data: exitingUser });
});

// Start the server
app.listen(5500, () => {
  console.log(`Server running at http://localhost:${5500}`);
});
