const express = require("express");
const { analyzeQueue } = require("../utils/queueIntelligence");

const router = express.Router();

const alternatives = [
  { name: "Veg Meals", prepTime: 5 },
  { name: "Chapati Set", prepTime: 6 },
  { name: "Veg Noodles", prepTime: 7 }
];

function suggestAlternative(currentWait) {
  return alternatives.find(item => item.prepTime < currentWait / 2) || null;
}

router.get("/status/:vendorId", (req, res) => {
  const vendorLoad = {
    vendorId: req.params.vendorId,
    avgPrepTime: 4,
    activeOrders: 6
  };

  const queueStatus = analyzeQueue(vendorLoad);
  const alternativeSuggestion = suggestAlternative(queueStatus.estimatedWait);

  res.json({
    success: true,
    queueStatus,
    alternativeSuggestion
  });
});

module.exports = router;
