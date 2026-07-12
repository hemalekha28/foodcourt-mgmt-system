import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiShoppingCart, FiHeart, FiLoader,
  FiPackage, FiTruck, FiShield, FiCornerUpLeft, FiInfo, FiChevronRight
} from 'react-icons/fi';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { useNotification } from '../context/notificationContext';
import { useAuth } from '../context/authContext';
import ProductImage from '../components/ProductImage';
import StockBadge from '../components/StockBadge';
import ReviewsSection from '../components/ReviewsSection';
import { formatPrice } from '../utils/helpers';
import { api } from '../utils/api';
import '../styles/product-detail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showSuccess, showError } = useNotification();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewEligibility, setReviewEligibility] = useState({ isEligible: false, orderId: null });
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      // Parallel fetch for product and reviews
      const [productData, reviewsData] = await Promise.all([
        api.getProduct(id),
        api.getProductReviews(id)
      ]);

      if (productData.success) {
        setProduct(productData.data.product);
        setReviews(reviewsData || []);
      }

      // If user logged in, check review eligibility
      if (user) {
        const reviewable = await api.getReviewableProducts();
        const matchingItem = reviewable.find(item => (item.product._id || item.product) === id);
        if (matchingItem) {
          setReviewEligibility({ isEligible: true, orderId: matchingItem.orderId });
        } else {
          setReviewEligibility({ isEligible: false, orderId: null });
        }
      }
    } catch (err) {
      setError(err.message || 'Technical disruption during product retrieval.');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    try {
      await addToCartContext({ ...product, id: product._id || product.id }, 1);
      showSuccess('Dish added to your order plate');
    } catch (err) {
      showError('Failed to update order plate.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) return (
    <div className="product-detail-page flex justify-center items-center">
      <div style={{ textAlign: 'center' }}>
        <FiLoader className="animate-spin" size={48} color="#0066cc" />
        <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Tuning into Kitchen Feed...</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="product-detail-page text-center">
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <FiInfo size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2 style={{ margin: 0, color: '#0f172a' }}>{error || 'Dish Not Found'}</h2>
        <p style={{ color: '#64748b', margin: '16px 0 24px' }}>This item is currently not on today's special menu.</p>
        <button onClick={() => navigate('/products')} className="btn-procure" style={{ width: '100%' }}><FiArrowLeft /> Back to Menu</button>
      </div>
    </div>
  );

  return (
    <div className="product-detail-page">
      <div className="container">
        <nav className="product-path">
          <Link to="/">Home</Link> <FiChevronRight size={12} />
          <Link to="/products">Menu</Link> <FiChevronRight size={12} />
          <span style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>{product.category}</span>
        </nav>

        <div className="product-layout">
          {/* Left: Dish Visuals */}
          <div className="product-visuals">
            <ProductImage product={product} />
          </div>

          {/* Right: Dish Intel */}
          <div className="product-intel">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="product-category-badge">{product.category}</span>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${product.isVeg !== false ? '#10b981' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  background: 'white'
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: product.isVeg !== false ? '#10b981' : '#ef4444' }}></div>
                </div>
              </div>
              <h1 className="product-main-title">{product.name}</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                <StockBadge stock={product.stock} />
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>TOKEN REF: {String(product._id).toUpperCase().slice(-8)}</span>
              </div>
            </div>

            <div className="product-valuation">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Dish Price</div>
                <div className="current-valuation">{formatPrice(product.price)}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Freshly Prepared</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Inclusive of Dining Tax</div>
              </div>
            </div>

            <div style={{ padding: '20px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700 }}>About this Dish</h4>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, fontSize: '0.95rem' }}>{product.description}</p>
            </div>

            <div className="procurement-actions">
              <div className="primary-actions-row">
                <button className="btn-procure" onClick={handleAddToCart} disabled={product.stock <= 0 || isAddingToCart}>
                  {isAddingToCart ? 'Adding...' : (product.stock > 0 ? <><FiShoppingCart /> Add to Plate</> : 'Sold Out')}
                </button>
                <button
                  className={`btn-wish-toggle ${isInWishlist(product._id) ? 'active' : ''}`}
                  onClick={() => isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product)}
                >
                  <FiHeart fill={isInWishlist(product._id) ? '#ef4444' : 'none'} size={24} />
                </button>
              </div>
              <button className="btn-buy-instant" onClick={() => navigate('/checkout', { state: { buyNowItem: { ...product, quantity: 1 } } })} disabled={product.stock <= 0}>
                Order Now (Immediate Pickup)
              </button>
            </div>

            <div className="specs-registry">
              <div className="spec-item">
                <div className="spec-icon"><FiTruck /></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Preparation</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>10-15 Mins</div>
                </div>
              </div>
              <div className="spec-item">
                <div className="spec-icon"><FiShield /></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Canteen Standard</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fresh & Hygienic</div>
                </div>
              </div>
              <div className="spec-item">
                <div className="spec-icon"><FiPackage /></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Serving</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hot & Ready</div>
                </div>
              </div>
              <div className="spec-item">
                <div className="spec-icon"><FiCornerUpLeft /></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Dining</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Campus Dining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Reviews */}
        <div className="reviews-vault">
          <ReviewsSection
            reviews={reviews}
            productName={product.name}
            isEligible={reviewEligibility.isEligible}
            orderId={reviewEligibility.orderId}
            productId={product._id}
            onReviewSubmitted={loadData}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
