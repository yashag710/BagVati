const express = require('express');
const router = express.Router();
const userModel = require("../models/users");
const joi = require('joi');
const bcrypt = require('bcrypt');
const { generateToken } = require("../utils/generateToken");

module.exports.registerUser = async function(req,res){
    try{
        let present = await userModel.findOne({email : req.body.email});
        if(!present){
            let{email , fullname , password} = req.body;
            bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            if(err) return res.send(err.message);
            else{
                let user = await userModel.create({
                email, password : hash, fullname
                });
                let token = generateToken(user);
                res.cookie("token" , token);
                // Redirect after setting cookie so middleware on the next request
                // picks up the token and templates render the logged-in UI
                res.redirect('/shop');
            }
        });
    }); 
}
else {
    return res.status(401).send("User exists");
}     
    }
    catch(err){
        res.send(err.message);
    }
}

module.exports.loginUser = async function(req,res){
    let {email , password} = req.body;
    let user = await userModel.findOne({ email : email});
    if(!user){return res.status(404).send("User not found");
    }
    bcrypt.compare(password , user.password , function(err, result){
        if(result){
            let token = generateToken(user);
            res.cookie("token" , token);
            res.redirect("/shop");
        }
        else{
            return res.status(501).send("Incorrect credentials");
        }
    });
}

module.exports.logout = async function(req,res){
    res.cookie("token" , "");
    req.flash("error" , "Succesfully logged out");
    res.redirect("/");
}

