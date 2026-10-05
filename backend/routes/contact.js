const express = require('express');
const router = express.Router();
const {
	sendContactMessage,
	getMySupportConversation,
	getMySupportUnreadCount,
	sendSupportMessage,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

router.post('/', sendContactMessage);
router.get('/chat/unread', protect, getMySupportUnreadCount);
router.get('/chat', protect, getMySupportConversation);
router.post('/chat', protect, sendSupportMessage);

module.exports = router;
