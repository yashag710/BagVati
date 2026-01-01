const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner');
const bcrypt = require("bcrypt");
let jwt = require('jsonwebtoken');
const { generateToken } = require("../utils/generateToken");
const productModel = require("../models/product");
const cors = require("cors");
const bodyParser = require("body-parser");
const emailjs = require("@emailjs/nodejs");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

router.get('/' , (req,res) => {
    res.send("Hey!");
});

router.post("/delete" , async (req,res) => {
    const response = await ownerModel.deleteMany({});
    return res.status(500).send({message : "Owner deleted successfully"});
});

router.post("/create", async (req,res) => {
        let owners = await ownerModel.find();
        if(owners.length > 0){
            return res.status(503).send("You are not authorized to be an owner.");
        }

        console.log(req.body);

        let {fullname , email , password} = req.body;
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                let createdOwner = await ownerModel.create({
                    fullname : fullname,
                    email : email,
                    password : hash
                });
                let token = generateToken(createdOwner);
                res.cookie("token" , token);
                return res.status(201).send(createdOwner);
            });
        });
    }); 

router.get("/login" , async function(req,res){
    res.render("owner-login");
});

router.post("/login", async function(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const owner = await ownerModel.findOne({ email: email });
        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        bcrypt.compare(password, owner.password, function(err, result) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "An error occurred during login"
                });
            }

            if (result) {
                const token = generateToken(owner);
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });
                
                return res.json({
                    success: true,
                    message: "Login successful",
                    redirect: "/owners/admin"
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login"
        });
    }
});

router.get("/admin" , async (req,res) => {
    let success = req.flash("success");
    let products = await productModel.find({});
    res.render("admin" , {success , products});
});

router.post("/send-email", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false,
                message: "All fields are required!" 
            });
        }

        const transporter = nodemailer.createTransport({
            secure: true,
            host: "smtp.gmail.com",
            port: 465,
            auth: {
                user: "yashag1810@gmail.com",
                pass: 'icpf ovto hxpa sjoi'
            },
        });

        const mailOptions = {
            from: email,
            to: "yashag1810@gmail.com",
            subject: `Contact Form: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ 
            success: true,
            message: "Email sent successfully!" 
        });
    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to send email. Please try again later." 
        });
    }
});

module.exports = router;