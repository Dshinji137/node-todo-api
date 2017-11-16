//const mongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp', (err,db) => {
  if(err) {
     return console.log('unable to connect');
  }
  console.log('connected to mongodb server');
  /*
  db.collection('Todos').find({
    _id: new ObjectID('5a0ce1dadd4e90346269e5cb')
  }).toArray().then((docs) => {
    console.log(JSON.stringify(docs,undefined,2));
  }, (err) => {
    console.log('unable to fetch data', err);
  });
  */

  db.collection('Todos').find().count().then((count) => {
    console.log(`Todos count: ${count}`);
  }, (err) => {
    console.log('unable to fetch data', err);
  });

  //db.close();
});
