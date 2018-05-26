require('./config/config');

const _ = require('lodash');
const express = require('express');
const hbs = require('hbs');
const moment = require('moment');
const bodyParser = require('body-parser');
const session = require('express-session');
const { ObjectID } = require('mongodb');

var parseurl = require('parseurl');
var path = require('path');
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
// local or deploy to Heroku
const port = process.env.PORT;

//app.use(bodyParser.json());

const publicPath = path.join(__dirname,'../public');
const partialPath = path.join(__dirname,'../views/partials');

var tokens = "";
var errMsg = "";
var currentUser = "";
var currentPage = "login";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.use(session({ secret: 'keyboard',resave:false,saveUninitialized:false,cookie: { maxAge:3600000 }}));
app.set('view engine','hbs');

hbs.registerPartials(partialPath);
hbs.registerHelper('getCurrentYear', () => {
  return new Date().getFullYear();
});
hbs.registerHelper('capital', (text) => {
  return text.toUpperCase();
});
hbs.registerHelper('listDisplay', (list,options) => {
  var out = "<ul>";

  for(var i=0; i<list.length; i++) {
    out = out + "<li><a href="+'/todo/'+list[i]._id + ">" + options.fn(list[i]) + "</a></li>";
  }

  return list.length > 0? out + "</ul>" : "No Record";
})

app.get('/',async (req,res) => {
  console.log(req.session.loggedIn);
  if(!req.session.loggedIn) {
    if(currentPage === 'login') {
      res.render("login.hbs", {
        pageTitle: "Log in",
        welcomeMsg: 'Express To-Do App',
        errMsg: errMsg,
      });
    } else {
      res.render("signup.hbs", {
        pageTitle: "Sign up",
        welcomeMsg: 'Express To-Do App',
        errMsg: errMsg,
      });
    }
  } else {
    var todoList = await Todo.find({_creator:currentUser._id});
    var completed = todoList.filter(t => t.completed === true);
    var nonCompleted = todoList.filter(t =>  t.completed === false);

    res.render("main.hbs", {
      pageTitle: "main page",
      welcomeMsg: 'Express To-Do App',
      token: tokens,
      completed: completed,
      nonCompleted: nonCompleted,
    });
  }
});

app.get('/todo/:id', async (req,res) => {
  var id = req.params.id;
  try {
    var todo = await Todo.findOne({_id:id});
    const deleteAction = "/todo/delete/"+id;
    const updateAction = "/todo/update/"+id;
    const toggleAction = todo.completed? "/incomplete/"+id : "/complete/"+id;
    const toggleMsg = todo.completed? "mark as incomplete" : "mark as complete";

    if(todo._creator.toString() === currentUser._id.toString()) {
      res.render("todo.hbs",{
        task: todo.text,
        id:id,
        welcomeMsg:"Edit your task",
        deleteAction:deleteAction,
        updateAction:updateAction,
        toggleAction:toggleAction,
        toggleMsg: toggleMsg
      });
    } else {
      res.redirect("/");
    }
  } catch(e) {
    res.redirect("/");
  }

});

app.post('/toSignup', (req,res) => {
  currentPage = 'signup';
  res.redirect('/');
});

app.post('/toLogin', (req,res) => {
  currentPage = 'login';
  res.redirect('/');
});

app.post('/login', async (req,res) => {
  try {
    const body = _.pick(req.body,['email','password']);
    const user = await User.findByCredentials(body.email,body.password);
    const token = await user.generateAuthToken();
    req.session.loggedIn = true;

    tokens = token;
    errMsg = "";
    currentUser = user;
    currentPage = "main";

    res.redirect("/");
  } catch(e) {
    errMsg = e;
    res.redirect("/");
  }
});

app.post('/relogin',async (req,res) => {
  res.redirect('/');
})

