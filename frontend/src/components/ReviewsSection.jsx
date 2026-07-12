import React, { useState } from 'react';
import { FiStar, FiUser, FiCalendar, FiCheckCircle, FiMessageSquare, FiEdit, FiX } from 'react-icons/fi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { api } from '../utils/api';

const ReviewsSection = ({ reviews = [], productName, isEligible, orderId, productId, onReviewSubmitted }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.comment.length < 10) return alert("Please provide a more detailed review.");

    setIsSubmitting(true);
    try {
      await api.createReview({
        productId,
        orderId,
        rating: formData.rating,
        comment: formData.comment
      });
      setShowModal(false);
      setFormData({ rating: 5, comment: '' });
      if (onReviewSubmitted) onReviewSubmitted();
      alert("Thank you! Your verified review has been published.");
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reviews-vault-content">
      <div className="reviews-header-suite">
        <div className="reviews-title-block">
          <h2>Insights & Feedback</h2>
          <div className="reviews-stats">
            <div style={{ display: 'flex', color: '#F59E0B' }}>{[1, 2, 3, 4, 5].map(s => s <= Math.round(averageRating) ? <AiFillStar key={s} /> : <AiOutlineStar key={s} />)}</div>
            <span>{averageRating} Rating ({reviews.length} total)</span>
          </div>
        </div>

        {isEligible && (
          <button onClick={() => setShowModal(true)} className="btn-procure" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.875rem' }}>
            <FiEdit /> Share Experience
          </button>
        )}
      </div>

      {isEligible && !showModal && (
        <div className="write-review-prompt">
          <p style={{ margin: 0, color: '#0066cc', fontWeight: 600 }}>You purchased this item! Share your feedback with other customers.</p>
        </div>
      )}

      <div className="reviews-list-premium">
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <FiMessageSquare size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No verified reviews for this unit yet.</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="review-card-premium">
              <div className="reviewer-profile">
                <div className="reviewer-meta">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><FiUser /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.user?.name || 'Anonymous Purchaser'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FiCalendar /> {formatDate(r.createdAt)}</div>
                  </div>
                </div>
                {r.isVerifiedPurchase && <span className="reviewer-badge"><FiCheckCircle size={10} /> Verified</span>}
              </div>
              <div style={{ display: 'flex', color: '#F59E0B', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map(s => s <= r.rating ? <AiFillStar key={s} /> : <AiOutlineStar key={s} />)}
              </div>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>{r.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Write Review Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Write a Review</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>Performance Rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({ ...formData, rating: s })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      {s <= formData.rating ? <AiFillStar size={32} color="#F59E0B" /> : <AiOutlineStar size={32} color="#cbd5e1" />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>Detailed Feedback</label>
                <textarea
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', minHeight: '120px', fontSize: '0.9rem' }}
                  placeholder="What was your experience with this product?"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-procure" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Syncing...' : 'Publish Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;