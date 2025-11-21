 require("dotenv").config();
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require("./config/mongoose-connection");
const session = require("express-session");
const flash = require("connect-flash");
const indexRouter = require("./routes/index");
const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(session({
  secret: "kjdshfkjfhdf",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));

app.use(flash());

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname , "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended : true}));

app.use("/" , indexRouter);
app.use("/owners", ownerRouter);
app.use("/products", productRouter);
app.use("/users" , userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});