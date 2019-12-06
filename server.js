'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;
const GitHubStrategy = require('passport-github').Strategy;

const auth = require('./auth');
const routes = require('./routes');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.route('/auth/github')
  .get(passport.authenticate('github'));

app.route('/auth/github/callback')
  .get(passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/profile');
    });

mongo.connect(process.env.DATABASE,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) {
      console.log('Database error: ' + err);
    }
    else {
      console.log('Successful database connection');

      const db = client.db('advancednode');

      auth(app, db);

      routes(app, db);

      passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: ''
      },
        function(accessToken, refreshToken, profile, cb) {
          console.log(profile);
          db.collection('socialusers').findAndModify(
        {id: profile.id},
        {},
        {$setOnInsert:{
          id: profile.id,
          name: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: profile.emails[0].value || 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },$set:{
          last_login: new Date()
        },$inc:{
          login_count: 1
        }},
        {upsert:true, new: true},
        (err, doc) => {
          return cb(null, doc.value);
        }
      );
        }
      ));

      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
    }
  });

