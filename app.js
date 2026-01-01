const dotenv = require("dotenv").config();
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const userModel = require('./models/users');
const ownerModel = require('./models/owner');
const db = require("./config/mongoose-connection");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const indexRouter = require("./routes/index");
const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");

require("dotenv").config();
// Passport and GoogleOAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'your-mongodb-connection-string',
    collectionName: 'sessions'
  }),
  cookie: { secure: true } // set to true if using HTTPS
}));

app.use(flash());

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname , "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended : true}));

// Make authenticated user (if any) available to all views via res.locals.user
app.use(async (req, res, next) => {
  try {
    res.locals.user = null;
    res.locals.owner = null;
    if (req.cookies && req.cookies.token) {
      const decoded = jwt.verify(req.cookies.token, process.env.jwt_key);
      const user = await userModel.findOne({ email: decoded.email }).select('-password');
      const owner = await ownerModel.findOne({email : decoded.email});

      if(owner){
        res.locals.owner = owner;
        return next();
      }
      res.locals.user = user;
    }
  } catch (err) {
    res.locals.user = null;
  }
  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/users/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    // Use the userModel imported earlier
    let user = await userModel.findOne({ email });
    if (user) return done(null, user);

    // Create new user record
    user = await userModel.create({
      googleId: profile.id,
      name: profile.displayName,
      email,
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
    });

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Passport session serialization
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await userModel.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


app.use("/" , indexRouter);
// mount owner routes under /owners to match redirects and links across the app
app.use("/owners", ownerRouter);
app.use("/products", productRouter);
app.use("/users" , userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});