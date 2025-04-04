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

app.use(session({
    resave: false,
    saveUninitialized: false,   
    secret : "kjdshfkjfhdf"
  }));
app.use(flash());
 
require("dotenv").config();

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname , "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended : true}));

app.use("/" , indexRouter);
app.use("/owners", ownerRouter);
app.use("/products", productRouter);
app.use("/users" , userRouter);

app.listen(3000);