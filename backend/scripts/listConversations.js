const mongoose = require('mongoose');
require('dotenv').config();

const SupportConversation = require('../models/SupportConversation');

async function listConversations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soldyshop');
    
    const conversations = await SupportConversation.find({})
      .populate('user', 'name email avatar')
      .sort({ lastMessageAt: -1 })
      .limit(10);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('CONVERSATIONS LIST - Users Who Texted Admin');
    console.log('═══════════════════════════════════════════════════════\n');

    if (conversations.length === 0) {
      console.log('No conversations found yet.\n');
    } else {
      conversations.forEach((conv, index) => {
        const user = conv.user;
        const lastMsg = conv.messages[conv.messages.length - 1] || null;
        console.log(`${index + 1}. ${user?.name || 'Unknown'}`);
        console.log(`   Email: ${user?.email || 'N/A'}`);
        console.log(`   Messages: ${conv.messages.length}`);
        console.log(`   Last Message: ${lastMsg?.text?.substring(0, 50) || 'N/A'}${lastMsg?.text?.length > 50 ? '...' : ''}`);
        console.log(`   Status: ${conv.status}`);
        console.log(`   Admin Unread: ${conv.adminUnreadCount}\n`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listConversations();
