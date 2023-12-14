const http = require('node:http');
const express = require('express');
const io = require('socket.io')(http);
const cors = require('cors');
const Pusher = require('pusher');
const mongo = require('mongoose');
const morgan = require('morgan');

require("dotenv/config");

const port = process.env.PORT;
const hostname = process.env.HOSTNAME;
const app = express();
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Server has connected!\n');
});

// DB for mongoose
mongo.connect('mongodb+srv://admin:oAjfmReZD8xwvPhB@cluster0.qmtqdg4.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

//Routes
app.use('/users', require('./routes/UserRoute.cjs'));
app.use('/chat', require('./routes/MessageRoute.cjs'));


// Models
const MessageModel = require("./models/MessageModel");
const UserModel = require("./models/UserModel");
const RoomModel = require("./models/RoomModel");
// const { users } = require("./controllers/UserController");

let messages = [];
let users = [];

const toggleUserIsOnline = (user) => {
  if (user) {
    const foundUser = users.find((u) => u._id.toString() === user._id.toString());
    const index = users.indexOf(foundUser);
  
    if (index !== -1) {
      users[index].isOnline = !users[index].isOnline;
    } else {
      console.log('User Error !');
    }
  } else {
    console.log('Invalid user !');
  }
};

const fetchMessages = async (messageFrom, messageTo) => {
  const messages = await MessageModel.find({
    $or: [
      { messageTo: messageTo, messageFrom: messageFrom },
      { messageTo: messageFrom, messageFrom: messageTo },
    ],
  });

  return messages;
};

io.on("connection", async (socket) => {
  //Logged-in users
  // let users = await UserModel.find();
  UserModel.find().select('username + isOnline + socket + name + surname + dateCreated')
    .then((data) => {
      users = data;
    });
  const rooms = await RoomModel.find();
 
  socket.emit('loggedIn', ({
    socket: socket.id,
    users,
    rooms,
  }));

  //New User joined
  socket.on("newUser", async (user) => {
    console.log(`${user.username} connected.`);

    await UserModel.updateOne({_id: user._id}, { $set: {socket: socket.id, isOnline: true }});

    toggleUserIsOnline(user);
    io.emit('usersChanged', (users));
  });

  //User Disconnect
  socket.on("disconnect", async (err) => {
    const user = await UserModel.findOne({socket: socket.id});
    
    if(user) {
      await UserModel.updateOne({_id: user._id}, { $set: {socket: null, isOnline: false }});
      console.log(`${user.username} disconnected.`);

      toggleUserIsOnline(user);
      io.emit('usersChanged', (users));
    }
  });

  // Create Room
  socket.on('createRoom', async (data) => {    
    const room = new RoomModel({
      title: data.title,
      description: data.description,
      dateCreated: Date.now(),
      createdBy: data.createdBy,
    });

    room.save((err, result) => {
      if (err) throw err;
    });
    const dbRooms = await RoomModel.find();
    io.emit('getRooms', (dbRooms));
  });

  // Join Room
  socket.on('joinRoom', async (data) => {
    await RoomModel.findById((data.roomId), async (err, result) => {
      if (err) throw err;
      
      if (!result.members.some((element) => { return element === data.username })) {
        result.members.push(data.username);
      }
      
      await result.save(async () => {
        if (err) throw err;
        const user = await UserModel.findOne({username: data.username});

        socket.join(data.roomId);
        // io.to(data.roomId).emit('userJoinedRoom', {
        //   user: user.username,
        //   room: result.title,
        // });
        const roomMessages = await MessageModel.find({ messageTo: data.roomTitle});
        io.to(data.roomId).emit("roomMessages", roomMessages);
      });
    });
  });

  // Private Chat
  socket.on("joinPM", async (params) => {
    const pmMessages = await MessageModel.find({
      $or: [{ messageTo: params.messageTo, messageFrom: params.messageFrom },
             { messageTo: params.messageFrom, messageFrom: params.messageTo }]});
   
    // fetchMessages(params.messageFrom, params.messageTo); TODO: Implement this method properly
    io.to(params.userSocket).emit("pmMessages", pmMessages);
  });

  // Join Global
  socket.on('joinGlobal', async () => {
    const globalMessages = await MessageModel.find({ messageTo: 'global' });
    io.emit('getGlobalMessages', globalMessages);
  });

  //Send message
  socket.on("sendMessage", async (data) => {
    const message = new MessageModel({
      ...data,
      dateSend: Date.now(),      
    });

    message.save((err, result) => {
      if (err) throw err;
      
      messages.push(result);
    });

    let socketId = await UserModel.findOne({ _id: data.messageTo });
    
    if (socketId) {
      socketId = socketId.socket;

      io.to(socketId).emit("getMessage", message);
    } else {
      const room = await RoomModel.findOne({ title: data.messageTo });

      if (room) {
        io.to(room._id).emit('getMessage', message);
      } else {
        io.emit('getMessage', message);
      }
    }
      //if there is a socket send only to that user
    //   io.to(data.targetSocket).emit("getMessage", message);
    // } else if (data.messageTo === 'global') {
    //   //Logged-in users recieve message
    //   socket.broadcast.emit("getMessage", message);
    // }
  });
  
  socket.on("messageFeedback", async (data) => {
    await MessageModel.updateOne({_id: data.messageId}, { $set: { dateRead: data.dateRead }});
  });
});






server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});