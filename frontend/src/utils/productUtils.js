import productImages from '../data/productImages';

export const getProductImage = (productId, defaultImage = '/placeholder-product.svg') => {
  if (!productId) return defaultImage;
  
  const imageName = productImages[productId];
  if (!imageName) return defaultImage;
  
  return `/assets/products/${imageName}`;
};

export const getProductImageAlt = (productName) => {
  return productName ? `${productName} - Product Image` : 'Product Image';
};
