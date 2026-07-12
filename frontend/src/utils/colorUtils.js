/**
 * Utility functions for color manipulation and contrast calculation
 */

/**
 * Converts a hex color to RGB
 * @param {string} hex - The hex color code (with or without #)
 * @returns {Object} An object with r, g, b values
 */
export const hexToRgb = (hex) => {
  // Remove # if present
  const hexValue = hex.replace('#', '');
  
  // Parse r, g, b values
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  
  return { r, g, b };
};

/**
 * Calculates the relative luminance of a color
 * Follows WCAG 2.0 guidelines: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {number} The relative luminance (0-1)
 */
export const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

/**
 * Calculates the contrast ratio between two colors
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @returns {number} The contrast ratio
 */
export const getContrastRatio = (color1, color2) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const l1 = getLuminance(c1.r, c1.g, c1.b) + 0.05;
  const l2 = getLuminance(c2.r, c2.g, c2.b) + 0.05;
  
  return (Math.max(l1, l2) / Math.min(l1, l2)).toFixed(2);
};

/**
 * Determines the best text color (black or white) for a given background color
 * @param {string} bgColor - Background color in hex format (with or without #)
 * @returns {string} '#000000' for light backgrounds, '#ffffff' for dark backgrounds
 */
export const getTextColorForBackground = (bgColor) => {
  if (!bgColor) return '#000000'; // Default to black if no color provided
  
  // If the color is in rgb or rgba format, convert it to hex
  if (bgColor.startsWith('rgb')) {
    // Simple conversion for rgb/rgba to hex
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb.map(Number);
      bgColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  }
  
  // Ensure the color is in hex format
  if (!bgColor.startsWith('#')) {
    bgColor = `#${bgColor}`;
  }
  
  // Handle shorthand hex colors (e.g., #abc)
  if (bgColor.length === 4) {
    bgColor = `#${bgColor[1]}${bgColor[1]}${bgColor[2]}${bgColor[2]}${bgColor[3]}${bgColor[3]}`;
  }
  
  const { r, g, b } = hexToRgb(bgColor);
  const luminance = getLuminance(r, g, b);
  
  // Use white text for dark backgrounds, black for light backgrounds
  return luminance > 0.179 ? '#000000' : '#ffffff';
};

/**
 * Applies automatic text color based on background color to an element
 * @param {HTMLElement} element - The DOM element to style
 * @param {string} bgColor - The background color in any valid CSS color format
 */
export const applyAutoTextColor = (element, bgColor) => {
  if (!element || !bgColor) return;
  
  const textColor = getTextColorForBackground(bgColor);
  element.style.color = textColor;
  
  // For better contrast, adjust other text-related properties
  if (textColor === '#ffffff') {
    element.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  } else {
    element.style.textShadow = '0 1px 0 rgba(255,255,255,0.5)';
  }
};

/**
 * Creates a style element with automatic text color classes
 * @param {Object} colorMap - Object mapping CSS class names to background colors
 * @returns {HTMLElement} A style element with the generated CSS
 */
export const createAutoTextColorStyles = (colorMap) => {
  const style = document.createElement('style');
  let css = '';
  
  Object.entries(colorMap).forEach(([className, bgColor]) => {
    const textColor = getTextColorForBackground(bgColor);
    const textShadow = textColor === '#ffffff' 
      ? '0 1px 2px rgba(0,0,0,0.5)' 
      : '0 1px 0 rgba(255,255,255,0.5)';
    
    css += `
      .${className} {
        color: ${textColor} !important;
        text-shadow: ${textShadow} !important;
      }
    `;
  });
  
  style.textContent = css;
  return style;
};
