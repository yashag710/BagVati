const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner');

router.get('/' , (req,res) => {
    res.send("Hey!");
});

// if(process.env.NODE_ENV === "development")
router.post("/create", async (req,res) => {
        let owners = await ownerModel.find();
        if(owners.length > 0){
            return res.status(503).send("You are not authorized to be an owner.");
        }
        let {fullname , email , password} = req.body;
        let createdOwner = await ownerModel.create({
            fullname : fullname,
            email : email,
            password : password
        });
        return res.status(201).send(createdOwner);
    }); 

router.post("/login" , async function(req,res){
        let {email , password} = req.body;
        let owner = await ownerModel.findOne({ email : email});
        if(!owner){return res.status(404).send("You are not the Owner");
        }
        bcrypt.compare(password , owner.password , function(err, result){
            if(result){
                let token = generateToken(user);
                res.cookie("token" , token);
                res.redirect("/shop");
            }
            else{
                return res.status(501).send("Incorrect credentials");
            }
        });
    });

router.get("/admin" , (req,res) => {
    let success = req.flash("success");
    res.render("createproducts" , {success});
});

module.exports = router;