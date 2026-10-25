const express = require('express');
const router = express.Router();
const userModel = require("../models/users");
const joi = require('joi');
const bcrypt = require('bcrypt');
const {generateToken} = require("../utils/generateToken");
const {registerUser , loginUser , logout} = require("../controllers/authControllers");
const isLoggedIn = require('../middlewares/isLoggedIn');
const wrap = require("../utils/asyncHandler");
const productModel = require("../models/product");

// Passport for Google OAuth
const passport = require('passport');

router.get('/' , (req,res) => {
    res.send("Hey!");
});
router.post("/register", wrap(registerUser));

router.post("/login" , wrap(loginUser));

router.get("/logout" , logout);

// router.get("/addtocart/:id" , isLoggedIn , async function(req , res){
//     try {
//         let productId = req.params.id;
//         let product = await productModel.findOne({ _id: productId });

//         if (!product) {
//             return res.status(404).send("Product not found");
//         }

//         res.render("cart", { product });
//     } catch (error) {
//         console.error("Error fetching product:", error);
//         res.status(500).send("Internal Server Error");
//     }
// });

// Add product to the logged-in user's cart
router.post('/addtocart/:id', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productModel.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('back');
        }

        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/main');
        }

        user.cart = user.cart || [];
        // avoid duplicates
        const exists = user.cart.some(id => String(id) === String(product._id));
        if (!exists) {
            user.cart.push(product._id);
            await user.save();
        }
        // background request from public/javascripts/cart.js: no flash, or it would resurface on the next page load
        if (req.accepts(['html', 'json']) === 'json') {
            return res.json({ added: !exists, cartCount: user.cart.length });
        }
        req.flash('success', exists ? 'Product is already in cart' : 'Product added to cart');
        return res.redirect('/shop');
    } catch (err) {
        console.error('Add to cart error:', err);
        req.flash('error', 'Could not add product to cart');
        return res.redirect('back');
    }
});

// Remove a product from the logged-in user's cart
router.post('/cart/remove/:id', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.id;
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/main');
        }

        user.cart = (user.cart || []).filter(id => String(id) !== String(productId));
        await user.save();
        req.flash('success', 'Item removed from cart');
        return res.redirect('/cart');
    } catch (err) {
        console.error('Remove from cart error:', err);
        req.flash('error', 'Could not remove item from cart');
        return res.redirect('back');
    }
});

// Start Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/main' }),
    (req, res) => {
        // On successful authentication, create a JWT token and set cookie so existing middleware works
        try {
            const token = generateToken(req.user);
            const cookieOptions = {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production'
            };
            res.cookie('token', token, cookieOptions);
            res.redirect('/');
        } catch (err) {
            console.error('Google auth callback error:', err);
            res.redirect('/main');
        }
    }
);

router.get("/orders", isLoggedIn, async (req,res) => {
    try{
        const user = await userModel.findOne({email : req.user.email}).populate("orders");
        // newest first; skip products the owner has since deleted (populate leaves null)
        res.render("orders", {orders : user.orders.filter(Boolean).reverse()});
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.redirect('/main');
    }
});

module.exports = router;