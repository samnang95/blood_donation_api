const mongoose = require("mongoose");
const ProfileModel = require("../models/profile.js");

function pickBody(req, keys) {
  for (const key of keys) {
    if (req?.body && req.body[key] !== undefined && req.body[key] !== null) {
      return req.body[key];
    }
  }
  return undefined;
}

/**
 * @desc    Create a new profile
 * @route   POST /profiles
 */
const createProfile = async (req, res) => {
  try {
    const firstName = String(
      pickBody(req, ["firstName", "first_name", "firstname"]) ?? "",
    ).trim();
    const lastName = String(
      pickBody(req, ["lastName", "last_name", "lastname"]) ?? "",
    ).trim();
    const email = String(pickBody(req, ["email", "Email"]) ?? "")
      .trim()
      .toLowerCase();
    const mobilePhone = String(
      pickBody(req, ["mobilePhone", "mobile_phone", "phone", "Phone"]) ?? "",
    ).trim();
    const location = String(
      pickBody(req, ["location", "Location"]) ?? "",
    ).trim();
    const bloodType = String(
      pickBody(req, ["bloodType", "blood_type", "bloodType"]) ?? "",
    ).trim();
    const dateOfBirth = pickBody(req, ["dateOfBirth", "date_of_birth", "dob"]);
    const gender = String(pickBody(req, ["gender", "Gender"]) ?? "")
      .trim()
      .toLowerCase();
    const emergencyContact = pickBody(req, [
      "emergencyContact",
      "emergency_contact",
    ]);
    const medicalHistory = String(
      pickBody(req, ["medicalHistory", "medical_history"]) ?? "",
    ).trim();
    const isAvailable = pickBody(req, ["isAvailable", "is_available"]);

    const missing = [];
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");
    if (!email) missing.push("email");
    if (!mobilePhone) missing.push("mobilePhone");
    if (!location) missing.push("location");
    if (missing.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate blood type if provided
    if (bloodType) {
      const validBloodTypes = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      if (!validBloodTypes.includes(bloodType.toUpperCase())) {
        return res.status(400).json({
          message:
            "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
        });
      }
    }

    // Validate gender if provided
    if (gender) {
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          message: "Invalid gender. Must be one of: male, female, other",
        });
      }
    }

    // Check if user already has a profile
    const existingUserProfile = await ProfileModel.findOne({
      user: req.user.id,
    });
    if (existingUserProfile) {
      return res.status(409).json({
        message: "User already has a profile",
      });
    }

    // Check if email already exists
    const existingEmail = await ProfileModel.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const profileData = {
      user: req.user.id,
      firstName,
      lastName,
      email,
      mobilePhone,
      location,
    };

    // Add optional fields if provided
    if (bloodType) profileData.bloodType = bloodType.toUpperCase();
    if (dateOfBirth) profileData.dateOfBirth = new Date(dateOfBirth);
    if (gender) profileData.gender = gender;
    if (emergencyContact) profileData.emergencyContact = emergencyContact;
    if (medicalHistory) profileData.medicalHistory = medicalHistory;
    if (isAvailable !== undefined)
      profileData.isAvailable = Boolean(isAvailable);

    const profile = await ProfileModel.create(profileData);

    return res.status(201).json({
      message: "Profile created successfully",
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Get all profiles
 * @route   GET /profiles
 */
const getProfiles = async (req, res) => {
  try {
    const { bloodType, location, isAvailable, gender } = req.query;

    let filter = {};

    if (bloodType) {
      filter.bloodType = bloodType.toUpperCase();
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    if (gender) {
      filter.gender = gender.toLowerCase();
    }

    const profiles = await ProfileModel.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Profiles retrieved successfully",
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Get single profile by ID
 * @route   GET /profiles/:id
 */
const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await ProfileModel.findById(id);

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      profile,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid profile ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Update profile
 * @route   PUT /profiles/:id
 */
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the profile and ensure it belongs to the authenticated user
    const profile = await ProfileModel.findById(id);
    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    // ✅ Fixed: Remove mongoose.Types.ObjectId() wrapper
    if (!profile.user.equals(req.user.id)) {
      return res.status(403).json({
        message: "Access denied. You can only update your own profile",
      });
    }

    const firstName = pickBody(req, ["firstName", "first_name", "firstname"]);
    const lastName = pickBody(req, ["lastName", "last_name", "lastname"]);
    const email = pickBody(req, ["email", "Email"]);
    const mobilePhone = pickBody(req, [
      "mobilePhone",
      "mobile_phone",
      "phone",
      "Phone",
    ]);
    const location = pickBody(req, ["location", "Location"]);
    const bloodType = pickBody(req, ["bloodType", "blood_type"]);
    const dateOfBirth = pickBody(req, ["dateOfBirth", "date_of_birth", "dob"]);
    const gender = pickBody(req, ["gender", "Gender"]);
    const emergencyContact = pickBody(req, [
      "emergencyContact",
      "emergency_contact",
    ]);
    const medicalHistory = pickBody(req, ["medicalHistory", "medical_history"]);
    const isAvailable = pickBody(req, ["isAvailable", "is_available"]);

    const updateData = {};

    if (firstName !== undefined)
      updateData.firstName = String(firstName).trim();
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (email !== undefined) {
      const emailStr = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }
      updateData.email = emailStr;
    }
    if (mobilePhone !== undefined)
      updateData.mobilePhone = String(mobilePhone).trim();
    if (location !== undefined) updateData.location = String(location).trim();
    if (bloodType !== undefined) {
      const bt = String(bloodType).trim().toUpperCase();
      const validBloodTypes = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      if (!validBloodTypes.includes(bt)) {
        return res.status(400).json({
          message:
            "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
        });
      }
      updateData.bloodType = bt;
    }
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({
          message: "Invalid date of birth format",
        });
      }
      updateData.dateOfBirth = dob;
    }
    if (gender !== undefined) {
      const g = String(gender).trim().toLowerCase();
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(g)) {
        return res.status(400).json({
          message: "Invalid gender. Must be one of: male, female, other",
        });
      }
      updateData.gender = g;
    }
    if (emergencyContact !== undefined)
      updateData.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined)
      updateData.medicalHistory = String(medicalHistory).trim();
    if (isAvailable !== undefined)
      updateData.isAvailable = Boolean(isAvailable);

    const updatedProfile = await ProfileModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProfile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid profile ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Delete profile
 * @route   DELETE /profiles/:id
 */
const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the profile and ensure it belongs to the authenticated user
    const profile = await ProfileModel.findById(id);
    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    if (!profile.user.equals(mongoose.Types.ObjectId(req.user.id))) {
      return res.status(403).json({
        message: "Access denied. You can only delete your own profile",
      });
    }

    await ProfileModel.findByIdAndDelete(id);

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile deleted successfully",
      profile,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid profile ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Get current user's profile
 * @route   GET /profiles/me
 */
const getMyProfile = async (req, res) => {
  try {
    const profile = await ProfileModel.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createProfile,
  getProfiles,
  getProfileById,
  getMyProfile,
  updateProfile,
  deleteProfile,
};
