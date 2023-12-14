const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
    content:{
        type: String,
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    messageFrom: {
        type: String,
        required: true,
    },
    messageTo: {
        type: String,
        required: true,
    },
    dateSend: {
        type: Date,
        default: Date.now(),
    },
    dateReceived: {
        type: Date,
        default: null,
    },
    dateRead: {
        type: Date,
        default: null,
    },
})

module.exports = mongoose.model('message', MessageSchema);