const bcrypt = require('bcrypt');
const cors = require('cors');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

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
