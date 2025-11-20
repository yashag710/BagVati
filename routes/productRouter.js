const express = require('express');
const router = express.Router();
const productModel = require("../models/product");
const isLoggedIn = require('../middlewares/isLoggedIn');
const userModel = require("../models/users");
const users = require('../models/users');
const multer = require("multer");

const upload = multer({
    limits: {
        fieldSize: 25 * 1024 * 1024,   // 25MB for text fields
        fileSize: 10 * 1024 * 1024     // 10MB file upload limit
    }
});

router.get('/' , (req,res) => {
    res.send("Hey!");
});

// router.post("/delete" , async function(req,res){
// })

router.get("/create" , async(req,res) => {
    let success = req.flash("success");
    res.render("createproducts" ,{success});
});

router.post("/delete" , async function(req, res) {
    try {
        const result = await productModel.deleteMany({});
        console.log(`${result.deletedCount} products deleted successfully`);
        res.redirect("back");
        
    } catch (error) {
        console.log("Error occured");
    }
});

router.get("/delete/:productid", async function(req,res){
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

router.post("/create" , upload.single("image") ,  async function(req,res){
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

router.get("/edit/:productid", async (req,res) => {
    let success = req.flash("success");
    let productid = req.params.productid;
    let product = await productModel.findOne({_id : productid});
    
    if (product.image && product.image.buffer) {
        product.imageBase64 = Buffer.from(product.image.buffer).toString("base64");
    }
    console.log(product.imageBase64);
    res.render("editproduct", {product, success});
});

router.post("/edit/:productid", upload.single("image"), async function(req,res){
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
        product.updateData = updateData;
    
        if(req.file && req.file.buffer){
            product.image = req.file.buffer;
        }
        await product.save();
        req.flash("success" , "Product updated succesfully...");
        res.redirect("/owners/admin");

    }catch(error){
        res.status(400).send("Error occured while updating the product", error.message);
    }
});

module.exports = router;