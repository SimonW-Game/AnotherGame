const CARD_INFORMATION_POPUP_COMPONENT = "cardInformationPopup";
angular.module('mainApp').component(CARD_INFORMATION_POPUP_COMPONENT, cardInfoPopupComponentFunc());

interface ICardInfoPopupComponent extends ng.IComponentController {
	cardInformationHelper: CardInformationHelper;

	getCardName: (effect: itemEffect) => string;
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	getCardDescription: (item: IItem) => string;
	getCardPrices: (effect: itemEffect) => IItem[];
}

function cardInfoPopupComponentFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, styleHelper: StyleHelper, cardInformationHelper: CardInformationHelper) {
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);
		var $ctrl: ICardInfoPopupComponent = this;
		$ctrl.cardInformationHelper = cardInformationHelper;
		$ctrl.getCardPrices = getCardPrices;
		$ctrl.getCardName = (effect: itemEffect) => styleHelper.getCardName(effect);
		$ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
		$ctrl.getCardDescription = (item: IItem) => { return styleHelper.getCardDescription(item, player, roundWrapper); };

		function getCardPrices(effect: itemEffect) {
			if (gameWrapper.game && gameWrapper.game.currentRound && gameWrapper.game.currentRound.thingsToBuy)
				return gameWrapper.game.currentRound.thingsToBuy.items[effect];
			return [];
		}
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: '/app/views/cardInformationPopup.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}