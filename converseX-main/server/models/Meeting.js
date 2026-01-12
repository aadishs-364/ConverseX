// ==============================================
// MEETING MODEL - For scheduling and managing meetings
// ==============================================

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // Meeting title
  title: {
    type: String,
    required: true,
    trim: true,
  },
  
  // Meeting description
  description: {
    type: String,
    default: '',
  },
  
  // Community this meeting belongs to
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  
  // Channel where meeting was scheduled
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  
  // User who created the meeting
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Meeting start time
  startTime: {
    type: Date,
    required: true,
  },
  
  // Meeting end time (optional)
  endTime: {
    type: Date,
  },

  // Reminder setting
  reminder: {
    type: String,
    enum: ['none', '5', '10', '15'],
    default: 'none',
  },
  
  // Meeting status
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  
  // Participants who have joined
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Meeting link/room ID
  meetingLink: {
    type: String,
  },
  
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
