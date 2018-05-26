const hbs = require('hbs');
var { User } = require('./../models/user')
// middleware
var authenticate = (req,res,next) => {
  var token = req.body.token;

  User.findByToken(token).then((user) => {
    if(!user) {
      return Promise.reject();
    }
    //req.token = token;
    
    next();
  }).catch((err) => {
    res.redirect("/");
  })
};

module.exports = {
  authenticate: authenticate
}
