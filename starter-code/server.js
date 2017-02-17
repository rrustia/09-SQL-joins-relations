'use strict';

// DONE: Do not forget to go into your SQL shell and DROP TABLE the existing articles/authors tables. Be sure to start clean.
const pg = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const app = express();
// DONE: Don't forget to set your own conString if required by your system
const conString = 'postgres://localhost:5432';
// DONE: Using a sentence or two, describe what is happening in Line 12.
// Put your response here...It is creating a new server connection that can connect through port 5432, which is a connection between controller and model.
const client = new pg.Client(conString);
client.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));

// Routes for requesting HTML resources
app.get('/', function(request, response) {
  response.sendFile('index.html', {root: '.'});
});

app.get('/new', function(request, response) {
  response.sendFile('new.html', {root: '.'});
});

// Following are the routes for making API calls to enact CRUD Operations on our database

// DONE: Some of the following questions will refer back to the image called 'full-stack-diagram' that has been added to the lab directory. In that image you will see that the various parts of the application's activity have been numbered 1-5. When prompted in the following questions, identify which number best matches the location of a given process. For instance, the following line of code, where the server is handling a request from the view layer, would match up with #2.
app.get('/articles', function(request, response) {
  // REVIEW: We now have two queries which create separate tables in our DB, and reference the authors in our articles.
  // DONE: What number in the full-stack diagram best matches what is happening in lines 35-42?
  // Put your response here...#3
  client.query(`
    CREATE TABLE IF NOT EXISTS
    authors (
      author_id SERIAL PRIMARY KEY,
      author VARCHAR(255) UNIQUE NOT NULL,
      "authorUrl" VARCHAR (255)
    );`
  )
  client.query(`
    CREATE TABLE IF NOT EXISTS
    articles (
      article_id SERIAL PRIMARY KEY,
      author_id INTEGER NOT NULL REFERENCES authors(author_id),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL
    );`
  ) // DONE: Referring to lines 45-52, answer the following questions:
    // What is a primary key?
    // Put your response here...article_id, the unique identifier in a table.
    // +++++++++++++++++++++
    // What does VARCHAR mean?
    // Put your response here...a string data type that sets the maximum character for variable. CHAR sets constant number of the string.
    // +++++++++++++++++++++
  // REVIEW: This query will join the data together from our tables and send it back to the client.
  client.query(`
    SELECT * FROM articles
    INNER JOIN authors
      ON articles.author_id=authors.author_id;`, // DONE: Write a SQL query which inner joins the data from articles and authors from all records
    function(err, result) {
      if (err) console.error(err);
      response.send(result.rows);
    }
  );
});

// DONE: How is a 'post' route different than a 'get' route?
// Put your answer here... a post creates an entry and a get reads an entry
app.post('/articles', function(request, response) {
  client.query(
    'INSERT INTO authors(author, "authorUrl") VALUES($1, $2) ON CONFLICT DO NOTHING', // DONE: Write a SQL query to insert a new author, ON CONFLICT DO NOTHING
    [request.body.author, request.body.authorUrl], // DONE: Add the author and "authorUrl" as data for the SQL query
    function(err) {
      if (err) console.error(err)
      queryTwo() // This is our second query, to be executed when this first query is complete.
    }
  )

  function queryTwo() {
    client.query(
      // DONE: What is the purpose of the $1 in the following line of code?
      // Put your response here...it will get the first value after the comma, in this case "request.body.author"
      `SELECT author_id FROM authors WHERE author=$1`, // DONE: Write a SQL query to retrieve the author_id from the authors table for the new article
      [request.body.author], // DONE: Add the author name as data for the SQL query
      function(err, result) {
        if (err) console.error(err)
        queryThree(result.rows[0].author_id) // This is our third query, to be executed when the second is complete. We are also passing the author_id into our third query
      }
    )
  }

  function queryThree(author_id) {
      // DONE: What number in the full-stack diagram best matches what is happening in line 100? #3
    client.query(
      `INSERT INTO
      articles(author_id, title, category, "publishedOn", body)
      VALUES ($1, $2, $3, $4, $5);`, // DONE: Write a SQL query to insert the new article using the author_id from our previous query
      [
        author_id,
        request.body.title,
        request.body.category,
        request.body.publishedOn,
        request.body.body
      ], // DONE: Add the data from our new article, including the author_id, as data for the SQL query.
      function(err) {
        if (err) console.error(err);
        // DONE: What number in the full-stack diagram best matches what is happening in line 114? #5
        response.send('insert complete');
      }
    );
  }
});

app.put('/articles/:id', function(request, response) {
  client.query(
    `SELECT author_id FROM authors WHERE author=$1`, // DONE: Write a SQL query to retrieve the author_id from the authors table for the new article
    [request.body.author], // DONE: Add the author name as data for the SQL query
    function(err, result) {
      if (err) console.error(err)
      queryTwo(result.rows[0].author_id)
      queryThree(result.rows[0].author_id)
    }
  )

  function queryTwo(author_id) {
    client.query(
      // DONE: In a sentence or two, describe how a SQL 'UPDATE' is different from an 'INSERT', and identify which REST verbs and which CRUD components align with them. An update replaces existing record, an INSERT inserts new data. REST verb are PUT/PATCH and CRUD=U, for update it's POST for INSERT and CRUD=C
      `UPDATE authors
      SET author=$1, "authorUrl"=$2
      WHERE author_id=$3;`, // DONE: Write a SQL query to update an existing author record
      [request.body.author, request.body.authorUrl, author_id] // DONE: Add the values for this table as data for the SQL query
    )
  }

  function queryThree(author_id) {
    client.query(
      `UPDATE articles
      SET author_id=$1, title=$2, category=$3, "publishedOn"=$4, body=$5
      WHERE article_id=$6;`, // DONE: Write a SQL query to update an existing article record
      [
        author_id,
        request.body.title,
        request.body.category,
        request.body.publishedOn,
        request.body.body,
        request.params.id
      ], // DONE: Add the values for this table as data for the SQL query
      function(err) {
        if (err) console.error(err);
        response.send('insert complete');
      }
    );
  }
});

  // DONE: What number in the full-stack diagram best matches what is happening in line 163? #2
app.delete('/articles/:id', function(request, response) {
    // DONE: What number in the full-stack diagram best matches what is happening in lines 165? #3
  client.query(
    `DELETE FROM articles WHERE article_id=$1;`,
    // DONE: What does the value in 'request.params.id' come from? If unsure, look in the Express docs.
    // Put your response here...It comes from the user argument in AJAX
    [request.params.id]
  );
  // DONE: What number in the full-stack diagram best matches what is happening in line 171? #5
  response.send('Delete complete');
});

app.delete('/articles', function(request, response) {
  client.query(
    'DELETE FROM articles;'
  );
  response.send('Delete complete');
});

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}!`);
});

// DONE: Make your own drawing of the full-stack diagram on a blank piece of paper (there is a stack of paper on the table next to the door into our classroom) and submit to the TA who grades your lab assignments. This is for just a little extra reinforcement of how everything works.
