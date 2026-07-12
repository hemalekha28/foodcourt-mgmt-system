const productImages = {
  // Sports
  '68d76e8694fce39c46d20988': 'dumbbell-set.jpg',
  '68d76e8694fce39c46d20987': 'yoga-mat.jpg',
  '68d76e8694fce39c46d20986': 'cricket-ball.jpg',
  
  // Home
  '68d76e6894fce39c46d20984': 'smart-home-hub.jpg',
  '68d76e6894fce39c46d20985': 'kitchen-blender.jpg',
  '68d76e6894fce39c46d20983': 'modern-home-decor-set.jpg',
  
  // Books
  '68d76e1294fce39c46d20980': 'programming-fundamentals.jpg',
  '68d76e1294fce39c46d20981': 'javascript-mastery.jpg',
  '68d76e1294fce39c46d20982': 'react-development-guide.jpg',
  
  // Clothing
  '68d76df694fce39c46d2097f': 'running-shoes.jpg',
  '68d76df694fce39c46d2097c': 'premium-cotton-t-shirt.jpg',
  '68d76df694fce39c46d2097d': 'warm-wool-sweater.jpg'
};

// Export a function to get the image URL with fallback
export const getProductImageUrl = (productId, defaultImage = '/placeholder-product.svg') => {
  if (!productId) return defaultImage;
  
  const imageName = productImages[productId];
  if (!imageName) return defaultImage;
  
  return `/assets/products/${imageName}`;
};

export default productImages;
