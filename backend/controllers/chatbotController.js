const OpenAI = require('openai');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Initialize OpenAI client lazily
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Get product information for context
const getProductContext = async () => {
  try {
    const products = await Product.find({}).limit(10).select('name price category stock');
    return products.map(product => ({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock
    }));
  } catch (error) {
    console.error('Error fetching products for context:', error);
    return [];
  }
};

// Get user's order information
const getUserOrderContext = async (userId) => {
  try {
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('_id status total createdAt products');
    
    return orders.map(order => ({
      orderId: order._id.toString().slice(-8),
      status: order.status,
      total: order.total,
      date: order.createdAt,
      itemCount: order.products.length
    }));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

// Chat endpoint
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get context data
    const [products, userOrders] = await Promise.all([
      getProductContext(),
      userId ? getUserOrderContext(userId) : []
    ]);

    // Create system prompt with e-commerce context
    const systemPrompt = `You are a helpful e-commerce customer service chatbot for an online store. 

STORE INFORMATION:
- Store Name: E-Commerce Store
- Payment Method: Cash on Delivery
- Shipping: 1-2 business days processing
- Return Policy: 30-day return policy for unused items

PRODUCTS AVAILABLE:
${products.map(p => `- ${p.name}: ₹${p.price} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`).join('\n')}

${userOrders.length > 0 ? `USER'S RECENT ORDERS:
${userOrders.map(o => `- Order #${o.orderId}: ${o.status} (₹${o.total}) - ${new Date(o.date).toLocaleDateString()}`).join('\n')}` : ''}

COMMON QUESTIONS TO HANDLE:
- Product prices and availability
- Order status and tracking
- Shipping information
- Return and refund policies
- General store policies

RESPONSE GUIDELINES:
- Be friendly and helpful
- Provide accurate information based on the context
- If you don't know something, say so politely
- Keep responses concise but informative
- Use ₹ symbol for prices
- For order status, refer to the user's recent orders if available

Answer the customer's question: "${message}"`;

    // Call OpenAI API
    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Handle missing API key
    if (error.message && error.message.includes('OPENAI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Chatbot service is not configured. Please contact support.'
      });
    }
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(503).json({
        success: false,
        message: 'Chatbot service temporarily unavailable. Please try again later.'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        success: false,
        message: 'Chatbot configuration error. Please contact support.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
};

// Health check endpoint
exports.health = async (req, res) => {
  try {
    // Test OpenAI connection
    const openaiClient = getOpenAIClient();
    await openaiClient.models.list();
    
    res.json({
      success: true,
      message: 'Chatbot service is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Handle missing API key
    if (error.message && error.message.includes('OPENAI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Chatbot service is not configured. Please set OPENAI_API_KEY environment variable.',
        error: 'Missing API key'
      });
    }
    
    res.status(503).json({
      success: false,
      message: 'Chatbot service is unavailable',
      error: error.message
    });
  }
};
