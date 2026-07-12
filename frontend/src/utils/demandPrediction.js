// Demand Prediction Logic for KEC Food Court

/**
 * Calculate demand score based on category and time of day
 * @param {string} category - Product category
 * @param {number} hour - Current hour (0-23)
 * @returns {number} Demand score (0-100)
 */
export const getDemandScore = (category, hour) => {
  if (!category) return 50; // Default moderate demand

  const cat = category.toLowerCase();
  let score = 50; // Base score

  // Time-based flags
  const isLunchTime = hour >= 12 && hour <= 15;
  const isBreakfast = hour >= 7 && hour < 10;
  const isLunch = hour >= 12 && hour < 15;
  const isEvening = hour >= 17 && hour < 20;
  const isLateNight = hour >= 20 || hour < 7;

  // Breakfast (de-prioritize after 11 AM)
  if (cat.includes('breakfast') || cat.includes('tiffin')) {
    if (hour >= 7 && hour <= 10) {
      score += 50; // High demand during breakfast hours
    } else if (hour > 11) {
      score -= 30; // 🔥 push down after breakfast time
    }
  }

  // Lunch (strong boost - make it dominant)
  if (cat.includes('rice') || cat.includes('biryani') || cat.includes('meals') || cat.includes('lunch')) {
    if (hour >= 12 && hour <= 15) {
      score += 70; // 🔥 higher than before - dominant during lunch
    } else if (isBreakfast) {
      score -= 20;
    } else if (isEvening) {
      score += 35;
    } else {
      score -= 10;
    }
  }

  // Snacks (crossover boost)
  if (cat.includes('snack') || cat.includes('north')) {
    if (
      (hour >= 10 && hour <= 12) ||
      (hour >= 16 && hour <= 18)
    ) {
      score += 45;
    }

    // Lunch crossover
    if (hour >= 12 && hour <= 14) {
      score += 30; // 🔥 stronger crossover during lunch
    }

    if (isEvening) {
      score += 30;
    } else if (isLateNight) {
      score += 20;
    }
  }

  // Juice/Beverages
  if (cat.includes('juice') || cat.includes('beverage') || cat.includes('drink')) {
    if (isBreakfast) score += 10;
    else if (isLunch) score += 25;
    else if (isEvening) score += 35;
    else score += 0;
  }

  // Desserts
  if (cat.includes('dessert') || cat.includes('sweet')) {
    if (isBreakfast) score -= 10;
    else if (isLunch) score += 15;
    else if (isEvening) score += 25;
    else score += 5;
  }

  // South Indian
  if (cat.includes('south') || cat.includes('indian')) {
    if (isBreakfast) score += 35;
    else if (isLunch) score += 40;
    else if (isEvening) score += 30;
    else score += 0;
  }

  // Weather/seasonal adjustments (can be enhanced with real weather API)
  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 3 && currentMonth <= 6; // Apr-Jul
  
  if (isSummer && (cat.includes('juice') || cat.includes('beverage'))) {
    score = Math.min(100, score + 15);
  }

  // Weekend adjustments (students might eat out more on weekends)
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  if (isWeekend) {
    score = Math.max(0, score - 10);
  }

  return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Get demand label based on score
 * @param {number} score - Demand score (0-100)
 * @returns {string} Demand label
 */
export const getDemandLabel = (score) => {
  if (score >= 75) return 'High Demand';
  if (score >= 50) return 'Moderate Demand';
  return 'Low Demand';
};

/**
 * Get recommended stock level based on demand score
 * @param {number} score - Demand score (0-100)
 * @param {number} currentStock - Current stock level
 * @returns {object} Stock recommendation
 */
export const getStockRecommendation = (score, currentStock) => {
  let recommendedStock;
  
  if (score >= 75) {
    recommendedStock = Math.ceil(currentStock * 1.5);
  } else if (score >= 50) {
    recommendedStock = currentStock;
  } else {
    recommendedStock = Math.ceil(currentStock * 0.7);
  }

  return {
    recommended: recommendedStock,
    action: recommendedStock > currentStock ? 'Increase Stock' : 
            recommendedStock < currentStock ? 'Reduce Stock' : 
            'Maintain Stock',
    difference: recommendedStock - currentStock
  };
};

/**
 * Get preparation recommendation based on demand
 * @param {object} params - Parameters including category, demand, currentStock
 * @returns {object} Preparation recommendation
 */
export const getPrepRecommendation = ({ category, demand, currentStock }) => {
  let recommendedQty = 0;
  let urgency = 'Low';

  if (demand === 'High Demand') {
    recommendedQty = Math.max(10, Math.ceil(currentStock * 0.5));
    urgency = 'High';
  } else if (demand === 'Moderate Demand') {
    recommendedQty = Math.max(5, Math.ceil(currentStock * 0.3));
    urgency = 'Medium';
  } else {
    recommendedQty = 0;
    urgency = 'Low';
  }

  return {
    recommendedQty,
    urgency,
    action: recommendedQty > 0 ? `Prepare +${recommendedQty} units` : 'No prep needed'
  };
};

/**
 * Predict next 30-minute demand
 * @param {string} category - Product category
 * @returns {object} Demand prediction
 */
export const predictDemand = (category) => {
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  
  // Current demand
  const currentScore = getDemandScore(category, currentHour);
  
  // Next 30-min demand (check if we're crossing into next hour)
  const futureHour = currentMinute >= 30 ? currentHour + 1 : currentHour;
  const futureScore = getDemandScore(category, futureHour);
  
  const trend = futureScore > currentScore ? 'increasing' : 
                futureScore < currentScore ? 'decreasing' : 
                'stable';

  return {
    current: {
      score: currentScore,
      label: getDemandLabel(currentScore)
    },
    next30min: {
      score: futureScore,
      label: getDemandLabel(futureScore)
    },
    trend
  };
};