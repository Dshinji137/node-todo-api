var express = require('express');
var bodyParser = require('body-parser');
var {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {Users} = require('./models/user');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req,res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.send(doc);
  },(err) => {
    res.status(400).send(err);
  });
});

app.get('/todos', (req,res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (err) => {
    res.status(400).send(err);
  });
});

// GET /todos/todoID
app.get('/todos/:id',(req,res) => {
  var id = req.params.id;
  // invalidate id
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  // valid id
  Todo.findById(id).then((todo) => {
    if(!todo) {
      return res.status(404).send({});
    }
    res.send({todo});
  }).catch((err) => {
    res.status(400).send();
  });

});

app.listen(4000, () => {
  console.log('started on port 4000');
});

module.exports = {app};
