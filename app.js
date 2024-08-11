const express = require('express');
const app = express();
const path = require('path');
const cookirParser = require('cookie-parser');
const db = require("./config/mongoose-connection");

const ownerRouter = require("./routes/ownerRouter");
const productRouter = require("./routes/productRouter");
const userRouter = require("./routes/userRouter");

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname , "public")));
app.use(cookirParser());
app.use(express.urlencoded({ extended : true}));

app.use("/owners", ownerRouter);
app.use("/products", productRouter);
app.use("/users" , userRouter);

app.listen(3000);