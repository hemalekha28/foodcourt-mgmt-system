import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Product data with IDs and names
const products = [
  { id: '68d76e8694fce39c46d20988', name: 'Dumbbell Set', category: 'sports' },
  { id: '68d76e8694fce39c46d20987', name: 'Yoga Mat', category: 'sports' },
  { id: '68d76e8694fce39c46d20986', name: 'Cricket Ball', category: 'sports' },
  { id: '68d76e6894fce39c46d20984', name: 'Smart Home Hub', category: 'home' },
  { id: '68d76e6894fce39c46d20985', name: 'Kitchen Blender', category: 'home' },
  { id: '68d76e6894fce39c46d20983', name: 'Modern Home Decor Set', category: 'home' },
  { id: '68d76e1294fce39c46d20980', name: 'Programming Fundamentals', category: 'books' },
  { id: '68d76e1294fce39c46d20981', name: 'JavaScript Mastery', category: 'books' },
  { id: '68d76e1294fce39c46d20982', name: 'React Development Guide', category: 'books' },
  { id: '68d76df694fce39c46d2097f', name: 'Running Shoes', category: 'clothing' },
  { id: '68d76df694fce39c46d2097c', name: 'Premium Cotton T-Shirt', category: 'clothing' },
  { id: '68d76df694fce39c46d2097d', name: 'Warm Wool Sweater', category: 'clothing' }
];

// Output directory
const outputDir = join(__dirname, '..', 'public', 'assets', 'products');

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Category colors
const categoryColors = {
  sports: '#3B82F6',
  home: '#10B981',
  books: '#F59E0B',
  clothing: '#EC4899',
  default: '#6B7280'
};

// Function to generate a placeholder image
function generatePlaceholderImage(product) {
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // Background color based on category
  const bgColor = categoryColors[product.category] || categoryColors.default;
  context.fillStyle = bgColor + '20'; // Add opacity
  context.fillRect(0, 0, width, height);

  // Add text
  context.fillStyle = '#1F2937';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Category
  context.font = 'bold 48px Arial';
  context.fillText(product.category.toUpperCase(), width / 2, height / 2 - 40);
  
  // Product name (split into multiple lines if needed)
  const maxWidth = width * 0.8;
  const lineHeight = 40;
  const words = product.name.split(' ');
  let line = '';
  let y = height / 2 + 20;
  
  context.font = '24px Arial';
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && line.length > 0) {
      context.fillText(line, width / 2, y);
      line = word + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  context.fillText(line, width / 2, y);
  
  // Add ID
  context.font = '16px Arial';
  context.fillStyle = '#6B7280';
  context.fillText(`ID: ${product.id}`, width / 2, height - 40);

  // Save the image
  const filename = `${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  const outputPath = join(outputDir, filename);
  
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 });
  writeFileSync(outputPath, buffer);
  
  return filename;
}

// Generate images for all products
console.log('Generating placeholder images...');
products.forEach(product => {
  const filename = generatePlaceholderImage(product);
  console.log(`Generated: ${filename}`);
});

console.log('\nAll placeholder images have been generated!');
console.log(`Output directory: ${outputDir}`);
