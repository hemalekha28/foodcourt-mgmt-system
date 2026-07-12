const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });
    
    const user = new User({
      name,
      email,
      password, // Pass original password - let the model handle hashing
      role: role || "user",
      phone,
      address
    });

    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.status(201).json({ msg: "User registered successfully", user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      msg: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
