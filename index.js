// Required dependencies
const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// MySQL configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// API endpoint for pagination and search
app.get('/items', (req, res) => {
  const searchTerm = req.query.search || ''; // Get search term from query string
  const page = parseInt(req.query.page) || 1; // Get page number from query string, default is 1
  const perPage = 10; // Number of records per page

  // Calculate the offset based on the page number and records per page
  const offset = (page - 1) * perPage;

  // Construct the SQL query with search term and pagination
  let sqlQuery = `SELECT * FROM items`;
  let countQuery = `SELECT COUNT(*) AS count FROM items`;
  let queryParams = [];

  // Add search term condition if provided
  if (searchTerm) {
    sqlQuery += ` WHERE name LIKE ?`;
    countQuery += ` WHERE name LIKE ?`;
    queryParams.push(`%${searchTerm}%`);
  }

  // Add pagination limit and offset
  sqlQuery += ` LIMIT ? OFFSET ?`;
  queryParams.push(perPage, offset);

  // Execute the count query to get the total number of records
  connection.query(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error('Error executing count query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Execute the main query to retrieve paginated and searched data
    connection.query(sqlQuery, queryParams, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const totalCount = countResult[0].count; // Total number of records

      // Calculate total number of pages based on the total count and records per page
      const totalPages = Math.ceil(totalCount / perPage);

      // Construct the response object with the retrieved data and pagination metadata
      const response = {
        page,
        perPage,
        totalPages,
        totalCount,
        results,
      };

      res.json(response);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
