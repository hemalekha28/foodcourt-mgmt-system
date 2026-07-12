import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiShield,
  FiTruck,
  FiCreditCard
} from 'react-icons/fi';
import '../styles/footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* About Section */}
          <div className="footer-column footer-about">
            <div className="footer-brand">
              <span className="footer-logo-icon">🍽️</span>
              <h3 className="footer-brand-name">KEC Food Court</h3>
            </div>
            <p className="footer-description">
              Fueling the engineers of tomorrow. Serving delicious, hygienic, and affordable meals to the students and faculty of Kongu Engineering College.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook" title="Facebook">
                <FiFacebook />
              </a>
              <a href="#" className="social-link" aria-label="Twitter" title="Twitter">
                <FiTwitter />
              </a>
              <a href="#" className="social-link" aria-label="Instagram" title="Instagram">
                <FiInstagram />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn" title="LinkedIn">
                <FiLinkedin />
              </a>
              <a href="#" className="social-link" aria-label="YouTube" title="YouTube">
                <FiYoutube />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="footer-heading">Canteen Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Food Menu</Link></li>
              <li><Link to="/products?category=breakfast">Breakfast Special</Link></li>
              <li><Link to="/products?category=lunch">Student Meals</Link></li>
              <li><Link to="/wishlist">My Favorites</Link></li>
              <li><Link to="/dashboard">Hostel Mess Menu</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-column">
            <h4 className="footer-heading">Assistance</h4>
            <ul className="footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><a href="#feedback">Give Feedback</a></li>
              <li><a href="#bulk-orders">Bulk Catering</a></li>
              <li><a href="#safety">Hygiene Standards</a></li>
              <li><a href="#faq">FAQs</a></li>
              <li><a href="#contact">Contact Manager</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="footer-column">
            <h4 className="footer-heading">Campus Policies</h4>
            <ul className="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms & Conditions</a></li>
              <li><a href="#food-safety">Food Safety Policy</a></li>
              <li><a href="#pricing">Student Pricing</a></li>
              <li><a href="#timing">Canteen Timings</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-column">
            <h4 className="footer-heading">Locate Us</h4>
            <ul className="footer-contact">
              <li>
                <FiMapPin className="contact-icon" />
                <span>Kongu Engineering College, Perundurai, Erode - 638060</span>
              </li>
              <li>
                <FiPhone className="contact-icon" />
                <span>+91 4294 226555</span>
              </li>
              <li>
                <FiMail className="contact-icon" />
                <span>foodcourt@kongu.ac.in</span>
              </li>
            </ul>
            <div className="footer-hours">
              <p className="hours-title">Operational Hours</p>
              <p>Mon - Sat: 8:00 AM - 8:30 PM</p>
              <p>Sunday: 9:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="footer-features">
          <div className="feature-item">
            <div className="feature-icon" style={{ fontSize: '1.5rem' }}>🥗</div>
            <div className="feature-text">
              <strong>100% Hygienic</strong>
              <span>Clean & healthy food</span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon" style={{ fontSize: '1.5rem' }}>⚡</div>
            <div className="feature-text">
              <strong>Quick Pickup</strong>
              <span>Skip the long queue</span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon" style={{ fontSize: '1.5rem' }}>🎓</div>
            <div className="feature-text">
              <strong>Student Friendly</strong>
              <span>Pocket-friendly prices</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} KEC Food Court. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#sitemap">Sitemap</a>
              <span className="separator">•</span>
              <a href="#accessibility">Accessibility</a>
              <span className="separator">•</span>
              <a href="#careers">Careers</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;