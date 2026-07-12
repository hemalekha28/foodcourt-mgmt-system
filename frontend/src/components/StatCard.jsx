import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import useAutoTextColor from '../hooks/useAutoTextColor';

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  link, 
  linkText = 'View', 
  iconColor = '#4f46e5',
  bgColor = 'rgba(249, 250, 251, 0.9)',
  children 
}) => {
  const cardRef = useRef(null);
  
  // Use the auto text color hook
  useAutoTextColor(bgColor, cardRef);
  
  return (
    <div 
      ref={cardRef}
      className="stat-card"
      style={{
        background: bgColor,
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ 
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        opacity: 0.1,
        zIndex: 0,
      }}>
        <Icon size={64} />
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
        }}>
          <Icon size={24} />
        </div>
      </div>
      
      <div style={{ 
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ 
          fontSize: '1.875rem',
          fontWeight: '700',
          marginBottom: '0.25rem',
          lineHeight: 1,
        }}>
          {value}
        </div>
        
        <div style={{ 
          fontSize: '0.875rem',
          opacity: 0.9,
          marginBottom: '1rem',
          fontWeight: '500',
        }}>
          {label}
        </div>
        
        {children}
        
        {link && (
          <Link 
            to={link}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'inherit',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default StatCard;
