const BOARDAREA_COMPONENT = "boardArea";
angular.module('mainApp').component(BOARDAREA_COMPONENT, boardAreaFunc());

interface IBoardAreaController extends ng.IComponentController {
	selection: ISelection;
	game: Game;
	getCardIconClass: (itemEffect: itemEffect) => string;
	getSpaceClasses: (item: IItem, index: number) => string;
	getSpacePoints: (index: number) => number;
	isStartingSpace: (index: number) => boolean;
	hasGem: (index: number) => boolean;
	isPlayPhase: () => boolean;
	isBuyPhase: () => boolean;
	getRemainingMoneyToSpend: () => number;
	getRemainingGemsToSpend: () => number;
	getRemainingBuys: () => number;
	getBoardItems: () => IItem[];
	viewCurrencyInfo: () => void;
	viewBoardSpaceInfo: () => void;
	exitInfo: () => void;
}

function boardAreaFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, styleHelper: StyleHelper, hoverKeyHelper: HoverKeyHelper) {
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);
		var $ctrl: IBoardAreaController = this;
		$ctrl.selection = roundWrapper.getSelection();
		$ctrl.game = gameWrapper.game;

		$ctrl.getCardIconClass = styleHelper.getCardIconClass;
		$ctrl.getSpaceClasses = getSpaceClasses;
		$ctrl.getSpacePoints = (ndx) => roundWrapper.getSpacePoints(ndx);
		$ctrl.isStartingSpace = (ndx) => ndx == player.playerData.startingPosition + roundWrapper.getExtraStartingPoint(player.playerData.index);
		$ctrl.hasGem = (index: number) => roundWrapper.hasGem(index, player.playerData);
		$ctrl.isPlayPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.PlayPhase;
		$ctrl.isBuyPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.BuyPhase;
		$ctrl.getRemainingMoneyToSpend = () => roundWrapper.availableMoney;
		$ctrl.getRemainingMoneyToSpend = getRemainingMoneyToSpend;
		$ctrl.getRemainingGemsToSpend = getRemainingGemsToSpend;
		$ctrl.getBoardItems = () => roundWrapper.boardItems;
		$ctrl.getRemainingBuys = () => $ctrl.isBuyPhase() ? roundWrapper.totalAvailableBuys : roundWrapper.selection.additionalBuys;
		$ctrl.viewCurrencyInfo = () => hoverKeyHelper.show($ctrl.isBuyPhase() ? infoKeyType.currencyBuy : infoKeyType.currencySelection);
		$ctrl.viewBoardSpaceInfo = () => hoverKeyHelper.show(infoKeyType.boardSpace);
		$ctrl.exitInfo = () => hoverKeyHelper.close();

		function getSpaceClasses(item: IItem, index: number): string {
			if (typeof item === "undefined" || item == null) {
				// If there is no item here, but you're passed it, then show it's visited.
				if (roundWrapper.getSelection().currentLocation > index)
					return "visited-space";
			} else {
				return styleHelper.getCardClass(item.effect);
			}
			return "";
		}
		function getRemainingMoneyToSpend() {
			if ($ctrl.isBuyPhase())
				return roundWrapper.availableMoney;
			else
				return roundWrapper.selection.currentLocation + roundWrapper.selection.moneyGains;
		}
		function getRemainingGemsToSpend() {
			if ($ctrl.isBuyPhase())
				return roundWrapper.availableGems;
			else
				return roundWrapper.selection.gemGains;
		}
	};

	const bindings = {

	};

	var buyActionComponent = <ng.IComponentOptions>{
		templateUrl: '/app/views/boardArea.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return buyActionComponent;
}