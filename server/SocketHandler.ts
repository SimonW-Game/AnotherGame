import * as gameHelper from '../server/Game';
import socketIo = require('socket.io');

export function setupSocket(io: socketIo.Server, socket: socketIo.Socket) {
	try {
		let currentGameId = undefined;
		socket.on("createGame", function (username: string) {
			if (username.length < 3 || username.length > 10) {
				socket.emit('cannotJoinGame', "Username must be 3-10 characters");
			} else {
				const game = gameHelper.startNewGame();
				const newPlayer = game.addPlayer(username, socket);
				socket.join(game.gameId);
				currentGameId = game.gameId;
				socket.emit('joinedGame', game.gameId, game.getPlayers(), newPlayer.playerData.index, game.completedRounds, game.options, true);
			}
		});
		socket.on("disconnect", function (reason: string) {
			// Probably migrate host.

			// Store what game the socket is in somehow and then deal with it...
			const game = gameHelper.getGame(currentGameId);
			if (typeof game !== "undefined") {
				const removedPlayer = game.removePlayer(socket);
				if (!game.hasPlayers()) { // If all players disconnected, remove the game
					gameHelper.removeGame(currentGameId);
				} else { // Otherwise let everyone know that you left :(
					// If the host disconnected, make someone else the host.
					if (game.hostIndex == removedPlayer.playerData.index) {
						let player = game.getConnectedPlayer(); // Has to be something as game.hasPlayers() is true.
						game.hostIndex = player.playerData.index;
					}
					io.in(game.gameId).emit("removedPlayer", removedPlayer.playerData.index, game.hasGameNotStarted(), game.hostIndex);
				}
				currentGameId = undefined;
			}
		});
		socket.on("joinGame", function (gameId: string, username: string) {
			const game = gameHelper.getGame(gameId);
			if (typeof game === "undefined") {
				socket.emit('cannotJoinGame', "Game ID does not exist");
			}
			else if (username.length < 3 || username.length > 10) {
				socket.emit('cannotJoinGame', "Username must be 3-10 characters");
			}
			else {
				if (game.hasGameNotStarted()) {
					if (game.getPlayers().findIndex(p => p.username == username) === -1) {
						const newPlayer = game.addPlayer(username, socket);
						currentGameId = gameId;
						socket.join(gameId);
						socket.emit('joinedGame', game.gameId, game.getPlayers(), newPlayer.playerData.index, game.completedRounds, game.options, false);
						socket.to(gameId).emit("playerJoined", newPlayer.playerData);
					} else {
						socket.emit('cannotJoinGame', "Username taken");
					}
				}
				else if (game.hasDisconnectedPlayers()) {
					let player = game.reconnected(username, socket);
					if (player === undefined) {
						socket.emit('cannotJoinGame', "Must match existing username");
					} else {
						currentGameId = gameId;
						socket.join(gameId);
						const selection: ISelection = game.round.playerSelections[player.playerData.index];
						const buySelection: IBuySelection = game.round.playerBuySelections[player.playerData.index];
						// update who is finished selecting.
						socket.emit('reconnectedToGame', game.gameId, game.getPlayers(), player.playerData.index, game.completedRounds, game.round.roundData, selection, buySelection, game.options, false);
						socket.to(gameId).emit("playerReconnected", player.playerData);
					}
				}
				else {
					socket.emit('cannotJoinGame', "Game is in session");
				}
			}
		});

		// Make sure everyone is ready and then start a new round.
		// This includes the beginning of the game and before each new round.
		socket.on("startGame", function (gameId: string, options: IGameOptions) {
			try {
				const game = gameHelper.getGame(gameId);
				if (typeof game !== "undefined") {
					game.options = options;
					game.startGame();
					game.startRound();
					io.in(gameId).emit("gameStarted", game.round.roundData, game.options, game.getPlayers());
				}
			} catch (e) {
				console.log(e);
			}
		});
		socket.on("updateOptions", function (gameId: string, options: IGameOptions) {
			try {
				const game = gameHelper.getGame(gameId);
				if (typeof game !== "undefined") {
					game.options = options;
					socket.broadcast.to(gameId).emit("updatedOptions", game.options);
				}
			} catch (e) {
				console.log(e);
			}
		});
		socket.on("setOptionMode", function (gameId: string, modeIndex: number) {
			try {
				const game = gameHelper.getGame(gameId);
				if (typeof game !== "undefined") {
					game.setOptionMode(modeIndex);
					socket.emit("updatedOptions", game.options); // emit to self as host will populate changes /shrug.
				}
			} catch (e) {
				console.log(e);
			}
		});

		// After everyone has picked all their "cards" and are done for the round.
		socket.on("finishSelecting", function (gameId: string, selection: ISelection) {
			const game = gameHelper.getGame(gameId);
			if (typeof game !== "undefined") {
				const player: gameHelper.Player = game.getPlayer(socket);
				game.playerCompletedSelecting(player, selection);
				if (game.allPlayersSelected()) {
					game.calculateSelectionResults();
					// If you finished the selection phase of the last round, then the game is done!
					if (game.completedRounds.length == game.options.totalRounds - 1) {
						let endGameInfo = game.calculateGameResults();
						io.in(gameId).emit("showGameResults", game.round.roundData, game.getPlayers(), endGameInfo);
					} else {
						io.in(gameId).emit("showSelectionResults", game.round.roundData, game.getPlayers());
					}
				} else {
					io.in(gameId).emit("playerFinishedSelecting", player.playerData.index);
				}
			}
		});

		// After everyone picks what they will get at the end of the round (points, new cards, ability, whatever else gets implemented).
		socket.on("finishBuying", function (gameId: string, buySelection: IBuySelection) {
			const game = gameHelper.getGame(gameId);
			if (typeof game !== "undefined") {
				const player = game.getPlayer(socket);
				game.playerCompletedBuyingAndScoring(player, buySelection);
				if (game.allPlayersBoughtAndScored()) {
					const finishedRoundData = game.calculateRoundResults();
					io.in(gameId).emit("roundEnd", finishedRoundData, game.getPlayers(), game.round.roundData);
				} else {
					io.in(gameId).emit("playerFinishedSelecting", player.playerData.index);
				}
			}
		});
	} catch (e) {
		console.log(e);
	}
}