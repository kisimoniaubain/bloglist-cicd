const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ['user', 'admin'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const supportConversationSchema = new mongoose.Schema(
  {
    // One support thread per user to guarantee strict conversation separation.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    messages: [supportMessageSchema],
    userUnreadCount: { type: Number, default: 0 },
    adminUnreadCount: { type: Number, default: 0 },
    userLastReadAt: { type: Date, default: new Date(0) },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

supportConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
