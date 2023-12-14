const app = require('express')();
// const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origins: ['http://localhost:8080']
    }
});

require("dotenv/config");

const mongoose = require('mongoose');

const hostname = process.env.HOSTNAME;

// DB for mongoose
mongoose.connect(process.env.DB_CONN)
  .then(() => {
    console.log('Connected to MongoDB');
})
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});


// to parse requrest of content type- application/json
// app.use(app.json());
// app.use(app.urlencoded({extended: true}));

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log('token', token);
    next();
});

app.get('/', (req, res) => {
    res.send('<h1>Server Has Connected! ....</h1>');
});

// app.get('/tes', (req, res) => {
//     res.json({message: "this is tes site ..."});
// });

io.on('connection', (socket) => {
    

    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected! ...');
    });

    socket.on('my message', (msg) => {
        // console.log('message: ' + msg);
        io.emit('my broadcast', `server: ${msg}`);
      });

});



http.listen(5000, () => {
    console.log(`Listening http on ${hostname}:5000`);
})