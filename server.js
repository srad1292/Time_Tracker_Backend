const bcrypt = require('bcrypt');
const cors = require('cors');
const express = require('express');
const {ObjectId, MongoClient} = require('mongodb');

const url = "mongodb://localhost:27017/";
const salt_rounds = 10;

let dbh;
MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    
    dbh = db.db("time-tracker-db");
});

const corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200  
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.listen(8000, () => {
    console.log('Server started!');
});



//User Routes

/**
 * Checks to make sure a given username does not exist and
 * if not, adds a new user document to users table to 
 * register user with application
 * 
 * @param {user: Object} - User object containing registration details
 * 
 * Success -
 * @returns {user: object} - User data for provided details on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/user/register').post((req, res) => {
    const newUser = req.body['user'];

    //Handle cases where user data isn't as expected just to be safe 

    dbh.collection("users").findOne({uid:newUser['uid']}, function(err, findRes) {
        if (err) {
            return res.status(500).send({message: err});
        }
        else {
            //If a user already exists with this username, cannot create another
            if(findRes) {
                return res.status(400).send({
                    message: 'A user already exists with this username'
                });
            }

            bcrypt.hash(newUser['password'], salt_rounds, function(err, hash) {
                if(err) {
                    return res.status(500).send({message: err});
                }
                newUser['password'] = hash;
                dbh.collection("users").insertOne(newUser, function(err, insertRes) {
                    if (err){
                        return res.status(500).send({message: err});
                    }
                    return res.send({ message: 'ok' });  
                });
            });
        }
  });


});

/**
 * Given a username and password, check to make sure that a user exists
 * with that combination, and if so return the user data.
 * 
 * @param {uid: string} - Username for login attempt
 * @param {password: string} - Password for login attempt
 * 
 * Success -
 * @returns {user: object} - User data for provided name on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/user/authenticate').post((req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    dbh.collection("users").findOne({uid:username}, { projection: { _id: 0 } }, function(err, findRes) {
        if (err) {
            return res.status(500).send({message: err});
        }
        else {
            if(!findRes) {
                return res.status(404).send({
                    message: 'No user found with this username'
                });
            }
            else {
                bcrypt.compare(password, findRes['password'], function(err, compRes) {
                    if (err) {
                        return res.status(500).send({message: err});
                    }
                    if(compRes) {
                        // Passwords match
                        findRes['token'] = 'fake-jwt-token';
                        delete findRes['password'];
                        return res.send( findRes );
                    } 
                    else {
                        // Passwords don't match
                        return res.status(404).send({
                            message: 'Incorrect Password'
                        });
                    } 
                });
            }
        }
    });
});



//Activity Routes

/**
 * Retrieve all activities for a given user for a specific day
 * 
 * @param {date: string} - Date we want to look for: YYYY-MM-DD
 * @param {user: string} - Username for who we want the activity for
 * 
 * Success -
 * @returns {activities: activity[]} - Array of activity documents
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/activity/:date/for/:user').get((req, res) => {
    const date = req.params['date'];
    const username = req.params['user'];
    dbh.collection("activity").find({date:date, username:username}).toArray(function(err, findRes) {
      if (err) {
        return res.status(500).send({
          message: err
        });
      }
      else {
        //No activities for user
        if(!findRes) {
          return res.send({message: 'User has no saved activities for this date'});
        }
        return res.send({activities: findRes});
      }
    });
});

/**
 * Retrieve all activities for a given user
 * 
 * @param {user: string} - Username for who we want the activity for
 * 
 * Success -
 * @returns {activities: activity[]} - Array of activity documents
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/activity/:user').get((req, res) => {
    const username = req.params['user'];
    dbh.collection("activity").find({username:username}).toArray(function(err, findRes) {
      if (err) {
        return res.status(500).send({
          message: err
        });
      }
      else {
        //No activities for user
        if(!findRes) {
          return res.send({message: 'User has no saved activities'});
        }
        return res.send({activities: findRes});
      }
    });
});



/**
 * Creates a new document in the activity collection for user
 * 
 * @param {activity: Activity} - An activity object to insert
 * 
 * Success -
 * @returns {response: object} - A message and the id for the new document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/activity/').post((req, res) => {
    const newActivity = req.body['activity'];
    ////////////////////////////////////////////handle input problems
  
    dbh.collection("activity").insertOne(newActivity, function(err, insertRes) {
      if (err){
        return res.status(500).send({
          message: err
        });
      }
      if(insertRes && insertRes.insertedId) {
        return res.send({ message: 'ok', recordId: insertRes.insertedId });  
      }
      else{
        return res.send({message: 'No error, but no data found'});
      }
    });
  
  });
  
 
  /**
   * Updates a document in the activity collection for a user
   * 
   * @param {activity: Activity} - The updated activity object
   * 
   * Success -
   * @returns {response: object} - A success message
   * Error -
   * @returns {error: Object} - HTTP Error object with reason for failure
   */
  app.route('/activity/').put((req, res) => {
    //////////////////////handle input problems
    const requestBody = req.body['activity'];
    const activityQuery = {_id: ObjectId(requestBody['_id'])};
    delete requestBody['_id'];
    const updateQuery = { $set: requestBody}; 
  
    dbh.collection("activity").updateOne(activityQuery, updateQuery, function(err, updateRes) {
      if (err){
        return res.status(500).send({
          message: err
        });
      }
      if( updateRes && updateRes['modifiedCount']) {
        return res.send({ message: 'ok' });
      }
      return res.status(500).send({
        message: 'Failed to update'
      });
    });
  });
  

  /**
   * Removes an activity document from the collection
   * 
   * @param {id: string} - The _id for the document to be deleted
   * 
   * Success -
   * @returns {response: object} - A success message
   * Error -
   * @returns {error: Object} - HTTP Error object with reason for failure
   */
  app.route('/activity/:id/').delete((req, res) => {
    ////////////////handle input problems
    const id = ObjectId(req.params['id']);
    const updateQuery = {_id: id};
    dbh.collection("activity").deleteOne(updateQuery, function(err, deleteRes) {
      if (err){
        return res.status(500).send({
          message: err
        });
      }
      if(deleteRes && deleteRes.deletedCount && deleteRes.deletedCount == 1) {
        return res.send({ message: 'ok' });
      }
      else {
        return res.send({ message: 'No errors, but nothing deleted' });
      }
    });
  });
  
  