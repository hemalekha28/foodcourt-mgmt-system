const DEMAND_MULTIPLIER = {
  'High Demand': 1.5,
  'Moderate Demand': 1.0,
  'Low Demand': 0.5
};

const BASE_BATCH_SIZE = {
  breakfast: 10,
  lunch: 20,
  snacks: 12,
  beverages: 15,
  desserts: 8
};

export const getPrepRecommendation = ({
  category,
  demand,
  currentStock
}) => {
  const baseBatch = BASE_BATCH_SIZE[category] || 10;
  const multiplier = DEMAND_MULTIPLIER[demand] || 0.5;

  const recommended = Math.max(
    Math.round(baseBatch * multiplier - currentStock),
    0
  );

  let urgency = 'Low';
  if (demand === 'High Demand') urgency = 'High';
  else if (demand === 'Moderate Demand') urgency = 'Medium';

  return {
    recommendedQty: recommended,
    urgency
  };
};
