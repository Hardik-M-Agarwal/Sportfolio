const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Tournament = require("../models/Tournament");
const { sendOTPEmail } = require("../services/emailService");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// In production, frontend (Vercel) and backend (Render) are on different
// domains, so the cookie must use sameSite: "none" + secure: true to be
// sent cross-site by the browser. "strict" silently blocks the cookie
// entirely in cross-origin requests, which breaks the login flow.
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, tournamentCode } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists && userExists.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // scorer must provide a valid tournament code
    let tournamentId = null;
    if (role === "scorer") {
      if (!tournamentCode) {
        return res.status(400).json({ message: "Tournament code is required for scorers" });
      }
      const tournament = await Tournament.findOne({
        tournamentCode: tournamentCode.toUpperCase(),
      });
      if (!tournament) {
        return res.status(400).json({ message: "Invalid tournament code" });
      }
      tournamentId = tournament._id;
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (userExists && !userExists.isVerified) {
      userExists.name = name;
      userExists.password = password;
      userExists.phone = phone;
      userExists.role = role;
      userExists.tournamentId = tournamentId;
      userExists.otp = { code: otp, expiresAt: otpExpiresAt };
      user = await userExists.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        phone,
        role,
        tournamentId,
        isVerified: false,
        otp: { code: otp, expiresAt: otpExpiresAt },
      });
    }

    await sendOTPEmail(email, name, otp);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otp.code)
      return res.status(400).json({ message: "No OTP found. Please register again." });

    if (new Date() > user.otp.expiresAt)
      return res.status(400).json({ message: "OTP has expired. Please register again." });

    if (user.otp.code !== otp)
      return res.status(400).json({ message: "Invalid OTP. Please try again." });

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        tournamentId: user.tournamentId,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = generateOTP();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    await sendOTPEmail(user.email, user.name, otp);
    res.status(200).json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Email not verified. Please check your inbox.",
        userId: user._id,
        needsVerification: true,
      });
    }

    const token = generateToken(user._id, user.role);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        tournamentId: user.tournamentId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/auth/logout
const logout = (req, res) => {
  res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
  res.status(200).json({ success: true, message: "Logged out" });
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, logout, getMe, verifyOTP, resendOTP };