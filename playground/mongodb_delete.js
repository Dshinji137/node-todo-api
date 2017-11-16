//const mongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp', (err,db) => {
  if(err) {
     return console.log('unable to connect');
  }
  console.log('connected to mongodb server');

  //db.collection('Todos').deleteOne({text: 'lunch'}).then((result) => {
  //  console.log(result);
  //});

  // findOneAndDelete
  db.collection('Todos').findOneAndDelete({completed: false}).then((res) => {
    console.log(res);
  });

  //db.close();
});
