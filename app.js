// Express Generator Default Packages
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Session and Database
const session = require('express-session');
const mongoose = require('mongoose');
const uri = 'mongodb+srv://urooj:magic@classprojects-khowv.mongodb.net/Chatsapp?retryWrites=true&w=majority';
const MongoStore = require('connect-mongo')(session);

// Routes
const indexRouter = require('./routes/index');

// Passport and Strategy
const passport = require('passport');
const User = require('./models/user');

const app = express();

// Socket IO
const server = app.listen(3000);
const socket = require('socket.io');
const io = socket.listen(server);


// Connecting database
mongoose.set('useCreateIndex', true);
mongoose.connect(uri, {
  useNewUrlParser: true,
}).then(() => {
  console.log('Successfully connected to the database');
}).catch((err) => {
  console.log('Could not connect to the database. Exiting now...', err);
  process.exit();
});


// Middleware for making sessions.
app.use(session({
  secret: 'topSecret',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Passport initialization and sessions
app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Socket IO
let onlineUsers = [];
io.on('connection', (socket) => {
  io.sockets.emit('onlineUsers', onlineUsers);

  socket.on('newUser', (data) => {
    socket.broadcast.emit('newUser', data);
    console.log(`${data.sender} is online`);
    onlineUsers.push(data);
  });

  socket.on('chat', (data) => {
    io.sockets.emit('chat', data);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('pvtMsg', (data) => {
    io.sockets.to(`${data.sendTo}`).emit('pvtMsg', data);
  });

  socket.on('disconnect', (data) => {
    onlineUsers.forEach(function (user) {
      if (user.socketID == socket.id) {
        data = user.sender;
      }
    });
    socket.broadcast.emit('userLeft', data);
    console.log(`${data} is offline`);
    onlineUsers = onlineUsers.filter((user) => {
      return user.socketID != socket.id;
    });
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
