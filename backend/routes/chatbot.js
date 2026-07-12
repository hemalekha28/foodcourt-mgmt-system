const express = require('express');
const router = express.Router();
const { chat, health } = require('../controllers/chatbotController');

// @desc    Chat with AI assistant
// @route   POST /api/chatbot/chat
// @access  Public (works with or without auth)
router.post('/chat', chat);

// @desc    Health check for chatbot service
// @route   GET /api/chatbot/health
// @access  Public
router.get('/health', health);

module.exports = router;
