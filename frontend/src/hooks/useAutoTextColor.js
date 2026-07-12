import { useEffect, useRef } from 'react';
import { applyAutoTextColor } from '../utils/colorUtils';

/**
 * Custom hook to automatically adjust text color based on background color
 * @param {string} bgColor - The background color in any valid CSS color format
 * @param {Object} ref - Optional ref to the element to apply the color to
 * @param {Array} deps - Dependencies to watch for changes
 */
const useAutoTextColor = (bgColor, ref, deps = []) => {
  const elementRef = useRef(null);
  const refToUse = ref || elementRef;

  useEffect(() => {
    if (!bgColor || !refToUse.current) return;
    
    applyAutoTextColor(refToUse.current, bgColor);
    
    // Handle dynamic background colors (e.g., gradients, transitions)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          const style = window.getComputedStyle(refToUse.current);
          const currentBgColor = style.backgroundColor;
          if (currentBgColor !== 'rgba(0, 0, 0, 0)') {
            applyAutoTextColor(refToUse.current, currentBgColor);
          }
        }
      });
    });
    
    observer.observe(refToUse.current, { attributes: true, attributeFilter: ['style'] });
    
    return () => {
      observer.disconnect();
    };
  }, [bgColor, refToUse, ...deps]);

  return refToUse;
};

export default useAutoTextColor;
