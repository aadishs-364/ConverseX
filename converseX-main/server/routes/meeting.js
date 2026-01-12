// ==============================================
// MEETING ROUTES - Handle meeting operations
// ==============================================

const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');

// CREATE a new meeting
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, community, channel, startTime, endTime } = req.body;
    
    const meeting = new Meeting({
      title,
      description,
      community,
      channel,
      organizer: req.userId,
      startTime,
      endTime,
      meetingLink: `https://meet.conversex.com/${Date.now()}`, // Generate unique link
    });
    
    await meeting.save();
    await meeting.populate('organizer', 'username avatar');
    
    res.status(201).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// GET meetings by community
router.get('/community/:communityId', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ 
      community: req.params.communityId,
      status: { $in: ['scheduled', 'ongoing'] }
    })
      .populate('organizer', 'username avatar')
      .populate('channel', 'name')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// JOIN a meeting
router.post('/:meetingId/join', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Add user to participants if not already there
    if (!meeting.participants.includes(req.userId)) {
      meeting.participants.push(req.userId);
      
      // Update status to ongoing if it's the first participant
      if (meeting.status === 'scheduled') {
        meeting.status = 'ongoing';
      }
      
      await meeting.save();
    }
    
    res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// UPDATE meeting status
router.patch('/:meetingId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Only organizer can update meeting status
    if (meeting.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    meeting.status = status;
    await meeting.save();
    
    res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// DELETE a meeting
router.delete('/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Only organizer can delete meeting
    if (meeting.organizer.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Meeting.findByIdAndDelete(req.params.meetingId);
    
    res.json({
      success: true,
      message: 'Meeting deleted',
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

module.exports = router;
