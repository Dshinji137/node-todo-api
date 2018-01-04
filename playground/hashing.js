const {SHA256} = require('crypto-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var password = '123abc!';

bcrypt.genSalt(10, (err,salt) => {
  bcrypt.hash(password,salt,(err,hash) => {
    console.log(hash);
  });
});

var hashedPswd = '$2a$10$AA.qIC.Z15tsTBjXq0l.JOXkct9ciRwSBWGHoioe7c6JyRwXkyc4i';

//bcrypt.compare(password,hashedPswd, (err,res) => {
//  console.log(res);
//})

// var data = {
//   id: 'Dshinji'
// };
//
// var token = jwt.sign(data,'abc123');
// console.log(token);
// var decoded = jwt.verify(token,'abc123');
// console.log(decoded);
// jwt.verify

// principal

// var message = 'Dshinji137';
// var hash = SHA256(message).toString();
//
// console.log(`Message: ${message}`);
// console.log(`Hash: ${hash}`);
//
// var data = {
//   id: 4
// }
// var token = {
//   data: data,
//   hash:SHA256(JSON.stringify(data) + 'secret').toString(),
// }
//
// token.data.id = 5;
//
// var resultHash = SHA256(JSON.stringify(token.data) + 'secret').toString();
//
// if(resultHash == token.hash) {
//   console.log('data not changed');
// }
// else {
//   console.log('data was changed');
// }
