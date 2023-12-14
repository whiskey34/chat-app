const mongoose = require('mongoose');

const RoomSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  members: {
    type: Array,
    default: [],
  },
  dateCreated: {
    type: Date,
    required: Date.now(),
  },
  createdBy: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('room', RoomSchema);