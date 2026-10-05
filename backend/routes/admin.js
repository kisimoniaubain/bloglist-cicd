const express = require('express');
const router = express.Router();
const { getDashboardStats, getNewCounts, getUsers, toggleUserStatus, setUserRole } = require('../controllers/adminController');
const {
	listSupportConversations,
	getSupportConversationById,
	replyToSupportConversation,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/new-counts', getNewCounts);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/role', setUserRole);
router.get('/messages', listSupportConversations);
router.get('/messages/:id', getSupportConversationById);
router.post('/messages/:id/reply', replyToSupportConversation);

module.exports = router;
