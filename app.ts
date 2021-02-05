import express = require('express');
import socketIo = require('socket.io');
import socketHandler = require('./server/SocketHandler');
import { minifyClient } from './minify.config';
import { getGameCount, getPlayerCount } from './server/Game';
const app = express();
app.set('view engine', 'ejs');
const port = process.env.port || 8080;
let isDev = !process.argv || process.argv.length < 3 || process.argv[2] != "production";
let clientDir: string;
if (isDev) {
	clientDir = __dirname + '/client';
} else {
	clientDir = __dirname + '/dist';
	minifyClient();
}
app.use(express.static(clientDir));

app.get('/', (req, res) => {
	res.render(clientDir + '/views/index.ejs', { code: "", name: "", ishost: false, isDev: isDev });
});
app.get('/createOrJoin/:code', (req, res) => {
	const code = req.params.code;
	res.render(clientDir + '/views/index.ejs', { code: code, name: req.query.name || "", ishost: req.query.ishost || false, isDev: isDev });
});

app.get('/rules', (req, res) => {
	res.render(clientDir + '/views/rules.ejs', { isDev: isDev });
});

app.get('/admin', (req, res) => {
	res.render(clientDir + '/views/admin.ejs', { gameCount: getGameCount(), playerCount: getPlayerCount() });
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