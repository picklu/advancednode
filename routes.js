const bcrypt = require('bcrypt');
const passport = require('passport');

const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};


module.exports = function (app, db) {

    app.route('/')
        .get((req, res) => {
            res.render(process.cwd() + '/views/pug/index',
                { title: 'Home page', message: 'Please login', showLogin: true, showRegistration: true });
        });

    app.route('/register')
        .post((req, res, next) => {
            db.collection('users').findOne({ username: req.body.username },
                (err, user) => {
                    if (err) {
                        next(err);
                    }
                    else if (user) {
                        res.redirect('/');
                    }
                    else {
                        const hash = bcrypt.hashSync(req.body.password, saltRounds);
                        db.collection('users').insertOne({
                            username: req.body.username,
                            password: hash,
                            authenticate: 'local'
                        }, (err, doc) => {
                            if (err) {
                                res.redirect('/');
                            }
                            else {
                                next(null, doc);
                            }
                        })
                    }
                })
        },
            passport.authenticate('local', { failureRedirect: '/' }),
            (req, res, next) => {
                res.redirect('/profile');
            }
        );

    app.route('/login')
        .post(passport.authenticate('local', { failureRedirect: '/' }),
            (req, res) => {
                res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
            });

    app.route('/profile')
        .get(ensureAuthenticated, (req, res) => {
            res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
        });

    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });

    app.route('/auth/github')
        .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
        .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
            res.redirect('/profile');
        });

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}