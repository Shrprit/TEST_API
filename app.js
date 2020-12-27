const sql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var connection = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "password1234",
    database: "my_database"
}
);
connection.connect((err) => {
    if (!err)
        console.log('DB connection succeded.');
    else
        console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});
app.listen(3000, () => console.log('Express server is runnig at port no : 3000')); // running on port 3000


//API to insert candidate data 
app.post('/save', (req, res) => {
    var name = req.body.Name;
    var email = req.body.Email_id;
    let insert_query = "INSERT INTO candidates (Name , Email_id) VALUES(?,?)"; //insert query to insert candidate in candidates table
    connection.query(insert_query, [name, email], (err, rows, fields) => {
        if (!err) {
            res.send(rows);
        }
        else
            console.log(err);
    }
    )
});
//API to insert test score of candidate 
app.post('/candidate/:id', (req, res) => {
    var firstScore = req.body.first_round;
    var secondScore = req.body.second_round;
    var thirdScore = req.body.third_round;
    let check = "SELECT * FROM CANDIDATES WHERE Email_id = ?"; // because email is unique id
    connection.query(check, req.params.id, (err, rows, fields) => {
        if (err) {
            res.send(err);
        }
        if (!rows.length) // if candidate doesn't exist in candidate table
            res.send("Candidate doesn't exist");
        let insert_query = "INSERT INTO test_score ( first_round,second_round,third_round , Email_id ) VALUES(?,?,?,?) ";
        //otherwise , insert score of candidate 
        connection.query(insert_query, [firstScore, secondScore, thirdScore, req.params.id], (err, rows, fields) => {
            if (!err) {
                res.send(rows);
            }
            else
                console.log(err);
        })

    })
});
//API to find highest scoring candidate in each round 
app.get('/candidate_maxScore', (req, res) => {

    connection.query('SELECT candidates.Email_id, candidates.Name FROM candidates INNER JOIN (SELECT Email_id FROM test_score ORDER BY first_round DESC LIMIT 1) test_score ON test_score.Email_id = candidates.Email_id'
        , (err, data, fields) => {
            if (err)
                res.send(err);
            connection.query('SELECT candidates.Email_id, candidates.Name FROM candidates INNER JOIN (SELECT Email_id FROM test_score ORDER BY second_round DESC LIMIT 1) test_score ON test_score.Email_id = candidates.Email_id'
                , (err, data1, fields) => {
                    if (err)
                        res.send(err);
                    connection.query('SELECT candidates.Email_id, candidates.Name FROM candidates INNER JOIN (SELECT Email_id FROM test_score ORDER BY third_round DESC LIMIT 1) test_score ON test_score.Email_id = candidates.Email_id'
                        , (err, data2, fields) => {
                            if (err)
                                res.send(err);
                            res.send({"FirstRoundTopper":data,"SecondRoundTopper":data1,"ThirdRoundTopper":data2});
                        })
                })
        })
});
// API to find average of each round
app.get('/testScore_average', (req, res) => {
    connection.query('SELECT AVG(first_round) FROM test_score', (err, data, fields) => {
        if (err)
            res.send(err);
        connection.query('SELECT AVG(second_round) FROM test_score', (err, data1, fields) => {
            if (err)
                res.send(err);
            connection.query('SELECT AVG(third_round) FROM test_score', (err, data2, fields) => {
                if (err)
                    res.send(err);
                res.send({ ...data[0], ...data1[0], ...data2[0] });
            })
        })
    })

});
