const https = require('https');
const fs = require('fs');
const path = require('path');

// Product list with search keywords for Unsplash API
const products = [
  { name: 'dumbbell-set', search: 'dumbbell fitness', category: 'sports' },
  { name: 'yoga-mat', search: 'yoga mat exercise', category: 'sports' },
  { name: 'cricket-ball', search: 'cricket ball red', category: 'sports' },
  { name: 'smart-home-hub', search: 'smart home device', category: 'electronics' },
  { name: 'kitchen-blender', search: 'kitchen blender mixer', category: 'home' },
  { name: 'modern-home-decor-set', search: 'home decor modern', category: 'home' },
  { name: 'programming-fundamentals', search: 'programming book code', category: 'books' },
  { name: 'javascript-mastery', search: 'javascript book coding', category: 'books' },
  { name: 'react-development-guide', search: 'react programming book', category: 'books' },
  { name: 'running-shoes', search: 'running shoes sneakers', category: 'clothing' },
  { name: 'premium-cotton-tshirt', search: 'cotton tshirt white', category: 'clothing' },
  { name: 'warm-wool-sweater', search: 'wool sweater warm', category: 'clothing' }
];

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('🎨 Product Image Downloader\n');
console.log('📁 Upload directory:', uploadsDir);
console.log('━'.repeat(60));

// Function to download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(uploadsDir, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${filename}`);
          resolve(filepath);
        });
      } else {
        fs.unlink(filepath, () => {});
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Using Lorem Picsum (free placeholder images with better quality)
async function downloadProductImages() {
  console.log('\n🚀 Starting download process...\n');
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const filename = `${product.name}.jpg`;
    
    try {
      // Use Lorem Picsum with seed for consistent images
      const imageUrl = `https://picsum.photos/seed/${product.name}/800/800`;
      
      console.log(`⏳ Downloading ${i + 1}/${products.length}: ${product.name}...`);
      await downloadImage(imageUrl, filename);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error downloading ${product.name}:`, error.message);
    }
  }
  
  console.log('\n━'.repeat(60));
  console.log('✨ Download process completed!');
  console.log(`📦 Images saved to: ${uploadsDir}`);
  console.log('\n💡 Note: Using Lorem Picsum placeholder images.');
  console.log('   For real product images, please use:');
  console.log('   - Unsplash.com');
  console.log('   - Pexels.com');
  console.log('   - Your own product photography\n');
}

// Alternative: Using Unsplash API (requires API key)
async function downloadFromUnsplash() {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('⚠️  Unsplash API key not found in environment variables.');
    console.log('   Using Lorem Picsum instead...\n');
    return downloadProductImages();
  }
  
  console.log('🎨 Using Unsplash API for high-quality images...\n');
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const filename = `${product.name}.jpg`;
    
    try {
      // Unsplash API endpoint
      const searchQuery = encodeURIComponent(product.search);
      const apiUrl = `https://api.unsplash.com/photos/random?query=${searchQuery}&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      console.log(`⏳ Downloading ${i + 1}/${products.length}: ${product.name}...`);
      
      // Fetch image URL from Unsplash
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.urls && data.urls.regular) {
        await downloadImage(data.urls.regular, filename);
      } else {
        throw new Error('Invalid response from Unsplash API');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error downloading ${product.name}:`, error.message);
    }
  }
  
  console.log('\n✨ Download completed!');
}

// Run the downloader
console.log('\n🎯 Choose download method:');
console.log('   1. Lorem Picsum (Free, no API key needed)');
console.log('   2. Unsplash API (High quality, requires API key)\n');

// Check if Unsplash API key is available
if (process.env.UNSPLASH_ACCESS_KEY) {
  console.log('✅ Unsplash API key found! Using Unsplash...\n');
  downloadFromUnsplash();
} else {
  console.log('📸 Using Lorem Picsum (free placeholder service)...\n');
  downloadProductImages();
}
