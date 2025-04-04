const express = require('express');
const router = express.Router();
const userModel = require("../models/users");
const joi = require('joi');
const bcrypt = require('bcrypt');
const {generateToken} = require("../utils/generateToken");
const {registerUser , loginUser , logout} = require("../controllers/authControllers");
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require("../models/product");

router.get('/' , (req,res) => {
    res.send("Hey!");
});
router.post("/register", registerUser);

router.post("/login" , loginUser);

router.get("/logout" , logout);

router.get("/addtocart/:id" , isLoggedIn , async function(req , res){
    try {
        let productId = req.params.id;
        let product = await productModel.findOne({ _id: productId });

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("cart", { product });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;