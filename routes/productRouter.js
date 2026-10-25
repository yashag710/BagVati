const express = require('express');
const router = express.Router();
const productModel = require("../models/product");
const isLoggedIn = require('../middlewares/isLoggedIn');
const isOwner = require('../middlewares/isOwner');
const wrap = require("../utils/asyncHandler");
const userModel = require("../models/users");
const users = require('../models/users');
const multer = require("multer");

const upload = multer({
    limits: {
        fieldSize: 25 * 1024 * 1024,   // 25MB for text fields
        fileSize: 10 * 1024 * 1024     // 10MB file upload limit
    }
});

// Add a review to a product
router.post('/:productid/review', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.productid;
        const { rating, comment } = req.body;
        const user = req.user; // set by isLoggedIn middleware

        if (!rating || !comment) {
            req.flash('error', 'Please provide rating and comment');
            return res.redirect('back');
        }

        const product = await productModel.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('back');
        }

        // Push review (matches schema: reviews: [{ review: { ... } }])
        product.reviews = product.reviews || [];
        product.reviews.push({
            review: {
                images: [],
                rating: Number(rating),
                comment,
                user: user ? user._id : null,
                createdAt: new Date()
            }
        });

        await product.save();
        req.flash('success', 'Review added successfully');
        res.redirect('back');
    } catch (err) {
        console.error('Error adding review:', err);
        req.flash('error', 'Could not add review');
        res.redirect('back');
    }
});

router.get('/' , (req,res) => {
    res.send("Hey!");
});

// router.post("/delete" , async function(req,res){
// })

router.get("/create" , isOwner , async(req,res) => {
    let success = req.flash("success");
    res.render("createproducts" ,{success});
});

router.post("/delete" , isOwner , async function(req, res) {
    try {
        const result = await productModel.deleteMany({});
        console.log(`${result.deletedCount} products deleted successfully`);
        res.redirect("back");
        
    } catch (error) {
        console.log("Error occured");
    }
});

router.get("/delete/:productid", isOwner, async function(req,res){
    try{
        let productid = req.params.productid;
        await productModel.findByIdAndDelete(productid);
        req.flash("success" , "Product deleted succesfully...");
        res.redirect("/owners/admin");
    }catch(error){
        console.error("Delete error:", error.message);
        req.flash("error", "Error occurred while deleting the product");
        res.redirect("/owners/admin");
    }
});

router.post("/create" , isOwner , upload.single("image") ,  async function(req,res){
  try{
    let { name,
        image, 
        price,
        discount, 
        bgcolor,
        panelcolor, 
        textcolor} = req.body;  
        const createdAt = new Date();  

        let product = await productModel.create({
            image : req.file.buffer, 
            name,
            price,
            discount, 
            bgcolor,
            panelcolor, 
            textcolor,
            createdAt
           });
        req.flash("success" , "Product created succesfully...");
        res.redirect("/owners/admin");
    } 
   catch(err){
    res.send(err.message);
   }
});

router.get("/edit/:productid", isOwner, wrap(async (req,res) => {
    let success = req.flash("success");
    let productid = req.params.productid;
    let product = await productModel.findOne({_id : productid});
    
    if (product.image && product.image.buffer) {
        product.imageBase64 = Buffer.from(product.image.buffer).toString("base64");
    }
    res.render("editproduct", {product, success});
}));

router.post("/edit/:productid", isOwner, upload.single("image"), wrap(async function(req,res){
    try{
        let productid = req.params.productid;
        let { name,
        image, 
        price,
        discount, 
        bgcolor,
        panelcolor, 
        textcolor} = req.body;  
        const createdAt = new Date();

        let updateData = {
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            createdAt
        };   

        const product = await productModel.findById(productid);
        Object.assign(product, updateData);
    
        if(req.file && req.file.buffer){
            product.image = req.file.buffer;
        }
        await product.save();
        req.flash("success" , "Product updated succesfully...");
        res.redirect("/owners/admin");

    }catch(error){
        res.status(400).send("Error occured while updating the product");
    }
}));

// Product detail page. Keep last: "/:productid" would otherwise swallow "/create".
router.get("/:productid", isLoggedIn, wrap(async (req, res, next) => {
    const product = await productModel.findById(req.params.productid).populate("reviews.review.user", "fullname");
    if (!product) return next(); // falls through to the 404 page

    const related = await productModel
        .find({ _id: { $ne: product._id } })
        .select("-reviews")
        .limit(4);
    const inCart = Boolean(req.user && (req.user.cart || []).some(id => String(id) === String(product._id)));

    res.render("product", {
        product,
        related,
        inCart,
        user: req.user,
        success: req.flash("success"),
        error: req.flash("error")
    });
}));

module.exports = router;