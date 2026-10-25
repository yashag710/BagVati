// res.locals.owner is set in app.js from the verified JWT cookie
module.exports = function(req,res,next){
    if(!res.locals.owner){
        req.flash("error" , "Owner login required");
        return res.redirect("/owners/login");
    }
    next();
}
