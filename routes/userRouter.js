const express = require('express');
const router = express.Router();
const userModel = require("../models/users");
const joi = require('joi');
const bcrypt = require('bcrypt');
const {generateToken} = require("../utils/generateToken");
const {registerUser , loginUser , logout} = require("../controllers/authControllers");

router.get('/' , (req,res) => {
    res.send("Hey!");
});
router.post("/register", registerUser);

router.post("/login" , loginUser);

router.get("/logout" , logout);

module.exports = router;