app.post('/signup', async (req,res) => {
  const body = _.pick(req.body, ['email', 'password']);
  const user = new User(body);

  try {
    await user.save()
    const token = await user.generateAuthToken();

    tokens = token;
    errMsg = "";
    currentPage = "login";

    res.redirect("/");
  } catch(e) {
    errMsg = e.message;
    res.redirect("/");
  }
});

app.post('/signout', async(req,res) => {
  try {
    var token = req.body.token;
    req.session.loggedIn = false;
    await currentUser.removeToken(token);

    currentPage = "login";
    currentUser = "";
    res.render("signout.hbs",{
      signoutMsg: "You have succesfully signed out"
    });
  } catch(e) {
    currentPage = "login";
    currentUser = "";
    res.render("signout.hbs",{
      signoutMsg: "You have succesfully signed out"
    });
  }
});

app.post('/addtodo',authenticate, async (req,res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator:currentUser._id
  });

  try {
    await todo.save();
    res.redirect('/');
  } catch(e) {
    res.redirect('/');
  }
});

app.post("/todo/delete/:id", async (req,res) => {
  try {
    const id = req.params.id;
    const todo = await Todo.findOneAndRemove({_id:id,_creator:currentUser._id});
    res.redirect("/");
  } catch(e) {
    res.redirect("/");
  }
});

app.post("/todo/update/:id", async (req,res) => {
  try {
    const id = req.params.id;
    const newText = req.body.text;

    if(newText.length > 0) {
      const todo = await Todo.findOneAndUpdate({
        _id:id,
        _creator:currentUser._id
      },{$set: {text:newText}});
      res.redirect("/");
    } else {
      res.redirect("/");
    }
  } catch(e) {
    res.redirect("/");
  }
});

app.post("/incomplete/:id",async (req,res) => {
  try {
    const id = req.params.id;
    const todo = await Todo.findOneAndUpdate({
      _id:id,
      _creator: currentUser._id
    },{$set: {completed:false,completedAt:null}});

    res.redirect("/");
  } catch(e) {
    res.redirect("/");
  }
})

app.post("/complete/:id",async (req,res) => {
  try {
    const id = req.params.id;
    const date = new Date().getTime();
    const todo = await Todo.findOneAndUpdate({
      _id:id,
      _creator: currentUser._id
    },{$set: {completed:true,completedAt:moment().format('MMM D, YYYY')}});

    res.redirect("/");
  } catch(e) {
    console.log(e.message);
    res.redirect("/");
  }
})

/*
app.post('/todos', authenticate,(req,res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator:req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  },(err) => {
    res.status(400).send(err);
  });
});

app.get('/todos', authenticate,(req,res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (err) => {
    res.status(400).send(err);
  });
});

// GET /todos/todoID
app.get('/todos/:id', authenticate, (req,res) => {
  var id = req.params.id;
  // invalidate id
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  // valid id, only allow to get the current user's id
  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((err) => {
    res.status(400).send();
  });

});

app.delete('/todos/:id',authenticate,async (req,res) => {
  const id = req.params.id;
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  try {
    const todo = await Todo.findOneAndRemove({_id:id,_creator:req.user._id});
    if(!todo) {
      res.status(404).send();
    } else {
      res.send({todo:todo});
    }
  } catch(e) {
    res.status(400).send();
  }
});

app.patch('/todos/:id', authenticate,(req,res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text','completed']);
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if(_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
    _id:id,
    _creator:req.user._id
  }, {$set: body}, {new: true}).then((todo) => {
    if(!todo) {
      return res.status(404).send();
    }
    res.send({todo: todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.get('/users/me', authenticate, (req,res) => {
  res.send(req.user);
});

app.post('/users/login', async (req,res) => {
  try {
    const body = _.pick(req.body,['email','password']);
    const user = await User.findByCredentials(body.email,body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth',token).send(user);
  } catch(e) {
    res.status(400).send();
  }
});

app.delete('/users/me/token', authenticate, async(req,res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch(e) {
    res.status(400).send();
  }
});

*/

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};
