const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product");
const userModel = require("../models/users");
const { func } = require('joi');

router.get('/' , function(req,res){
    let error = req.flash("error");
    res.render("home" , {error , loggedIn : false});
});

router.get('/main' , function(req,res){
    let error = req.flash("error");
    res.render("index" , {error , loggedIn : false});
});

router.get("/contact", isLoggedIn , function(req , res){
    res.render("contact");
});

router.get("/shop" , isLoggedIn , async function(req,res){
    let sortby = req.query.sortby;
    console.log(sortby);
    let products;
    let success = req.flash("success");
    if(sortby == "newest"){
        const currentTime = new Date;
        products = await productModel.find({ $and: [
            { $expr: { $eq: [{ $year: "$createdAt" }, currentTime.getFullYear()] } }, // Match year
            { $expr: { 
                $and: [
                { $gte: [{ $month: "$createdAt" }, currentTime.getMonth()] }, // Match month range
                { $lte: [{ $month: "$createdAt" }, currentTime.getMonth() + 1] }
                ] 
            } 
            }
          ]
        });
    }
    else{
        products = await productModel.find({});
    }
    res.render("shop" , {products , success});
});

router.get("/about" , isLoggedIn , function(req,res) {
    res.render("about");
});

router.get("/cart" , isLoggedIn ,async function(req,res){
    let user = await userModel
    .findOne({email : req.user.email})
    .populate("cart");
    res.render("cart", {user});
});

router.get("/addtocart/:productid" , isLoggedIn , async function(req,res){
    let user = await userModel.findOne({ email : req.user.email});
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Product added to cart");
    res.redirect("/shop");
});

module.exports = router;