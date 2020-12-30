const ROUND_POPUP_COMPONENT = "roundPopup";
angular.module('mainApp').component(ROUND_POPUP_COMPONENT, roundPopupComponentFunc());

interface IRoundPopupComponent extends ng.IComponentController {
	roundSummaryHelper: RoundSummaryHelper;
	getRoundHeader: () => string;
	getWinningPlayers: () => string;
	getPlayerSelections: () => { selection: IPlayerSelectionData, player: IPlayer }[];
	getCardName: (effect: itemEffect) => string;
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	clickItem: (item: IItem) => void;
	clickEnhancement: (enhancement: purchaseEnhancement) => void;
	viewRoundSpoilsInfo: () => void;
	exitInfo: () => void;
}

function roundPopupComponentFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, styleHelper: StyleHelper, roundSummaryHelper: RoundSummaryHelper, cardInformationHelper: CardInformationHelper, hoverKeyHelper: HoverKeyHelper) {
		var $ctrl: IRoundPopupComponent = this;
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);
		$ctrl.roundSummaryHelper = roundSummaryHelper;
		$ctrl.getRoundHeader = getRoundHeader;
		$ctrl.getWinningPlayers = getWinningPlayers;
		$ctrl.getPlayerSelections = getPlayerSelections;
		$ctrl.getPlayers = () => styleHelper.getPlayers(player);
		$ctrl.getCardName = (effect: itemEffect) => styleHelper.getCardName(effect);
		$ctrl.getEnhancementName = (enhancement: purchaseEnhancement) => styleHelper.getEnhancementName(enhancement);
		$ctrl.getCardIconClass = (effect: itemEffect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect: itemEffect) => styleHelper.getCardClass(effect);
		$ctrl.clickItem = (item: IItem) => cardInformationHelper.showItem(item.effect, styleHelper.getCardDescription(item), item.points);
		$ctrl.clickEnhancement = (enhancement: purchaseEnhancement) => cardInformationHelper.showGem(enhancement);
		$ctrl.viewRoundSpoilsInfo = () => hoverKeyHelper.show(infoKeyType.roundResultSpoils);
		$ctrl.exitInfo = () => hoverKeyHelper.close();

		function getRoundHeader() {
			if (roundSummaryHelper.roundIndex == gameWrapper.game.completedRounds.length)
				return "Current Round (" + (roundSummaryHelper.roundIndex + 1) + ")";
			return "Round " + (roundSummaryHelper.roundIndex + 1);
		}

		function getWinningPlayers() {
			if (roundSummaryHelper.roundData.selectionResults.winnerIndexes.length == 0)
				return "none";
			return roundSummaryHelper.roundData.selectionResults.winnerIndexes.map(ndx => {
				return gameWrapper.game.getPlayerByIndex(ndx).playerData.username;
			}).join(", ");
		}

		function getPlayerSelections() {
			return styleHelper.getPlayers(player).map(p => {
				let info =
				{
					selection: roundSummaryHelper.roundData.selectionResults.playerSelectionData[p.playerData.index],
					player: p
				};
				return info;
			});
		}
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/roundPopup.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}