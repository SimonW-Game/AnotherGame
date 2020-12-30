const SCOREBAR_COMPONENT = "scorebar";
angular.module('mainApp').component(SCOREBAR_COMPONENT, scorebarComponentFunc());

interface IScorebarComponent extends ng.IComponentController {
	getPlayers: () => IPlayer[];
	playerIsWinning: (player: IPlayerClientData) => boolean;
	showRoundInfo: () => void;
	viewScorebarInfo: () => void;
	exitScorebarInfo: () => void;
}

function scorebarComponentFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, styleHelper: StyleHelper, roundSummaryHelper: RoundSummaryHelper, hoverKeyHelper: HoverKeyHelper) {
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);
		var $ctrl: IScorebarComponent = this;
		$ctrl.getPlayers = () => { return styleHelper.getPlayers(player) };
		$ctrl.showRoundInfo = () => roundSummaryHelper.showCurrentRound();
		$ctrl.viewScorebarInfo = () => hoverKeyHelper.show(infoKeyType.scoreboard);
		$ctrl.exitScorebarInfo = () => hoverKeyHelper.close();

		$ctrl.playerIsWinning = function (player: IPlayerClientData): boolean {
			if (player.totalScore >= gameWrapper.game.players.reduce((num, p) => num > p.playerData.totalScore ? num : p.playerData.totalScore, 0))
				return true;
			return false;
		}

	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/scorebar.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}