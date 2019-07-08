"use strict";

const express = require("express");
const sql = require("./db");
const webSocket = require("ws");
const http = require("http");


const PORT = process.env.PORT | 7000;

const app = express();

const server = http.createServer(app);

const wss = new webSocket.Server({ server });

let currentData = JSON.stringify([]); // latest result from database
let sockets = []; // all our active connections

const fetchDataAndSend = async (recipients = []) => {
  // query database
  await sql.query(
    "SELECT name, count(*) as count FROM votes group by name",
    (err, resp) => {
      if (err) {
        return;
      }
      currentData = JSON.stringify(resp);

      // send to active connections
      recipients.forEach(socket => socket.send(currentData));
    }
  );
};

// initialize on startup
fetchDataAndSend();
setInterval(() => fetchDataAndSend(sockets), 60000); // also send data every minute in case worker service is down.

wss.on("connection", socket => {
  sockets.push(socket);

  socket.send(currentData);

  socket.on("message", data => {
    if (data !== "vote") return;
    setTimeout(() => fetchDataAndSend(sockets), 200);
  });

  socket.on("close", (code, reason) => {
    var index = sockets.indexOf(socket);
    if (index > -1) {
      console.log("removing socket");
      sockets.splice(index, 1);
    }
  });
});

server.listen(PORT, () => {
  console.log("resultsapi listening on", PORT);
});
