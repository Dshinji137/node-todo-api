const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
  _id: new ObjectID(),
  text: 'First test to do'
}, {
  _id: new ObjectID(),
  text: 'Second test to do',
  completed: true,
  completedAt: 39293
}];

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
})

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
