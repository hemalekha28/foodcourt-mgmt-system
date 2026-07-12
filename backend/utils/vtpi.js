export const calculateVTPI = ({ avgEta, avgStock, rating }) => {
  let score = 0;

  // ⏱ Speed (40%)
  if (avgEta <= 10) score += 40;
  else if (avgEta <= 18) score += 28;
  else score += 15;

  // 📦 Stock Reliability (30%)
  if (avgStock >= 20) score += 30;
  else if (avgStock >= 10) score += 18;
  else score += 10;

  // ⭐ Customer Satisfaction (30%)
  score += Math.min(rating * 6, 30);

  return Math.round(score);
};

export const getVTPIStatus = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#16a34a' };
  if (score >= 60) return { label: 'Stable', color: '#f59e0b' };
  return { label: 'Needs Attention', color: '#dc2626' };
};
