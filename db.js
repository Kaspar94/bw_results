const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "db",
  user: "user",
  password: "1234",
  database: "votes"
});

connection.connect(err => {
  if (err) throw err;
});

module.exports = connection;
