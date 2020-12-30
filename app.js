"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socketIo = require("socket.io");
const socketHandler = require("./server/SocketHandler");
const app = express();
//const http = require('http');
const port = process.env.port || 1337;
//http.createServer(function (req, res) {
//	res.writeHead(200, { 'Content-Type': 'text/plain' });
//	res.end('Hello World\n');
//}).listen(port);
app.use(express.static(__dirname + '/client'));
app.get('/', (req, res) => res.sendFile(__dirname + '\\client\\views\\index.html'));
const server = app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
const io = socketIo(server, { pingTimeout: 60000, pingInterval: 10000 });
io.on('connection', (socket) => {
    socketHandler.setupSocket(io, socket);
});
// Game goes as follows:
// 1: Play your cards
// 2: See how you all did, then pick your spoils (points or spend money)
// 3: See what everyone else did.  Start new round.
//# sourceMappingURL=app.js.map