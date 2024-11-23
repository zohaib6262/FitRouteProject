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
  email: { type: String, unique: true },
  username: { type: String, unique: true }, // Ensure unique usernames
  password: String,
  confirmPassword: String,
});
const bcrypt = require("bcryptjs"); // Ensure bcrypt is installed

app.post("/signup", async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Check if username or email already exists
    const existingUsername = await Users.findOne({ username });
    const existingEmail = await Users.findOne({ email });

    if (existingUsername || existingEmail) {
      return res.status(409).json({ msg: "User already exists" });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Create a new user object without confirmPassword
    const user = new Users({ email, username, password: hashedPassword });

    // Save the user to the database
    await user.save();

    res.status(200).json({ msg: "User saved in DB successfully" });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post("/authlogin", async (req, res) => {
  try {
    const existingUser = await Users.findOne({ username: req.body.username });

    if (!existingUser) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );
    if (!isPasswordMatch) {
      return res.status(401).json({ msg: "Invalid username or password" });
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
