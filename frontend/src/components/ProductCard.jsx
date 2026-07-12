import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShoppingCart,
  FiHeart,
  FiStar,
  FiCheck,
  FiBarChart2,
  FiClock,
  FiTrendingUp,
  FiDollarSign,
  FiZap,
  FiAward
} from 'react-icons/fi';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { useNotification } from '../context/notificationContext';
import { useCompare } from '../context/compareContext';
import { formatPrice } from '../utils/helpers';
import Image from '../components/Image';
import { constructImageUrl } from '../utils/imageUtils';
import './ProductCard.css';

/* ---------------- SMART ETA LOGIC ---------------- */
const getSmartETA = (stock) => {
  if (stock > 20) return 8 + Math.floor(Math.random() * 5);
  if (stock > 10) return 12 + Math.floor(Math.random() * 6);
  if (stock > 5) return 18 + Math.floor(Math.random() * 6);
  return 25 + Math.floor(Math.random() * 8);
};

const getQueueLabel = (eta) => {
  if (eta <= 12) return { text: 'Low queue', color: '#16a34a', emoji: '🚀' };
  if (eta <= 20) return { text: 'Moderate queue', color: '#f59e0b', emoji: '⏱️' };
  return { text: 'Busy now', color: '#dc2626', emoji: '🔥' };
};
/* ------------------------------------------------ */

/* -------- ZERO-WASTE SMART PRICING LOGIC -------- */
const getSmartPrice = (price, stock) => {
  if (stock <= 5) return Math.floor(price * 0.6);
  if (stock <= 10) return Math.floor(price * 0.75);
  if (stock <= 15) return Math.floor(price * 0.9);
  return price;
};

const getOfferTag = (stock) => {
  if (stock <= 5) return { text: 'Flash Sale', color: '#dc2626', icon: '⚡' };
  if (stock <= 10) return { text: 'Save Food', color: '#16a34a', icon: '🌱' };
  return null;
};
/* ----------------------------------------------- */

/* -------- STUDENT INTELLIGENCE (SELECTIVE) ------ */
const getStudentRecommendations = ({ product, eta, finalPrice }) => {
  const recs = [];

  if (eta <= 10) {
    recs.push({ text: 'Quick pickup', icon: <FiClock />, color: '#0066ff' });
  }

  if (finalPrice <= 80) {
    recs.push({ text: 'Best value', icon: <FiDollarSign />, color: '#16a34a' });
  }

  if (
    product.category &&
    ['veg', 'salad', 'breakfast'].some((key) =>
      product.category.toLowerCase().includes(key)
    )
  ) {
    recs.push({ text: 'Light & healthy', icon: <FiTrendingUp />, color: '#10b981' });
  }

  if (finalPrice < product.price && eta <= 15) {
    recs.push({ text: 'Recommended', icon: <FiZap />, color: '#0066ff' });
  }

  return recs.slice(0, 2);
};
/* ----------------------------------------------- */

/* -------- SECOND-CHOICE LOGIC (SMART REDIRECTION) ------ */
const getSecondChoice = ({ currentProduct, allProducts }) => {
  if (currentProduct.queueLabel !== 'Busy now') return null;

  const alternatives = allProducts.filter(p =>
    p._id !== currentProduct._id &&
    p.category === currentProduct.category &&
    (p.stock || 0) > 5
  );

  if (!alternatives.length) return null;

  const ranked = alternatives
    .map(p => ({
      ...p,
      eta: getSmartETA(p.stock || 0)
    }))
    .filter(p => p.eta <= 15)
    .sort((a, b) => a.eta - b.eta);

  if (!ranked.length) return null;

  return {
    name: ranked[0].name,
    eta: ranked[0].eta,
    message: 'High demand right now. Faster option available'
  };
};
/* ----------------------------------------------- */

