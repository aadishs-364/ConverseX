const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const Community = require('../models/Community');
const auth = require('../middleware/auth');

// Create a new channel in a community
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type, communityId } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is the owner or member
    if (community.owner.toString() !== req.userId && !community.members.includes(req.userId)) {
      return res.status(403).json({ error: 'You do not have permission to create channels' });
    }

    const channel = new Channel({
      name,
      description,
      type: type || 'text',
      community: communityId
    });

    await channel.save();

    community.channels.push(channel._id);
    await community.save();

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channels in a community
router.get('/community/:communityId', auth, async (req, res) => {
  try {
    const channels = await Channel.find({ community: req.params.communityId })
      .sort({ createdAt: 1 });
    res.json({ channels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific channel
router.get('/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('community', 'name members');
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a channel
router.delete('/:id', auth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const community = await Community.findById(channel.community);
    if (community.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the community owner can delete channels' });
    }

    // Remove channel from community
    await Community.findByIdAndUpdate(channel.community, {
      $pull: { channels: channel._id }
    });

    await Channel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
