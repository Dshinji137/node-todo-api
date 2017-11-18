const {ObjectID} = require('mongodb');
const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

//var id = '5a10ad7eef1e66e01339448d';
var id = '5a0e273194ebef5444df7c72';

if(!ObjectID.isValid(id)) {
  console.log('ID not valid');
}

/*
Todo.find({
  _id: id
}).then((todos) => {
  console.log('Todos',todos);
});

Todo.findOne({
  _id: id
}).then((todo) => {
    console.log('Todo',todo);
});
*/

Todo.findById(id).then((todo) => {
  if(!todo) {
    return console.log('id not found');
  }
  console.log('Todo By Id',todo);
}).catch((err) => {
  console.log('invalid ID');
  console.log(err);
})

User.findById(id).then((user) => {
  if(!user) {
    return console.log('id not found');
  }
  console.log('Todo By Id',user);
}).catch((err) => {
  console.log('invalid ID');
  console.log(err);
})
