const express = require("express");
const {
  createCard,
  getCards,
  getCardById,
  updateCard,
  deleteCard,
} = require("../controllers/card.js");
const { authenticateToken } = require("../controllers/auth.js");

const router = express.Router();

router.post("/", authenticateToken, createCard);
router.get("/", getCards);
router.get("/:id", getCardById);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

module.exports = router;
