const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');

// Get messages for a channel
router.get('/channel/:channelId', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.find({ channel: channelId })
      .populate('author', 'username avatar status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { content, channelId, type } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const message = new Message({
      content: content.trim(),
      author: req.userId,
      channel: channelId,
      type: type || 'text'
    });

    await message.save();

    // Populate author information
    await message.populate('author', 'username avatar status');

    // Add message to channel
    channel.messages.push(message._id);
    await channel.save();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a message
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isOwner =
      message?.author?.toString?.() && req.userId?.toString &&
      message.author.toString() === req.userId.toString();

    if (!isOwner) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    message.content = content;
    message.isEdited = true;
    message.updatedAt = Date.now();
    await message.save();

    await message.populate('author', 'username avatar status');

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isOwner =
      message?.author?.toString?.() && req.userId?.toString &&
      message.author.toString() === req.userId.toString();

    if (!isOwner) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Remove message from channel
    await Channel.findByIdAndUpdate(message.channel, {
      $pull: { messages: message._id }
    });

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
