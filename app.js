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
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 // 1 day (optional)
  }
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
      // match id too: a user account can be registered with the owner's email
      const owner = await ownerModel.findOne({ _id : decoded.id, email : decoded.email });

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

// Health / keep-alive endpoint (also used as Render's health check path).
// no-store so no proxy or CDN answers it from cache and skips the real server.
app.get('/ping', (req, res) => {
  res.set('Cache-Control', 'no-store').status(200).send('pong');
});

app.use((req, res) => {
  res.status(404).render("errorPage", { title: "Page not found", message: "This page doesn't exist.", redirect: "/" });
});

app.use((err, req, res, next) => {
  // a malformed id in the URL (e.g. /products/edit/xyz) is a missing page, not a server fault
  const notFound = err.name === "CastError";
  if (!notFound) console.error(err);
  if (res.headersSent) return next(err);
  res.status(notFound ? 404 : 500).render("errorPage", {
    title: notFound ? "Page not found" : "Something went wrong",
    message: notFound ? "This page doesn't exist." : "Please try again in a moment.",
    redirect: "/"
  });
});

// Keep-alive: hosts like Render's free tier put the service to sleep after 15 min with no
// inbound traffic. The ping must go to the PUBLIC url and back through the host's proxy;
// a request to localhost never leaves the machine, so it doesn't count.
// Render sets RENDER_EXTERNAL_URL automatically; KEEP_ALIVE_URL works on any other host.
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
if (KEEP_ALIVE_URL) {
  const pingUrl = new URL('/ping', KEEP_ALIVE_URL).href;
  setInterval(() => {
    fetch(pingUrl).catch((err) => console.error('Keep-alive ping failed:', err.message));
  }, 1000 * 60 * 10); // every 10 min, inside the 15 min idle window
  console.log(`Keep-alive pinging ${pingUrl} every 10 minutes`);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});