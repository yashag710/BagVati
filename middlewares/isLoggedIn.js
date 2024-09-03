const jwt = require("jsonwebtoken");
const flash = require("connect-flash");
const userModel = require("../models/users");

module.exports = async function(req,res,next){
    if(!req.cookies.token){
        req.flash("error" , "Login first");
        return res.redirect("/");
    }
    try{
        let decoded = jwt.verify(req.cookies.token, process.env.jwt_key);
        let user = await userModel
        .findOne({ email : decoded.email})
        .select("-password");
        req.user = user;
        
        next();
    }
    catch(err){
        req.flash("error","Unexpected error occured");
        res.redirect("/");
    }
}