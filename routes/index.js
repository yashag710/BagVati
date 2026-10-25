const express = require('express');
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product");
const userModel = require("../models/users");
const wrap = require("../utils/asyncHandler");
const crypto = require("crypto");

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

router.get("/shop" , isLoggedIn , wrap(async function(req,res){
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
        }).populate("reviews.review.user", "fullname");
    }
    else{
        // populate nested review user references so templates can show reviewer names
        products = await productModel.find({}).populate('reviews.review.user', 'fullname');
    }
    // pass req.user explicitly so templates can reliably check authentication
    res.render("shop" , {products , success, user: req.user});
}));

router.get("/about" , isLoggedIn , function(req,res) {
    res.render("about");
});

router.get("/refund-policy", isLoggedIn, function(req, res) {
    res.render("refund-policy");
});

router.get("/terms", isLoggedIn, function(req, res) {
    res.render("terms");
});

router.get("/privacy-policy", isLoggedIn, function(req, res) {
    res.render("return-policy");
});

router.get("/cart" , isLoggedIn , wrap(async function(req,res){
    let user = await userModel
    .findOne({email : req.user.email})
    .populate("cart");
    res.render("cart", {user});
}));

router.get("/addtocart/:productid" , isLoggedIn , wrap(async function(req,res){
    let user = await userModel.findOne({ email : req.user.email});
    user.cart.push(req.params.productid);
    await user.save();
    req.flash("success", "Product added to cart");
    res.redirect("/shop");
}));

router.get("/checkout", isLoggedIn, wrap(async function(req,res){
    let user = await userModel.findOne({email : req.user.email});
    let products = await productModel.find({ _id: { $in: user.cart } });
    let coupon = "NEW50" || " ";
    let couponDiscount = products.map(p => p.price * 0.1).reduce((a, b) => a + b, 0); // Example: 10% discount on total
    res.render("checkout", {user, couponDiscount, coupon, products});
}))

// Same query and math checkout.ejs displays: (price - discount) per item,
// +₹20 platform fee, -10% NEW50 coupon on prices. Never trust an amount from the client.
async function cartTotal(user){
    let products = await productModel.find({ _id: { $in: user.cart } });
    let total = products.reduce((sum, p) => sum + (p.price || 0) - (p.discount || 0) - (p.price || 0) * 0.1, 0) + 20;
    return { products, total: Math.round(total * 100) / 100 };
}

const PAYMENT_METHODS = { upi: "UPI", credit: "Credit Card", debit: "Debit Card", netbanking: "Net Banking", cod: "Cash on Delivery" };

router.get("/payment", isLoggedIn, wrap(async function(req, res){
    let user = await userModel.findOne({email : req.user.email});
    let { products, total } = await cartTotal(user);
    if (!products.length) return res.redirect("/cart");
    res.render("payment", {amount : total});
}));

// ponytail: demo gateway, nothing is charged. Swap in Razorpay/Stripe here for real payments.
router.post("/payment/process", isLoggedIn, wrap(async function(req, res){
    let user = await userModel.findOne({email : req.user.email});
    let { products, total } = await cartTotal(user);
    if (!products.length) return res.redirect("/cart");
    let methodKey = req.body.paymentMethod;
    if (!Object.hasOwn(PAYMENT_METHODS, methodKey)) return res.redirect("/payment");

    if (!user.orders) user.orders = [];
    // Add all cart items to orders
    user.orders = user.orders.concat(user.cart);
    // Clear the cart
    user.cart = [];
    await user.save();

    // receipt for the success page; shown once
    req.flash("payment", {
        method : PAYMENT_METHODS[methodKey],
        cod : methodKey === "cod",
        detail : String(req.body.detail || "").slice(0, 40), // masked card / UPI id / bank, set by the page
        amount : total,
        txnId : "BVTEST-" + crypto.randomBytes(4).toString("hex").toUpperCase()
    });
    res.redirect("/payment_success");
}));

router.get("/payment_success", isLoggedIn, function(req, res){
    let [receipt] = req.flash("payment");
    res.render("payment_success", {receipt});
});

module.exports = router;