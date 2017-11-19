const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

//Todo.remove({}).then((result) => {
//  console.log(result);
//});

Todo.findAndRemove({_id:'5a10c2127ee80014f01b42fb'}).then((todo) => {
  
})

Todo.findByIdAndRemove('5a10c2127ee80014f01b42fb').then((doc) => {
  console.log(doc);
})
