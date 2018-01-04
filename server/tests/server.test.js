const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);


//test post
describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'test todo';
    request(app)
    .post('/todos')
    .send({text})
    .expect(200)
    .expect((res) => {
      expect(res.body.text).toBe(text);
    })
    .end((err) => {
      if(err) {
        return done(err);
      }

      Todo.find({text}).then((todos) => {
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch((e) => done(e));
    });
  });

  it('should not create a todo', (done) => {
    request(app)
    .post('/todos')
    .send({})
    .expect(400)
    .end((err,res) => {
      if(err) {
        return done(err);
      }
      Todo.find().then((todos) => {
        expect(todos.length).toBe(2);
        done();
      }).catch((e) => done(e));
    })
  });
});

// test get
describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
    .get('/todos')
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(2);
    })
    .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return tode doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var newId = new ObjectID().toHexString();
    request(app)
    .get(`/todos/${newId}`)
    .expect(404)
    .end(done);
  });

  it('should return 404 if invalid ids', (done) => {
    request(app)
    .get('/todos/1234')
    .expect(404)
    .end(done);
  });
});

// test delete
describe('DELETE /todos/:id', (done) => {
  it('should remove a todo', (done) => {
    var deleteId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${deleteId}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(deleteId)
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      Todo.findById(deleteId).then((todo) => {
        expect(todo).toNotExist();
        done();
      }).catch((e) => done(e));
    });

  });

  it('should return 404 if todo not found', (done) => {
    var deleteId = new ObjectID().toHexString();
    request(app)
    .delete(`/todos/${deleteId}`)
    .expect(404)
    .end(done);

  });

  it('should return 404 if object id is invalid', (done) => {
    var deleteId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/123`)
    .expect(404)
    .end(done);
  });

});

// test patch
describe('PATCH /todos/:id', (done) => {
  it('should update the todo', (done) => {
    request(app)
    .patch(`/todos/${todos[0]._id.toHexString()}`)
    .send({
      text: 'First thing to do change',
      completed: true
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe('First thing to do change');
      expect(res.body.todo.completed).toBe(true);
      expect(res.body.todo.completedAt).toBeA('number');
    })
    .end(done);

  });

  it('should clear completedAt when todo is not completed', (done) => {
    request(app)
    .patch(`/todos/${todos[1]._id.toHexString()}`)
    .send({
      text: 'second thing to do changes',
      completed: false
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe('second thing to do changes');
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toNotExist();
    })
    .end(done);

  });
});

//
describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
    .expect(401)
    .expect((res) => {
      expect(res.body).toEqual({});
    })
    .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'test@example.com';
    var password = '123!!!';

    request(app)
    .post('/users')
    .send({
      email: email,
      password: password
    })
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
      expect(res.body._id).toExist();
      expect(res.body.email).toBe(email);
    })
    .end((err) => {
      if(err) {
        return done(err);
      }

      User.findOne({email:email}).then((user) => {
        expect(user).toExist();
        expect(user.password).toNotBe(password);
        done();
      }).catch((err) => done(err));;
    });
  });

  it('should return validation error if request not valid', (done) => {
    var email = 'test@example.com';
    var password = '123!!';

    request(app)
    .post('/users')
    .send({
      email: email,
      password: password
    })
    .expect(400)
    .end(done);
  });

  it('should not create user if email in use', (done) => {
    var email = 'Dshinji137@gmail.com';
    var password = '123!!@';

    request(app)
    .post('/users')
    .send({
      email: email,
      password: password
    })
    .expect(400)
    .end(done);
  });
});

describe('POST /users/login', () => {

  it('should login user and return auth token', (done) => {

    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password,
    })
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens[0]).toInclude({
          access: 'auth',
          token: res.headers['x-auth']
        });
        done();
      }).catch((e) => done(e));
    })
  });

  it('should reject invalid login', (done) => {

    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password + 'abcd',
    })
    .expect(400)
    .expect((res) => {
      expect(res.headers['x-auth']).toNotExist();
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((err) => done(err));
    })

  });
});
