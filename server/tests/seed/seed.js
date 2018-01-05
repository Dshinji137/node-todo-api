const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();
const users = [{
  _id: userOneID,
  email: 'Dshinji137@gmail.com',
  password: 'JTRjdt036',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneID,access:'auth'},'abc123').toString()
  }]
},{
  _id: userTwoID,
  email: 'Dshinji@example.com',
  password: 'abc123!',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoID,access:'auth'},'abc123').toString()
  }]
}];

const todos = [{
  _id: new ObjectID(),
  text: 'First test to do',
  _creator:userOneID
}, {
  _id: new ObjectID(),
  text: 'Second test to do',
  completed: true,
  completedAt: 39293,
  _creator:userTwoID
}];

const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne,userTwo]);
  }).then(() => {
    done();
  });
}


module.exports = {
  todos: todos,
  populateTodos: populateTodos,
  users: users,
  populateUsers: populateUsers
};
