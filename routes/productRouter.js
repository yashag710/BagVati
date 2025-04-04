const express = require('express');
const router = express.Router();
const productModel = require("../models/product");
const upload = require("../config/multer-config");
const isLoggedIn = require('../middlewares/isLoggedIn');
const userModel = require("../models/users");
const users = require('../models/users');

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

module.exports = router;