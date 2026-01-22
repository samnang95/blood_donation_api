const CardModel = require("../models/card.js");

function pickBody(req, keys) {
  for (const key of keys) {
    if (req?.body && req.body[key] !== undefined && req.body[key] !== null) {
      return req.body[key];
    }
  }
  return undefined;
}

/**
 * @desc    Create a new card
 * @route   POST /cards
 */
const createCard = async (req, res) => {
  try {
    const name = String(pickBody(req, ["name", "Name"]) ?? "").trim();
    const location = String(
      pickBody(req, ["location", "Location"]) ?? "",
    ).trim();
    const bloodType = String(
      pickBody(req, ["bloodType", "blood_type", "bloodType"]) ?? "",
    ).trim();
    const mobilePhone = String(
      pickBody(req, ["mobilePhone", "mobile_phone", "phone", "Phone"]) ?? "",
    ).trim();
    const description = String(
      pickBody(req, ["description", "Description"]) ?? "",
    ).trim();
    const status = String(
      pickBody(req, ["status", "Status"]) ?? "active",
    ).trim();

    const missing = [];
    if (!name) missing.push("name");
    if (!location) missing.push("location");
    if (!bloodType) missing.push("bloodType");
    if (!mobilePhone) missing.push("mobilePhone");
    if (missing.length) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Validate blood type
    const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodTypes.includes(bloodType.toUpperCase())) {
      return res.status(400).json({
        message:
          "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
      });
    }

    // Validate status
    const validStatuses = ["active", "inactive", "completed"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: active, inactive, completed",
      });
    }

    const card = await CardModel.create({
      name,
      location,
      bloodType: bloodType.toUpperCase(),
      mobilePhone,
      description,
      status: status.toLowerCase(),
    });

    return res.status(201).json({
      message: "Card created successfully",
      card,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Get all cards
 * @route   GET /cards
 */
const getCards = async (req, res) => {
  try {
    const { bloodType, status, location } = req.query;

    let filter = {};

    if (bloodType) {
      filter.bloodType = bloodType.toUpperCase();
    }

    if (status) {
      filter.status = status.toLowerCase();
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const cards = await CardModel.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cards retrieved successfully",
      count: cards.length,
      cards,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Get single card by ID
 * @route   GET /cards/:id
 */
const getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await CardModel.findById(id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    return res.status(200).json({
      message: "Card retrieved successfully",
      card,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid card ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Update card
 * @route   PUT /cards/:id
 */
const updateCard = async (req, res) => {
  try {
    const { id } = req.params;

    const name = pickBody(req, ["name", "Name"]);
    const location = pickBody(req, ["location", "Location"]);
    const bloodType = pickBody(req, ["bloodType", "blood_type", "bloodType"]);
    const mobilePhone = pickBody(req, [
      "mobilePhone",
      "mobile_phone",
      "phone",
      "Phone",
    ]);
    const description = pickBody(req, ["description", "Description"]);
    const status = pickBody(req, ["status", "Status"]);

    const updateData = {};

    if (name !== undefined) updateData.name = String(name).trim();
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
    if (mobilePhone !== undefined)
      updateData.mobilePhone = String(mobilePhone).trim();
    if (description !== undefined)
      updateData.description = String(description).trim();
    if (status !== undefined) {
      const st = String(status).trim().toLowerCase();
      const validStatuses = ["active", "inactive", "completed"];
      if (!validStatuses.includes(st)) {
        return res.status(400).json({
          message:
            "Invalid status. Must be one of: active, inactive, completed",
        });
      }
      updateData.status = st;
    }

    const card = await CardModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    return res.status(200).json({
      message: "Card updated successfully",
      card,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid card ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc    Delete card
 * @route   DELETE /cards/:id
 */
const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await CardModel.findByIdAndDelete(id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found",
      });
    }

    return res.status(200).json({
      message: "Card deleted successfully",
      card,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid card ID format",
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  updateCard,
  deleteCard,
};
