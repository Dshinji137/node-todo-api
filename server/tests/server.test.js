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
    .set('x-auth',users[0].tokens[0].token)
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
    .set('x-auth',users[0].tokens[0].token)
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
    .set('x-auth',users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(1);
    })
    .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });
  // when logged in as user1, cannot fetch information of user2 (other users) even given right id
  it('should not return todo doc created by other users', (done) => {
    request(app)
    .get(`/todos/${todos[1]._id.toHexString()}`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var newId = new ObjectID().toHexString();
    request(app)
    .get(`/todos/${newId}`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 if invalid ids', (done) => {
    request(app)
    .get('/todos/1234')
    .set('x-auth',users[0].tokens[0].token)
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
    .set('x-auth',users[1].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(deleteId)
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      Todo.findById(deleteId).then((todo) => {
        expect(todo).toBeFalsy();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should not remove a todo created by other users', (done) => {
    var deleteId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${deleteId}`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(404)
    .end((err,res) => {
      if(err) {
        return done(err);
      }
      Todo.findById(deleteId).then((todo) => {
        expect(todo).toBeTruthy();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should return 404 if todo not found', (done) => {
    var deleteId = new ObjectID().toHexString();
    request(app)
    .delete(`/todos/${deleteId}`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(404)
    .end(done);

  });

  it('should return 404 if object id is invalid', (done) => {
    var deleteId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/123`)
    .set('x-auth',users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

});

// test patch
describe('PATCH /todos/:id', (done) => {
  it('should update the todo', (done) => {
    request(app)
    .patch(`/todos/${todos[0]._id.toHexString()}`)
    .set('x-auth',users[0].tokens[0].token)
    .send({
      text: 'First thing to do change',
      completed: true
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe('First thing to do change');
      expect(res.body.todo.completed).toBe(true);
      //expect(res.body.todo.completedAt).('number');
      expect(typeof(res.body.todo.completedAt)).toBe('number')
    })
    .end(done);
  });

  it('should not update the todo created by other user', (done) => {
    request(app)
    .patch(`/todos/${todos[1]._id.toHexString()}`)
    .set('x-auth',users[0].tokens[0].token)
    .send({
      text: 'First thing to do change',
      completed: true
    })
    .expect(404)
    .end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    request(app)
    .patch(`/todos/${todos[1]._id.toHexString()}`)
    .set('x-auth',users[1].tokens[0].token)
    .send({
      text: 'second thing to do changes',
      completed: false
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe('second thing to do changes');
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toBeFalsy();
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
      expect(res.headers['x-auth']).toBeTruthy();
      expect(res.body._id).toBeTruthy();
      expect(res.body.email).toBe(email);
    })
    .end((err) => {
      if(err) {
        return done(err);
      }

      User.findOne({email:email}).then((user) => {
        expect(user).toBeTruthy();
        expect(user.password).not.toBe(password);
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
      expect(res.headers['x-auth']).toBeTruthy();
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.toObject().tokens[1]).toMatchObject({
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
      expect(res.headers['x-auth']).toBeFalsy();
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((err) => done(err));
    })
  });
});

describe('DELETE /users/me/token', () => {

  it('should remove auth token on logout', (done) => {
    request(app)
    .delete('/users/me/token')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .end((err,res) => {
      if(err) {
        return done(err);
      }
      User.findById(users[0]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((err) => done(err));
    })
  });
});
