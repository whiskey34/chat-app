const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const { ExtractJwt } = require('passport-jwt');
const { JWT_SECRET } = require('./configuration/index.cjs');
const User = require('./models/UserModel')

//JWT STRAGEY
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: JWT_SECRET
}, async (payload, done) => {
  try {
    // Find the user specified in token
    const user = await User.findById(payload.sub);

    // If user doesnt exist handle it
    if (!user) {
      return done(null, false);
    }

    // Otherwise return user
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

//LOCAL STRATEGY
passport.use(new LocalStrategy({
  usernameField: 'username', //coming from user model default is 'username'
}, async (username, password, done) => {
  try {
    // Find user given username
    user = await User.findOne({ username })
  
    // If not handle
    if (!user) {
      return done(null, false);
    }
  
    // Check is password correct
    const isMatch = await user.isValidPassword(password);
    
    // If not handle 
    if (!isMatch) {
      return done(null, false);
    }
    // Otherwise return user
    done(null, user);
  } catch (error) {
    done(error, false);  
  }
}));