const ProductCard = ({ product, allProducts = [], showActions = true }) => {
  const { addToCart, isInCart, getItemQuantityInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showSuccess } = useNotification();
  const { addToCompare, isInCompare, removeFromCompare, canAddMore } = useCompare();

  const [isHovered, setIsHovered] = useState(false);
  const [eta] = useState(() => getSmartETA(product.stock || 0));
  const [queueLabel] = useState(() => getQueueLabel(eta));
  const [finalPrice, setFinalPrice] = useState(product.price);
  const [offerTag, setOfferTag] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [flowSuggestion, setFlowSuggestion] = useState(null);

  useEffect(() => {
    const smartPrice = getSmartPrice(product.price, product.stock || 0);
    setFinalPrice(smartPrice);
    setOfferTag(getOfferTag(product.stock || 0));

    const recs = getStudentRecommendations({
      product,
      eta,
      finalPrice: smartPrice
    });
    setRecommendations(recs);

    if (!queueLabel) return;

    const suggestion = getSecondChoice({
      currentProduct: {
        ...product,
        queueLabel: queueLabel.text
      },
      allProducts
    });

    setFlowSuggestion(suggestion);
  }, [product._id, eta, queueLabel]);

  const isWishlisted = isInWishlist(product._id);
  const inCart = isInCart(product._id);
  const cartQuantity = getItemQuantityInCart(product._id);
  const inCompare = isInCompare(product._id);
  const fallbackImageUrl = '/assets/no-image-placeholder.svg';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cartProduct = {
      ...product,
      price: finalPrice,
      originalPrice: product.price,
      appliedOffer: offerTag?.text
    };

    addToCart(cartProduct);
    showSuccess(
      `"${product.name}" added to cart at ${formatPrice(finalPrice)}`
    );
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product._id);
    } else {
      addToCompare(product);
    }
  };

  const discountPercent = finalPrice < product.price 
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;

  return (
    <div 
      className={`product-card-enhanced ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <div className="discount-badge">
          <span className="discount-percent">-{discountPercent}%</span>
        </div>
      )}

      {/* Offer Tag */}
      {offerTag && (
        <div className="offer-tag" style={{ backgroundColor: offerTag.color }}>
          <span className="offer-icon">{offerTag.icon}</span>
          <span className="offer-text">{offerTag.text}</span>
        </div>
      )}

      {/* IMAGE CONTAINER */}
      <div className="image-container-enhanced">
        <Link to={`/product/${product._id}`}>
          <div className="image-wrapper">
            <Image
              src={constructImageUrl(product.image) || fallbackImageUrl}
              alt={product.name}
              className="product-image-enhanced"
              fallback={fallbackImageUrl}
            />
            <div className="image-overlay"></div>
          </div>
        </Link>

        {/* Quick Actions Overlay */}
        <div className="quick-actions">
          {showActions && (
            <>
              <button
                className={`action-btn wishlist-btn-enhanced ${isWishlisted ? 'active' : ''}`}
                onClick={handleWishlistToggle}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <FiHeart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              <button
                className={`action-btn compare-btn-enhanced ${inCompare ? 'active' : ''}`}
                onClick={handleCompareToggle}
                disabled={!canAddMore && !inCompare}
                title="Compare"
              >
                <FiBarChart2 size={20} />
              </button>
            </>
          )}
        </div>

        {/* In Cart Badge */}
        {inCart && (
          <div className="in-cart-badge-enhanced">
            <FiCheck size={16} />
            <span>In Cart ({cartQuantity})</span>
          </div>
        )}

        {/* Queue Status */}
        {eta && queueLabel && (
          <div className="queue-status" style={{ borderColor: queueLabel.color }}>
            <span className="queue-emoji">{queueLabel.emoji}</span>
            <span className="queue-time">{eta} mins</span>
          </div>
        )}
      </div>

      {/* PRODUCT INFO */}
      <div className="product-info-enhanced">
        {/* Category Badge */}
        {product.category && (
          <div className="category-badge">
            {product.category}
          </div>
        )}

        {/* Product Name */}
        <h3 className="product-name-enhanced">
          <Link to={`/product/${product._id}`}>{product.name}</Link>
        </h3>

        {/* Rating (if available) */}
        {product.rating && (
          <div className="rating-container">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  size={14}
                  fill={i < Math.floor(product.rating) ? '#fbbf24' : 'none'}
                  color="#fbbf24"
                />
              ))}
            </div>
            <span className="rating-text">
              {product.rating} {product.reviewCount && `(${product.reviewCount})`}
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="price-section">
          {finalPrice < product.price ? (
            <>
              <div className="price-row">
                <span className="current-price">{formatPrice(finalPrice)}</span>
                <span className="original-price">{formatPrice(product.price)}</span>
              </div>
              <div className="savings-text">
                You save {formatPrice(product.price - finalPrice)}
              </div>
            </>
          ) : (
            <span className="current-price">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Queue Label */}
        {queueLabel && (
          <div className="queue-label-inline">
            <FiClock size={14} />
            <span style={{ color: queueLabel.color, fontWeight: 600 }}>
              {queueLabel.text}
            </span>
          </div>
        )}

        {/* Smart Redirection */}
        {flowSuggestion && (
          <div className="flow-suggestion">
            <div className="suggestion-header">
              <FiZap size={16} />
              <strong>{flowSuggestion.message}</strong>
            </div>
            <div className="suggestion-body">
              Try <strong>{flowSuggestion.name}</strong> — ready in {flowSuggestion.eta} mins
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="recommendations-grid">
            {recommendations.map((rec, idx) => (
              <span
                key={idx}
                className="recommendation-tag"
                style={{ color: rec.color }}
              >
                {rec.icon}
                <span>{rec.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Add to Cart Button */}
        {showActions && (
          <button
            className={`add-to-cart-btn-enhanced ${!product.stock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={!product.stock}
          >
            {product.stock ? (
              <>
                <FiShoppingCart size={20} />
                <span>{inCart ? 'Added to Cart' : 'Add to Cart'}</span>
              </>
            ) : (
              <>
                <FiClock size={20} />
                <span>Out of Stock</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;