const mongoose = require('mongoose');
const product = require('./product');

const userSchema = mongoose.Schema({
    googleId : String,
    fullname : String,
    email : String,
    password : String,
    avatar : String,
    isOwner : {
        type : Boolean,
        default : false
    },
    cart :[{
        type : mongoose.Schema.Types.ObjectId,
        ref : "product"
    }],
    orders : [{
        type : mongoose.Schema.Types.ObjectId,
        default : [],
        ref : "product"
    }],
    contact : Number,
    picture : String,
    createdAt : {type : Date, default : Date.now()},
});

module.exports = mongoose.model("user" , userSchema);