const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get or create a conversation between participants
// @route   POST /api/v1/conversations
// @access  Private
exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      companyId: req.user.companyId,
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        companyId: req.user.companyId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation initialized',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for currently authenticated user
// @route   GET /api/v1/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      companyId: req.user.companyId,
      participants: req.user._id
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved',
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages inside a conversation
// @route   GET /api/v1/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a participant in this conversation'
      });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Messages retrieved',
      data: messages
    });
  } catch (error) {
    next(error);
  }
};
