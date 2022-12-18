/*const LocalStrategy = require("passport-local").Strategy
const bcrypt = require ("bcrypt")
const Diary = require("./UserInfo/Info");
const Info = require("./UserInfo/TcInfo");
 function initialize(passport,getUserByEmail,getUserById){
  const authenticateUser = async (email,password,done)=>{
    const Users = Diary.find()
    console.log(Diary)
    if(Users == null){
      return done(null,false)
    }
    try{
      if (await bcrypt. compare(password,Diary.password)){
         return done(null,Users)
      }else {
        return done(null,false)
      }
    } catch(e){
      return done(e)
    }
  }
  passport.use(new LocalStrategy({usernameField:"email"}, authenticateUser))
  passport.serializeUser((gettinguser,done)=> done(null,Users.id))
  passport.deserializeUser((id,done)=>{
    return done(null,getUserById(id))})
}
module.exports= initialize
*/

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new localStrategy(function (username, password, done) {
	User.findOne({ username: username }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect username.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });

			return done(null, user);
		});
	});
}));

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/login');
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated()) return next();
	res.redirect('/');
}
