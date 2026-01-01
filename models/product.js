const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name : String,
    image : Buffer,
    price : Number,
    discount : {
        type : Number,
        default : 0 
    },
    reviews :[{
        review: {
            images : [Buffer],
            rating : Number,
            comment : String,
            user : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "user"
            },
            createdAt : {type : Date, default : Date.now()}
        }
    }],
    bgcolor : String,
    panelcolor : String,
    textcolor : String,
    createdAt : Date
}); 

module.exports = mongoose.model("product" , productSchema);