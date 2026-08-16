const express = require('express');
const { createConversation, getConversations, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.route('/')
  .post(createConversation)
  .get(getConversations);

router.route('/:id/messages')
  .get(getMessages);

module.exports = router;
