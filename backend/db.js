const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://admin:zohaib259@cluster0.qshup.mongodb.net/user_app"
);
const Users = mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true }, // Ensure unique usernames
  password: String,
  confirmPassword: String,
});

const users = mongoose.model("Users", todoSchema);

module.exports = {
  users,
};
