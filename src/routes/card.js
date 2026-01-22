const express = require("express");
const { createCard, getCards, getCardById, updateCard, deleteCard } = require("../controllers/card.js");

const router = express.Router();

router.post("/", createCard);
router.get("/", getCards);
router.get("/:id", getCardById);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

module.exports = router;