const express = require('express');
const router = require('express-promise-router')();
const MessageModel = require('../models/MessageModel');

  router.get('/', async (req, res) => {
    try {
      const messages = await MessageModel.find();
      res.json(messages);
    } catch (error) {
      res.json({message: error});
    }
  });

  router.post('/', async (req, res) => {
    const message = new MessageModel({
      content: req.body.content,
      messageTo: req.body.messageTo,
      messageFrom: req.body.messageFrom,
    });

  message.save()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
  });

  router.get('/:roomName', async (req, res) => {
    try {
      const roomMessages = await MessageModel.find({ messageTo: req.params.roomName })
      res.json(roomMessages);      
    } catch (error) {
      res.json({ message: error })
    }
  });
module.exports = router;