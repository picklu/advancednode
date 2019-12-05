const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
const ObjectID = require('mongodb').ObjectID;


module.exports = function (app, db) {
    // serialization and app.listen
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        db.collection('users').findOne(
            { _id: new ObjectID(id) },
            (err, doc) => {
                done(null, doc);
            }
        );
    });

    passport.use(new LocalStrategy(
        (username, password, done) => {
            db.collection('users').findOne({ username: username }, (err, user) => {
                console.log('User ' + username + ' attempted to log in.');
                if (err) { return done(err) }
                if (!user) { return done(null, false); }
                if (bcrypt.compareSync(password, user.password)) { return done(null, user); }
                return done(null, false);
            });
        }
    ));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    },
        (accessToken, refreshToken, profile, done) => {
            db.collection('users').findOne({ username: profile.username }, (err, user) => {
                console.log('User ' + profile.username + ' attempted to log in.');
                if (err) { return done(err) }
                if (!user) {
                    db.collection('users').insertOne({
                        username: profile.username,
                        authenticate: 'github'
                    }, (err, doc) => {
                        if (err) { return done(err); }
                        return done(null, doc.ops[0]);
                    })
                }
                return done(null, user);
            });
        })
    );
}