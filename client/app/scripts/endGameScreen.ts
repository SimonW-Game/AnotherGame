const END_GAME_COMPONENT = "endGameScreen";
angular.module('mainApp').component(END_GAME_COMPONENT, endGameScreenComponentFunc());

interface IEndGameComponent extends ng.IComponentController {
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	getCardName: (effect: itemEffect) => string;
	getEnhancementName: (enhancement: purchaseEnhancement) => string;
	getPlayers: () => IEndGamePlayerInfo[]
	getPlayerItems: (player: IEndGamePlayerInfo) => IItem[];
	getPlayerEnhancements: (player: IEndGamePlayerInfo) => purchaseEnhancement[];
	didPlayerWin: (player: IEndGamePlayerInfo) => boolean;
	getBonuses: () => endGameBonus[];
	getBonusName: (bonus: endGameBonus) => string;
	getBonusAmount: (bonus: endGameBonus) => number;
	getBonusWinners: (bonus: endGameBonus) => string;
	viewEndGameInfo: () => void;
	exitInfo: () => void;
	startNewGame: () => void;
}

function endGameScreenComponentFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, styleHelper: StyleHelper, itemBuyHelper: ItemBuyHelper, hoverKeyHelper: HoverKeyHelper) {
		var $ctrl: IEndGameComponent = this;
		$ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
		$ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
		$ctrl.getEnhancementName = (enhancement) => styleHelper.getEnhancementName(enhancement);
		$ctrl.getPlayers = () => gameWrapper.endGameInfo.players;
		$ctrl.getPlayerItems = getPlayerItems;
		$ctrl.getPlayerEnhancements = getPlayerEnhancements;
		$ctrl.didPlayerWin = (player: IEndGamePlayerInfo) => player.playerData.totalScore == gameWrapper.endGameInfo.players[0].playerData.totalScore;
		$ctrl.getBonuses = () => Object.keys(gameWrapper.endGameInfo.endGameBonuses).map(ndx => <endGameBonus>Number(ndx));
		$ctrl.getBonusName = (bonus: endGameBonus) => styleHelper.getEndGameBonusName(bonus);
		$ctrl.getBonusAmount = (bonus: endGameBonus) => Math.abs(gameWrapper.endGameInfo.endGameBonuses[bonus].winningAmount);
		$ctrl.getBonusWinners = getBonusWinners;
		$ctrl.getBonusPointAmount = () => gameWrapper.game.options.pointsPerEndGameBonus;
		$ctrl.viewEndGameInfo = () => hoverKeyHelper.show(infoKeyType.endGame);
		$ctrl.exitInfo = () => hoverKeyHelper.close();
		$ctrl.startNewGame = startNewGame;
		$ctrl.isHost = () => userData.isHost;

		function getPlayerItems(player: IEndGamePlayerInfo) {
			player.playerData.items.sort(function (a, b) { return (a.effect * 10 + a.points) - (b.effect * 10 + b.points) });
			return player.playerData.items;
		}
		function getPlayerEnhancements(player: IEndGamePlayerInfo) {
			player.playerData.totalEnhancements.sort(function (a, b) { return a - b });
			return player.playerData.totalEnhancements;
		}
		function getBonusWinners(bonus: endGameBonus) {
			let winners = gameWrapper.endGameInfo.endGameBonuses[bonus].winners.map(ndx => {
				return gameWrapper.endGameInfo.players.find(p => p.playerData.index == ndx).playerData.username;
			}).join(", ");
			return winners;
		}
		function startNewGame() {
			socket.emit("startNewGame", gameWrapper.game.gameId);
		}
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: '/app/views/endGameScreen.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}