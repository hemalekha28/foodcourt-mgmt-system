import React from 'react';

const StockBadge = ({ stock, threshold = 10 }) => {
  if (stock === undefined || stock === null) {
    return null;
  }

  let badgeClass = '';
  let badgeText = '';

  if (stock <= 0) {
    badgeClass = 'stock-badge-out-of-stock';
    badgeText = 'Out of Stock';
  } else if (stock <= threshold) {
    badgeClass = 'stock-badge-low-stock';
    badgeText = `Only ${stock} left`;
  } else {
    badgeClass = 'stock-badge-in-stock';
    badgeText = `${stock} in stock`;
  }

  return (
    <span className={`stock-badge ${badgeClass}`}>
      {badgeText}
    </span>
  );
};

export default StockBadge;