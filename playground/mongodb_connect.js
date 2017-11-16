//const mongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp', (err,db) => {
  if(err) {
     return console.log('unable to connect');
  }
  console.log('connected to mongodb server');

  /*
  db.collection('Todos').insertOne({
    text: 'Something to do',
    completed: false
  },(err,res) => {
    if(err) {
      return console.log('Unable to insert to Todos');
    }
    console.log(JSON.stringify(res.ops, undefined, 2));
  });
  */

  db.close();
});
