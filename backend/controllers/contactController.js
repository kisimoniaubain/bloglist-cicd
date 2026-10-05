const asyncHandler = require('express-async-handler');
const { sendEmail } = require('../utils/email');
const SupportConversation = require('../models/SupportConversation');

const CONTACT_FORM_RECEIVER = process.env.CONTACT_FORM_RECEIVER || 'kisimoniaubain@gmail.com';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please fill in all contact form fields');
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  await sendEmail({
    to: CONTACT_FORM_RECEIVER,
    subject: `[SoldyHome Contact] ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
        <h2 style="margin:0 0 12px 0;color:#111827">New Get In Touch Message</h2>
        <p style="margin:0 0 8px 0"><strong>From:</strong> ${safeName}</p>
        <p style="margin:0 0 8px 0"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 12px 0"><strong>Subject:</strong> ${safeSubject}</p>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb">
          ${safeMessage}
        </div>
      </div>
    `,
  });

  res.status(200).json({ success: true, message: 'Message sent successfully' });
});

// @desc    Get current user's support conversation
// @route   GET /api/contact/chat
// @access  Private
const getMySupportConversation = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findOne({ user: req.user._id })
    .populate('messages.sender', 'name email role avatar')
    .populate('user', 'name email avatar');

  if (!conversation) {
    return res.status(200).json({
      success: true,
      conversation: {
        _id: null,
        user: req.user,
        status: 'open',
        userUnreadCount: 0,
        adminUnreadCount: 0,
        userLastReadAt: new Date(),
        messages: [],
      },
    });
  }

  const now = new Date();
  if (conversation.userUnreadCount > 0 || !conversation.userLastReadAt) {
    conversation.userUnreadCount = 0;
    conversation.userLastReadAt = now;
    await conversation.save();
  } else {
    conversation.userLastReadAt = now;
    await conversation.save();
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(req.user._id)}`).emit('support:unread', { unreadCount: 0 });
  }

  return res.status(200).json({ success: true, conversation });
});

// @desc    Get current user's unread support message count
// @route   GET /api/contact/chat/unread
// @access  Private
const getMySupportUnreadCount = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findOne({ user: req.user._id })
    .select('userUnreadCount userLastReadAt messages.senderType messages.createdAt');

  if (!conversation) {
    return res.status(200).json({ success: true, unreadCount: 0 });
  }

  let unreadCount = Number(conversation.userUnreadCount || 0);

  // Fallback for old records or mismatched counters.
  if (!Number.isFinite(unreadCount) || unreadCount < 0) unreadCount = 0;
  if (unreadCount === 0 && Array.isArray(conversation.messages) && conversation.messages.length) {
    const lastReadAt = conversation.userLastReadAt ? new Date(conversation.userLastReadAt) : new Date(0);
    unreadCount = conversation.messages.filter(
      (message) => message.senderType === 'admin' && new Date(message.createdAt) > lastReadAt
    ).length;
  }

  return res.status(200).json({
    success: true,
    unreadCount,
  });
});

// @desc    Send message to support as customer
// @route   POST /api/contact/chat
// @access  Private
const sendSupportMessage = asyncHandler(async (req, res) => {
  const text = String(req.body?.message || '').trim();
  if (!text) {
    res.status(400);
    throw new Error('Message cannot be empty');
  }

  let conversation = await SupportConversation.findOne({ user: req.user._id });

  if (!conversation) {
    conversation = await SupportConversation.create({ user: req.user._id, messages: [] });
  }

  conversation.messages.push({
    senderType: 'user',
    sender: req.user._id,
    text,
  });
  conversation.userUnreadCount = 0;
  conversation.adminUnreadCount = (conversation.adminUnreadCount || 0) + 1;
  conversation.userLastReadAt = new Date();
  conversation.lastMessageAt = new Date();
  conversation.status = 'open';
  await conversation.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(req.user._id)}`).emit('support:unread', { unreadCount: 0 });
    io.to('admin:support').emit('support:admin-unread', {
      conversationId: String(conversation._id),
      adminUnreadCount: conversation.adminUnreadCount,
    });
  }

  const hydrated = await SupportConversation.findById(conversation._id)
    .populate('messages.sender', 'name email role avatar')
    .populate('user', 'name email avatar');

  return res.status(201).json({ success: true, conversation: hydrated });
});

// @desc    Admin: list support conversations
// @route   GET /api/admin/messages
// @access  Private/Admin
const listSupportConversations = asyncHandler(async (req, res) => {
  const conversations = await SupportConversation.find({})
    .populate('user', 'name email avatar')
    .sort({ lastMessageAt: -1 });

  const summary = conversations.map((conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1] || null;
    return {
      _id: conversation._id,
      user: conversation.user,
      status: conversation.status,
      adminUnreadCount: conversation.adminUnreadCount || 0,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messages.length,
      lastMessage,
    };
  });

  return res.status(200).json({ success: true, conversations: summary });
});

// @desc    Admin: get one support conversation
// @route   GET /api/admin/messages/:id
// @access  Private/Admin
const getSupportConversationById = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id)
    .populate('messages.sender', 'name email role avatar')
    .populate('user', 'name email avatar');

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  if ((conversation.adminUnreadCount || 0) > 0) {
    conversation.adminUnreadCount = 0;
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to('admin:support').emit('support:admin-unread', {
        conversationId: String(conversation._id),
        adminUnreadCount: 0,
      });
    }
  }

  return res.status(200).json({ success: true, conversation });
});

// @desc    Admin: reply to support conversation
// @route   POST /api/admin/messages/:id/reply
// @access  Private/Admin
const replyToSupportConversation = asyncHandler(async (req, res) => {
  const text = String(req.body?.message || '').trim();
  if (!text) {
    res.status(400);
    throw new Error('Reply message cannot be empty');
  }

  const conversation = await SupportConversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  conversation.messages.push({
    senderType: 'admin',
    sender: req.user._id,
    text,
  });
  conversation.userUnreadCount = (conversation.userUnreadCount || 0) + 1;
  conversation.adminUnreadCount = 0;
  conversation.lastMessageAt = new Date();
  conversation.status = 'open';
  await conversation.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${String(conversation.user)}`).emit('support:unread', {
      unreadCount: conversation.userUnreadCount,
      conversationId: String(conversation._id),
    });
    io.to('admin:support').emit('support:admin-unread', {
      conversationId: String(conversation._id),
      adminUnreadCount: 0,
    });
  }

  const hydrated = await SupportConversation.findById(conversation._id)
    .populate('messages.sender', 'name email role avatar')
    .populate('user', 'name email avatar');

  return res.status(201).json({ success: true, conversation: hydrated });
});

module.exports = {
  sendContactMessage,
  getMySupportConversation,
  getMySupportUnreadCount,
  sendSupportMessage,
  listSupportConversations,
  getSupportConversationById,
  replyToSupportConversation,
};
