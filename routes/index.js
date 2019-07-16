/* eslint-disable require-jsdoc */
const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const passport = require('passport');
const User = require('../models/user.js');
let recoverUser;
let userList;

// ensure authentication -- jugaari
function isLoggedIn(req, res, next) {
  if (req.session.user === undefined || req.session.user === '') {
    res.redirect('/login');
  } else {
    return next();
  }
}

// Main Application
router.get('/', isLoggedIn, function(req, res) {
  User.find(function(err, doc) {
    userList = doc;
    res.render('app', {
      users: userList, style: true,
      app: 'active', username: req.session.user.username,
    });
  });
});

// Login routes
router.get('/login', function(req, res) {
  if (req.session.user === undefined || req.session.user === '') {
    res.render('login', {
      login: 'active',
      message: 'Please log in to continue',
    });
  } else {
    res.redirect('/');
  }
});

router.post('/login', function(req, res) {
  passport.authenticate('local')(req, res, function() {
    req.session.user = req.user;
    res.redirect('/');
  });
});

// Register routes
router.get('/register', function(req, res) {
  res.render('register', {register: 'active'});
});

router.post('/register', function(req, res) {
  User.findOne({username: req.body.username}, function(err, doc) {
    if (doc) {
      res.render('register', {
        register: 'active',
        message: 'Username already exists.Please choose another',
      });
    } else {
      User.register(new User({
        username: req.body.username, secretQues: req.body.secretQues,
        secretAns: req.body.secretAns}), req.body.password, function(err) {
        if (err) {
          res.render('register', {
            register: 'active',
            message: 'There was some error. Please try again',
          });
        }
        passport.authenticate('local')(req, res, function() {
          res.redirect('/login');
        });
      });
    }
  });
});

// Forgot password
router.get('/recover', function(req, res) {
  res.render('recover', {recover: 'active', action: '/recover'});
});

router.post('/recover', function(req, res) {
  User.findOne({username: req.body.username}, function(err, doc) {
    if (!doc) {
      res.render('recover', {
        recover: 'active', action: '/recover',
        message: 'Username not found',
      });
    } else {
      recoverUser = doc.id;
      res.render('recover', {
        forgot: true, question: doc.secretQues,
        action: '/newpwd', user: doc.username, recover: 'active',
        disabled: 'disabled',
      });
    }
  });
});

router.post('/newpwd', function(req, res) {
  User.findById(recoverUser).then(function(doc) {
    if (req.body.secretAns == doc.secretAns) {
      doc.setPassword('12345', function() {
        doc.save();
        res.render('recover', {
          recover: 'active', hide: true,
          message: 'Your new password is 12345',
        });
      });
    } else {
      res.render('recover', {
        forgot: true, question: doc.secretQues,
        action: '/newpwd', user: doc.username, recover: 'active',
        disabled: 'disabled',
        message: 'Incorrect Answer. Try Again',
      });
    }
  }, function(err) {
    console.error(err);
  });
});

// Logout

router.get('/logout', function(req, res) {
  async function logout() {
    req.session.user = '';
    await res.redirect('/');
  }
  logout();
});


module.exports = router;
