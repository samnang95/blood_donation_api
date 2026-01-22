const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.js");

function pickBody(req, keys) {
  for (const key of keys) {
    if (req?.body && req.body[key] !== undefined && req.body[key] !== null) {
      return req.body[key];
    }
  }
  return undefined;
}

function normalizePhone(phone) {
  if (phone === undefined || phone === null) return "";
  return String(phone).trim().replace(/\s+/g, "");
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ userId: user._id.toString(), phone: user.phone }, secret, {
    expiresIn: "7d",
  });
}

/**
 * @desc    Authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, secret);

    // Fetch user from database to ensure they still exist
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = {
      id: user._id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Signup
 * @route   POST /auth/signup
 */
const signup = async (req, res) => {
  try {
    const firstName = String(
      pickBody(req, ["firstName", "first_name", "firstname"]) ?? "",
    ).trim();
    const lastName = String(
      pickBody(req, ["lastName", "last_name", "lastname"]) ?? "",
    ).trim();
    const phone = normalizePhone(
      pickBody(req, [
        "phone",
        "Phone",
        "phoneNumber",
        "phone_number",
        "numberPhone",
        "number_phone",
      ]),
    );
    const password = pickBody(req, ["password"]) ?? "";
    const confirmPassword =
      pickBody(req, ["confirmPassword", "confirm_password"]) ?? "";

    const missing = [];
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");
    if (!phone) missing.push("phone");
    if (!password) missing.push("password");
    if (!confirmPassword) missing.push("confirmPassword");
    if (missing.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirmPassword do not match",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await UserModel.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        message: "Phone number is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await UserModel.create({
      firstName,
      lastName,
      phone,
      passwordHash,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Login
 * @route   POST /auth/login
 */
const login = async (req, res) => {
  try {
    const phone = normalizePhone(
      pickBody(req, [
        "phone",
        "Phone",
        "phoneNumber",
        "phone_number",
        "numberPhone",
        "number_phone",
      ]),
    );
    const password = pickBody(req, ["password"]) ?? "";

    if (!phone || !password) {
      return res.status(400).json({
        message: "Missing required fields: phone, password",
      });
    }

    const user = await UserModel.findOne({ phone }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        message: "Invalid phone or password",
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid phone or password",
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Logout
 * @route   POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    // For JWT, logout is primarily handled client-side by removing the token
    // Server-side, we can optionally blacklist the token if needed
    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  authenticateToken,
};
