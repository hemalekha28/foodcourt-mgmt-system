function analyzeQueue(vendorLoad) {
  const avgPrepTime = vendorLoad.avgPrepTime || 4;
  const activeOrders = vendorLoad.activeOrders || 0;

  const estimatedWait = avgPrepTime * activeOrders;

  let advice = "ORDER_NOW";
  let message = "Low crowd. Order now.";

  if (estimatedWait > 15) {
    advice = "ORDER_LATER";
    message = "High crowd right now. Ordering later will reduce wait time.";
  } else if (estimatedWait > 7) {
    advice = "NORMAL";
    message = "Moderate crowd. Normal waiting time.";
  }

  return {
    estimatedWait,
    advice,
    message
  };
}

module.exports = {
  analyzeQueue
};
