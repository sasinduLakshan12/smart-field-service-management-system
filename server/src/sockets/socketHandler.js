const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const activeUsers = new Map(); // Maps userId -> socketId

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Connected client: ${socket.id}`);

    // Map user to their socket connection
    socket.on('register_user', (userId) => {
      if (userId) {
        activeUsers.set(userId, socket.id);
        console.log(`Registered user session: User ${userId} -> Socket ${socket.id}`);
      }
    });

    // Join room for specific conversation thread
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
    });

    // Handle real-time chat message exchange
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, text, attachments } = data;

        // Save message to Database
        const message = await Message.create({
          conversationId,
          senderId,
          text,
          attachments
        });

        // Set lastMessage on Conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = message._id;
          await conversation.save();
        }

        // Broadcast message to room participants
        io.to(conversationId).emit('receive_message', message);
      } catch (err) {
        console.error('Socket message save error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Remove socket from active list
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`Deregistered user session: User ${userId}`);
          break;
        }
      }
    });
  });
};

// Utility to send push notifications to specific user if online
const sendNotification = (io, userId, event, data) => {
  const socketId = activeUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

module.exports = { socketHandler, sendNotification };
