//const mongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp', (err,db) => {
  if(err) {
     return console.log('unable to connect');
  }
  console.log('connected to mongodb server');

  // findOneAndUpdate

  db.collection('Users').findOneAndUpdate({
    _id: new ObjectID("5a0ce2e7cfb71834e9e866d0")
  },{
    $set : {
      name: "Dshinji",
    },
    $inc : {
      age: 1
    }
  },{
    returnOriginal: false
  }).then((res) => {
    console.log(res);
  });


  //db.close();
});
