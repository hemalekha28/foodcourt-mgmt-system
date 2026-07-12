const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config({ path: '../.env' });

const foods = [
    {
        name: 'Ghee Roast Dosa',
        description: 'Crispy, golden-brown dosa made with pure cow ghee, served with 3 types of chutneys and sambar.',
        price: 65,
        image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee597a?q=80&w=600&auto=format&fit=crop',
        category: 'breakfast',
        isVeg: true,
        stock: 100
    },
    {
        name: 'South Indian Thali',
        description: 'A complete meal with Rice, Sambar, Rasam, Kootu, Poriyal, Curd, Appalam, and a sweet.',
        price: 90,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?q=80&w=600&auto=format&fit=crop',
        category: 'south-indian',
        isVeg: true,
        stock: 150
    },
    {
        name: 'Chicken Biryani (Basmati)',
        description: 'Authentic Seeraga Samba chicken biryani served with onion raita and brinjal gravy.',
        price: 140,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?q=80&w=600&auto=format&fit=crop',
        category: 'lunch',
        isVeg: false,
        stock: 50
    },
    {
        name: 'Paneer Butter Masala',
        description: 'Creamy and rich tomato-based gravy with soft paneer cubes, served with 2 Butter Phulkas.',
        price: 110,
        image: 'https://images.unsplash.com/photo-1567184109191-38aef2117546?q=80&w=600&auto=format&fit=crop',
        category: 'north-indian',
        isVeg: true,
        stock: 40
    },
    {
        name: 'Corn Cheese Sandwich',
        description: 'Grilled sandwich stuffed with sweet corn, spices, and mozzarella cheese.',
        price: 55,
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=600&auto=format&fit=crop',
        category: 'snacks',
        isVeg: true,
        stock: 60
    },
    {
        name: 'Fresh Watermelon Juice',
        description: '100% natural, chilled watermelon juice with no added preservatives.',
        price: 40,
        image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?q=80&w=600&auto=format&fit=crop',
        category: 'juices',
        isVeg: true,
        stock: 80
    },
    {
        name: 'Filter Coffee',
        description: 'Traditional Kumbakonam Degree Filter coffee served hot.',
        price: 25,
        image: 'https://images.unsplash.com/photo-1544787210-22db340e7121?q=80&w=600&auto=format&fit=crop',
        category: 'beverages',
        isVeg: true,
        stock: 200
    },
    {
        name: 'Gulab Jamun (2 Pcs)',
        description: 'Soft and succulent milk-based dumplings soaked in cardamom-flavored sugar syrup.',
        price: 35,
        image: 'https://images.unsplash.com/photo-1548840410-ad2acc593a10?q=80&w=600&auto=format&fit=crop',
        category: 'desserts',
        isVeg: true,
        stock: 30
    }
];

const seedFood = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing products
        await Product.deleteMany();
        console.log('Existing items cleared.');

        // Insert new food items
        await Product.insertMany(foods);
        console.log('Professional KEC Food Court items seeded successfully!');

        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedFood();
