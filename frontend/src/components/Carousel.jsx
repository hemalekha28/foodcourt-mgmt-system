import React from 'react';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiChevronLeft, FiChevronRight, FiPlay } from 'react-icons/fi';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="carousel-arrow carousel-arrow-next"
    aria-label="Next slide"
    style={{
      position: 'absolute',
      right: '2rem',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '50%',
      width: '56px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
      e.currentTarget.style.background = 'white';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
    }}
  >
    <FiChevronRight size={28} />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="carousel-arrow carousel-arrow-prev"
    aria-label="Previous slide"
    style={{
      position: 'absolute',
      left: '2rem',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '50%',
      width: '56px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
      e.currentTarget.style.background = 'white';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
    }}
  >
    <FiChevronLeft size={28} />
  </button>
);

const Carousel = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    autoplay: true,
    autoplaySpeed: 6000,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: true,
    fade: true,
    cssEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
    dotsClass: 'slick-dots carousel-custom-dots',
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  return (
    <div className="w-full carousel-wrapper" style={{ position: 'relative', marginBottom: '0' }}>
      <style>{`
        .carousel-wrapper {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .carousel-custom-dots {
          bottom: 2rem !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .carousel-custom-dots li {
          margin: 0;
          width: auto;
          height: auto;
        }

        .carousel-custom-dots li button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.8);
          padding: 0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .carousel-custom-dots li button:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: scale(1.2);
        }

        .carousel-custom-dots li button::before {
          display: none;
        }

        .carousel-custom-dots li.slick-active button {
          width: 40px;
          border-radius: 6px;
          background: white;
          border-color: white;
        }

        .slide-content-animate {
          animation: slideContentIn 1s ease-out forwards;
        }

        @keyframes slideContentIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 4px 24px rgba(59, 130, 246, 0.6);
          }
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
          text-decoration: none;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 700;
          border: 2px solid rgba(255, 255, 255, 0.8);
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          text-decoration: none;
        }

        .btn-secondary:hover {
          background: white;
          color: #1e40af;
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(255, 255, 255, 0.3);
        }

        .gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.85) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 100%);
          z-index: 1;
        }

        .content-glow {
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .carousel-arrow-next {
            right: 1rem !important;
            width: 44px !important;
            height: 44px !important;
          }
          
          .carousel-arrow-prev {
            left: 1rem !important;
            width: 44px !important;
            height: 44px !important;
          }

          .carousel-custom-dots {
            bottom: 1rem !important;
          }
        }

        .slide-image {
          animation: kenBurns 20s ease infinite alternate;
        }

        @keyframes kenBurns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }
      `}</style>

      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <Slider {...settings}>
          {slides.map((slide, idx) => (
            <div key={idx}>
              <div
                className="relative"
                style={{
                  height: '650px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background Image with Ken Burns Effect */}
                <div 
                  className="slide-image"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                {/* Gradient Overlay */}
                <div className="gradient-overlay" />

                {/* Content */}
                <div className="container mx-auto px-4 md:px-8 h-full flex items-center relative" style={{ zIndex: 3 }}>
                  <div className="max-w-3xl text-white slide-content-animate">
                    {/* Badge */}
                    <div 
                      className="badge-pulse"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '50px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginBottom: '1.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <FiPlay size={14} />
                      {slide.badge || 'Featured'}
                    </div>

                    {/* Title */}
                    <h2 
                      className="content-glow"
                      style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {slide.title}
                    </h2>

                    {/* Subtitle */}
                    <p 
                      className="content-glow"
                      style={{
                        fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
                        lineHeight: '1.7',
                        marginBottom: '2.5rem',
                        opacity: 0.98,
                        maxWidth: '600px',
                        fontWeight: '400'
                      }}
                    >
                      {slide.subtitle}
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {slide.primaryCta && (
                        <Link
                          to={slide.primaryCta.href}
                          className="btn-primary"
                          tabIndex={currentSlide === idx ? 0 : -1}
                        >
                          <FiShoppingBag size={20} />
                          {slide.primaryCta.label}
                        </Link>
                      )}
                      {slide.secondaryCta && (
                        <Link
                          to={slide.secondaryCta.href}
                          className="btn-secondary"
                          tabIndex={currentSlide === idx ? 0 : -1}
                        >
                          {slide.secondaryCta.label}
                        </Link>
                      )}
                    </div>

                    {/* Trust Indicators */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '2rem', 
                      marginTop: '2.5rem',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 12px #10b981'
                        }} />
                        <span style={{ fontSize: '0.9rem', opacity: 0.95 }}>Live Now</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                        ⭐ 4.8/5 Rating
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                        🔥 50K+ Orders Served
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Carousel;