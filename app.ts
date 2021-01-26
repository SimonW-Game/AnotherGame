import express = require('express');
import socketIo = require('socket.io');
import socketHandler = require('./server/SocketHandler');
import fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
//const http = require('http');


const port = process.env.port || 8080;


//http.createServer(function (req, res) {
//	res.writeHead(200, { 'Content-Type': 'text/plain' });
//	res.end('Hello World\n');
//}).listen(port);

app.use(express.static(__dirname + '/client'))
app.get('/', (req, res) => res.render(__dirname + '/client/views/index.ejs', { code: "", name: "", ishost: false }));
app.get('/createOrJoin/:code', (req, res) => {
	const code = req.params.code;
	res.render(__dirname + '/client/views/index.ejs', { code: code, name: req.query.name || "", ishost: req.query.ishost || false });
});

app.get('/rules', (req, res) => {
	res.sendFile(__dirname + '/client/views/rules.html');
});

const server = app.listen(port, () => console.log(`listening at http://localhost:${port}`));

const io = socketIo(server, { pingTimeout: 120000, pingInterval: 25000 /*Default*/ });
io.on('connection', (socket: socketIo.Socket) => {
	socketHandler.setupSocket(io, socket);

});


// Game goes as follows:
// 1: Play your cards
// 2: See how you all did, then pick your spoils (points and/or spend money)
// 3: See what everyone else did.  Start new round.