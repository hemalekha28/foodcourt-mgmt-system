import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiX } from 'react-icons/fi';
import { useCompare } from '../context/compareContext';
import { constructImageUrl } from '../utils/imageUtils';

const CompareFloatingButton = () => {
  const { compareItems, getCompareCount, clearCompare, removeFromCompare } = useCompare();
  const navigate = useNavigate();
  const count = getCompareCount();

  if (count === 0) {
    return null;
  }

  const handleCompareClick = () => {
    navigate('/compare');
  };

  return (
    <div className="compare-floating-button">
      <div className="compare-floating-content">
        <div className="compare-floating-header">
          <div className="compare-floating-icon">
            <FiBarChart2 size={20} />
          </div>
          <span className="compare-floating-text">
            Compare ({count}/{compareItems.length > 0 ? 3 : 0})
          </span>
        </div>

        {/* Mini preview of products */}
        <div className="compare-mini-preview">
          {compareItems.slice(0, 3).map((item) => {
            return (
              <div key={item._id} className="compare-mini-item">
                <img
                  src={constructImageUrl(item.image) || '/assets/no-image-placeholder.svg'}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = '/assets/no-image-placeholder.svg';
                  }}
                />
                <button
                  className="compare-mini-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCompare(item._id);
                  }}
                  aria-label="Remove from compare"
                >
                  <FiX size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="compare-floating-actions">
          <button
            className="btn-compare-now"
            onClick={handleCompareClick}
            disabled={count < 2}
          >
            Compare Now
          </button>
          <button
            className="btn-compare-clear"
            onClick={clearCompare}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingButton;
