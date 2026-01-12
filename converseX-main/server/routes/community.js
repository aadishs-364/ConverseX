const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');

// Get all communities for current user
router.get('/', auth, async (req, res) => {
  try {
    const communities = await Community.find({ members: req.userId })
      .populate('owner', 'username avatar')
      .populate('channels', 'name type')
      .sort({ createdAt: -1 });
    res.json({ communities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific community
router.get('/:id', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('members', 'username avatar status')
      .populate('channels', 'name type description');
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is a member
    if (!community.members.some(member => member._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'You are not a member of this community' });
    }

    res.json({ community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new community
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, icon, isPublic } = req.body;

    const community = new Community({
      name,
      description,
      icon: icon || '🌐',
      owner: req.userId,
      members: [req.userId],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await community.save();

    // Add community to user's communities
    await User.findByIdAndUpdate(req.userId, {
      $push: { communities: community._id }
    });

    // Create a default general channel
    const defaultChannel = new Channel({
      name: 'general',
      description: 'General discussion',
      type: 'text',
      community: community._id
    });

    await defaultChannel.save();

    // Add channel to community
    community.channels.push(defaultChannel._id);
    await community.save();

    const populatedCommunity = await Community.findById(community._id)
      .populate('owner', 'username avatar')
      .populate('channels', 'name type description');

    res.status(201).json({
      message: 'Community created successfully',
      community: populatedCommunity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a community
router.post('/:id/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.isPublic) {
      return res.status(403).json({ error: 'This community is private' });
    }

    if (community.members.includes(req.userId)) {
      return res.status(400).json({ error: 'You are already a member' });
    }

    community.members.push(req.userId);
    await community.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { communities: community._id }
    });

    res.json({ message: 'Successfully joined the community' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave a community
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (community.owner.toString() === req.userId) {
      return res.status(400).json({ error: 'Owner cannot leave the community' });
    }

    community.members = community.members.filter(
      member => member.toString() !== req.userId
    );
    await community.save();

    await User.findByIdAndUpdate(req.userId, {
      $pull: { communities: community._id }
    });

    res.json({ message: 'Successfully left the community' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a community
router.delete('/:id', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (community.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the owner can delete this community' });
    }

    // Delete all channels in the community
    await Channel.deleteMany({ community: community._id });

    // Remove community from all members
    await User.updateMany(
      { communities: community._id },
      { $pull: { communities: community._id } }
    );

    await Community.findByIdAndDelete(req.params.id);

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
