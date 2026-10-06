// ==============================================
// FILE MODEL - For file sharing in channels
// ==============================================

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  // Original filename
  filename: {
    type: String,
    required: true,
  },
  
  // File type/mimetype
  fileType: {
    type: String,
    required: true,
  },
  
  // File size in bytes
  fileSize: {
    type: Number,
    required: true,
  },
  
  // File URL or path
  fileUrl: {
    type: String,
    required: true,
  },
  
  // Channel where file was shared
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  
  // User who uploaded the file
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Optional description
  description: {
    type: String,
    default: '',
  },
  
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
