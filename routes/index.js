const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product");
const userModel = require("../models/users");
const { func } = require('joi');

router.get('/' , function(req,res){
    let error = req.flash("error");
    // pass current user (if any) so header can render correctly
    console.log(res.locals.user);
    res.render("home" , { error, loggedIn: false, user: res.locals.user, owner: res.locals.owner });
});

router.get('/main' , function(req,res){
    let error = req.flash("error");
    // ensure templates can check `user` as well
    res.render("index" , { error, loggedIn: false, user: res.locals.user, owner : res.locals.owner });
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
        }).populate("reviews.review.user");
    }
    else{
        // populate nested review user references so templates can show reviewer names
        products = await productModel.find({}).populate('reviews.review.user');
    }
    // pass req.user explicitly so templates can reliably check authentication
    res.render("shop" , {products , success, user: req.user});
});

router.get("/about" , isLoggedIn , function(req,res) {
    res.render("about");
});

router.get("/refund-policy", isLoggedIn, function(req, res) {
    res.render("refund-policy");
});

router.get("/terms", isLoggedIn, function(req, res) {
    res.render("terms");
});

router.get("/return-policy", isLoggedIn, function(req, res) {
    res.render("return-policy");
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

router.get("/checkout", isLoggedIn, async function(req,res){
    let user = await userModel.findOne({email : req.user.email});
    let products = await productModel.find({ _id: { $in: user.cart } });
    let coupon = "NEW50" || " ";
    let couponDiscount = products.map(p => p.price * 0.1).reduce((a, b) => a + b, 0); // Example: 10% discount on total
    res.render("checkout", {user, couponDiscount, coupon, products});
})

router.get("/payment", isLoggedIn, async function(req, res){
    const amount = req.query.amount || 0;
    res.render("payment", {amount});

})

router.post("/payment/process", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({email : req.user.email});
    if (!user.orders) user.orders = [];
    // Add all cart items to orders
    user.orders = user.orders.concat(user.cart);
    // Clear the cart
    user.cart = [];
    await user.save();
    res.redirect("/payment_success");
});

router.get("/payment_success", isLoggedIn, function(req, res){
    res.render("payment_success");
});

module.exports = router;