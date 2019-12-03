const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
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
}