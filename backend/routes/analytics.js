// routes/analytics.js
const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, admin } = require('../middlewares/auth');

const router = express.Router();

// GET /api/analytics
router.get('/', protect, admin, async (req, res) => {
  try {
    console.log('📊 Analytics endpoint hit - KEC Food Court');

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    const totalRevenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Sales by month (current year)
    const byMonthAgg = await Order.aggregate([
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    let salesByMonth = byMonthAgg
      .filter(x => x._id.y === currentYear)
      .map(x => ({
        month: `${monthNames[x._id.m - 1]}`,
        sales: Number(x.sales || 0),
        orders: Number(x.orders || 0)
      }));

    if (salesByMonth.length === 0) {
      const currentMonth = new Date().getMonth();
      salesByMonth = [
        { month: monthNames[(currentMonth - 2 + 12) % 12], sales: 5000, orders: 120, growth: 0 },
        { month: monthNames[(currentMonth - 1 + 12) % 12], sales: 7500, orders: 180, growth: 50 },
        { month: monthNames[currentMonth], sales: 8200, orders: 200, growth: 9 }
      ];
    } else {
      for (let i = 1; i < salesByMonth.length; i++) {
        const prev = salesByMonth[i - 1].sales || 0;
        const curr = salesByMonth[i].sales || 0;
        salesByMonth[i].growth = prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(2)) : 0;
      }
      if (salesByMonth.length > 0 && salesByMonth[0].growth === undefined) salesByMonth[0].growth = 0;
    }

    // Sales by category (Updated for Items schema)
    const byCategoryAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.foodId', foreignField: '_id', as: 'prod' } },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$prod.category', 'Breakfast'] },
          sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { sales: -1 } }
    ]);

    let salesByCategory = [];
    if (byCategoryAgg.length > 0) {
      const totalCategorySales = byCategoryAgg.reduce((s, c) => s + (c.sales || 0), 0) || 0;
      salesByCategory = byCategoryAgg.map(c => ({
        name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
        sales: Number(c.sales || 0),
        value: Number(c.sales || 0),
        orders: Number(c.orders || 0),
        percentage: totalCategorySales > 0 ? Number(((c.sales / totalCategorySales) * 100).toFixed(2)) : 0
      }));
    } else {
      salesByCategory = [
        { name: 'Breakfast', sales: 2500, value: 2500, orders: 45, percentage: 30 },
        { name: 'Lunch', sales: 4200, value: 4200, orders: 38, percentage: 50 },
        { name: 'Snacks', sales: 1800, value: 1800, orders: 22, percentage: 20 }
      ];
    }

    // Sales by day (last 30 days) - total products sold per day
    let salesByDay = [];
    let peakDay = null;

    // Define startDate outside try block so it's available for dish-wise breakdown
    const daysBack = 30;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (daysBack - 1));

    try {
      const byDayAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalProductsSold: { $sum: '$items.quantity' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // build a map for quick lookup
      const byDayMap = {};
      byDayAgg.forEach(d => {
        const yyyy = d._id.year;
        const mm = String(d._id.month).padStart(2, '0');
        const dd = String(d._id.day).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        byDayMap[key] = d.totalProductsSold || 0;
      });

      // ensure continuous last-30-days array (include zeros)
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        salesByDay.push({ date: key, totalProductsSold: byDayMap[key] || 0 });
      }

      // find peak day
      if (salesByDay.length > 0) {
        const maxVal = Math.max(...salesByDay.map(s => s.totalProductsSold));
        peakDay = salesByDay.find(s => s.totalProductsSold === maxVal) || salesByDay[0];
      }
    } catch (err) {
      console.error('Error computing salesByDay:', err.message);
      salesByDay = [];
      peakDay = null;
    }

    let recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    let recentOrdersData = recentOrders.map(order => ({
      id: order._id,
      tokenNumber: order.tokenNumber,
      userName: order.user?.name || 'Guest',
      userEmail: order.user?.email || 'N/A',
      date: order.createdAt,
      total: order.totalAmount,
      status: order.orderStatus,
      itemsCount: order.items?.length || 0,
      deliveryType: order.deliveryType
    }));

    let topProducts = await Product.find()
      .sort({ numReviews: -1 })
      .limit(5);

    // Dish-wise breakdown - organized by PRODUCT (not by day)
    let productDailySales = [];
    let topSellingProducts = [];

    try {
      // Get all products to ensure they all appear in the explorer
      const allProductsData = await Product.find({}, 'name price category');
      const productMap = {};

      allProductsData.forEach(p => {
        productMap[p._id.toString()] = {
          productId: p._id.toString(),
          productName: p.name,
          price: p.price,
          totalQuantity: 0,
          totalRevenue: 0,
          dailyBreakdown: {}
        };
      });

      // Get all products sold in last 30 days with their daily breakdown
      const productSalesAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              foodId: '$items.foodId',
              foodName: '$items.foodName' || 'Unknown',
              date: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              }
            },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            price: { $first: '$items.price' }
          }
        }
      ]);

      // Populate productMap with aggregation data
      productSalesAgg.forEach(item => {
        const productId = item._id.foodId.toString();
        const yyyy = item._id.date.year;
        const mm = String(item._id.date.month).padStart(2, '0');
        const dd = String(item._id.date.day).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;

        if (productMap[productId]) {
          productMap[productId].dailyBreakdown[dateKey] = {
            quantity: item.quantity,
            revenue: Number((item.revenue || 0).toFixed(2))
          };

          productMap[productId].totalQuantity += item.quantity;
          productMap[productId].totalRevenue += item.revenue || 0;

          // Update price from order items if available
          if (item.price) productMap[productId].price = item.price;
        }
      });

      // Convert to array and sort by total quantity
      productDailySales = Object.values(productMap)
        .map(product => ({
          productId: product.productId,
          productName: product.productName,
          price: product.price,
          totalQuantity: product.totalQuantity,
          totalRevenue: Number((product.totalRevenue).toFixed(2)),
          dailyBreakdown: product.dailyBreakdown // { "2026-01-05": {quantity, revenue}, ... }
        }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity);

      // Get top 10 selling products
      topSellingProducts = productDailySales.slice(0, 10).map(p => ({
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalRevenue: p.totalRevenue,
        price: p.price
      }));

    } catch (err) {
      console.error('Error computing product-wise daily sales:', err.message);
      productDailySales = [];
      topSellingProducts = [];
    }

    const analyticsData = {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      salesByMonth,
      salesByDay,
      peakDay,
      productDailySales,
      topSellingProducts,
      salesByCategory,
      recentOrders: recentOrdersData,
      topProducts: topProducts.map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        rating: product.rating || 5, // Food court items usually start fresh
        totalSales: product.numReviews || 0,
        stock: product.stock || 0,
        category: product.category || 'other'
      })),
      userMetrics: {
        adminCount: await User.countDocuments({ role: 'admin' }),
        regularUserCount: await User.countDocuments({ role: 'user' }),
        newUsersThisMonth: await User.countDocuments({
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }),
        averageOrdersPerUser: totalUsers > 0 ? (totalOrders / totalUsers).toFixed(2) : 0,
        activeUsersToday: await User.countDocuments({
          updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        usersWithOrders: await Order.distinct('user').then(users => users.length),
        usersWithoutOrders: totalUsers - (await Order.distinct('user').then(users => users.length))
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/daily/:date
// Get dish-wise sales for a specific date
router.get('/daily/:date', async (req, res) => {
  try {
    const { date } = req.params; // Expected format: YYYY-MM-DD

    // Parse the date and create start/end boundaries
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Aggregate dish-wise sales for the selected day
    const dishWiseSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dayStart, $lt: dayEnd }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            foodId: '$items.foodId',
            foodName: '$items.foodName'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          price: { $first: '$items.price' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Calculate peak dish (highest revenue)
    let peakDish = null;
    if (dishWiseSales.length > 0) {
      peakDish = {
        foodId: dishWiseSales[0]._id.foodId,
        foodName: dishWiseSales[0]._id.foodName,
        totalQuantity: dishWiseSales[0].totalQuantity,
        totalRevenue: Number((dishWiseSales[0].totalRevenue || 0).toFixed(2)),
        price: dishWiseSales[0].price
      };
    }

    // Format response with peak highlighting
    const dishes = dishWiseSales.map((dish, index) => ({
      rank: index + 1,
      foodId: dish._id.foodId,
      foodName: dish._id.foodName,
      totalQuantity: dish.totalQuantity,
      price: dish.price || 0,
      totalRevenue: Number((dish.totalRevenue || 0).toFixed(2)),
      orderCount: dish.orderCount,
      isPeak: index === 0 // First item (highest revenue) is peak
    }));

    // Calculate totals for the day
    const dayTotals = {
      totalDishes: dishes.length,
      totalQuantity: dishes.reduce((sum, d) => sum + d.totalQuantity, 0),
      totalRevenue: dishes.reduce((sum, d) => sum + d.totalRevenue, 0),
      averageRevenuePerDish: dishes.length > 0
        ? Number((dishes.reduce((sum, d) => sum + d.totalRevenue, 0) / dishes.length).toFixed(2))
        : 0
    };

    res.json({
      success: true,
      data: {
        date: date,
        peakDish,
        dishes,
        dayTotals,
        timestamp: new Date(dayStart).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    });
  } catch (error) {
    console.error('❌ Daily analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily analytics',
      error: error.message
    });
  }
});

// POST /api/analytics/generate-demo-data
// Generate demo orders for testing (today's date)
router.post('/generate-demo-data', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get some products
    const products = await Product.find({}).limit(10);
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products found in database'
      });
    }

    // Get a user
    const user = await User.findOne({});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No users found in database'
      });
    }

    // Generate 5-8 demo orders for today with varied items
    const demoOrders = [];
    const dishNames = ['Biryani', 'Dosa', 'Samosa', 'Idli', 'Gulab Jamun', 'Chai', 'Pani Puri', 'Lassi'];
    const prices = [100, 40, 30, 30, 40, 20, 30, 50];

    for (let i = 0; i < 6; i++) {
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const randomIdx = Math.floor(Math.random() * dishNames.length);
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
        const price = prices[randomIdx];
        const revenue = quantity * price;

        items.push({
          foodId: products[randomIdx % products.length]._id,
          foodName: dishNames[randomIdx],
          price,
          quantity,
          image: products[randomIdx % products.length].image || ''
        });

        totalAmount += revenue;
      }

      const randomTime = new Date(today);
      randomTime.setHours(
        Math.floor(Math.random() * 4) + 11, // 11 AM - 3 PM
        Math.floor(Math.random() * 60),
        0
      );

      demoOrders.push({
        user: user._id,
        items,
        totalAmount,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: randomTime
      });
    }

    // Insert demo orders
    await Order.insertMany(demoOrders);

    res.json({
      success: true,
      message: `✅ Created ${demoOrders.length} demo orders for today`,
      orderCount: demoOrders.length
    });
  } catch (error) {
    console.error('❌ Demo data generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating demo data',
      error: error.message
    });
  }
});

module.exports = router;