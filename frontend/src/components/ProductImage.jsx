import React, { useState } from 'react';
import ImageComponent from './Image';
import { constructImageUrl } from '../utils/imageUtils';

const ProductImage = ({ product, selectedImageIndex = 0 }) => {
  const [mainImage, setMainImage] = useState(null);

  // Get all image URLs from the product
  const getImageUrls = () => {
    if (!product) return [];

    const urls = [];

    // Add main image if it exists
    if (product.image) {
      urls.push(product.image);
    }

    // Add images from images array if it exists
    if (Array.isArray(product.images)) {
      urls.push(...product.images);
    }

    // Add image from imageUrl if it exists
    if (product.imageUrl) {
      urls.push(product.imageUrl);
    }

    // Add thumbnail if it exists
    if (product.thumbnail) {
      urls.push(product.thumbnail);
    }

    // Filter out any null/undefined/empty values
    return urls.filter(url => url && typeof url === 'string');
  };

  const imageUrls = getImageUrls();

  // If no images are available, use a placeholder
  if (imageUrls.length === 0) {
    return (
      <div className="product-image-placeholder">
        <ImageComponent
          src="/assets/no-image-placeholder.svg"
          alt={product?.name || 'Product'}
          className="product-main-image"
        />
      </div>
    );
  }

  // Set main image based on selected index and construct proper URL
  const mainImageUrl = constructImageUrl(imageUrls[selectedImageIndex] || imageUrls[0]);

  return (
    <div className="product-image-container-full">
      <div className="product-main-image-wrapper">
        <ImageComponent
          src={mainImageUrl}
          alt={product?.name || 'Product'}
          className="product-main-image"
          onError={(e) => {
            e.target.src = '/assets/no-image-placeholder.svg';
          }}
        />
      </div>

      {imageUrls.length > 1 && (
        <div className="product-thumbnails">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              className={`thumbnail-btn ${index === selectedImageIndex ? 'active' : ''}`}
              onClick={() => setMainImage(index)}
              aria-label={`View image ${index + 1}`}
            >
              <ImageComponent
                src={constructImageUrl(url)}
                alt={`${product?.name || 'Product'} thumbnail ${index + 1}`}
                className="thumbnail-image"
                onError={(e) => {
                  e.target.src = '/assets/no-image-placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImage;