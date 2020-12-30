const ITEM_BUY_POPUP_COMPONENT = "itemBuyPopup";
angular.module('mainApp').component(ITEM_BUY_POPUP_COMPONENT, itemBuyPopupComponentFunc());

interface IItemBuyPopupComponent extends ng.IComponentController {
	itemBuyHelper: ItemBuyHelper;

	buyItem: (item: IItem) => void;
	getItemsToBuy: () => IItem[];
	getHeader: () => string;
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	getDescription: () => string;
	canBuyClass: (item: IItem) => boolean;
	buyEnhancement: (enhancement: purchaseEnhancement) => void;
	canBuyEnhancement: (enhancement: purchaseEnhancement) => boolean;
	getEnhancementCost: (enhancement: purchaseEnhancement) => number;
	getEnhancementsToBuy: () => purchaseEnhancement[];
	getEnhancementName: (enhancement: purchaseEnhancement) => string;
	getEnhancementInfo: (enhancement: purchaseEnhancement) => void;
	getRemainingMoneyToSpend: () => number;
	getRemainingBuys: () => number;
	getRemainingGemsToSpend: () => number;
	getItemCost: (item: IItem) => number;
	getCheckMarkClass: (item: IItem) => string;
	getCheckMarkClassForEnahancement: (enhancement: purchaseEnhancement) => string;
	hasBoughtEnhancement: (enhancement: purchaseEnhancement) => boolean;
	refundEnhancement: (enhancement: purchaseEnhancement) => void;
	hasBoughtItem: (item: IItem) => boolean;
	refundItem: (item: IItem) => void;
}

function itemBuyPopupComponentFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, styleHelper: StyleHelper, itemBuyHelper: ItemBuyHelper, cardInformationHelper: CardInformationHelper) {
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);
		var $ctrl: IItemBuyPopupComponent = this;
		$ctrl.itemBuyHelper = itemBuyHelper;
		$ctrl.getHeader = getHeader;
		$ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
		$ctrl.getDescription = getDescription;
		$ctrl.getRemainingMoneyToSpend = () => roundWrapper.availableMoney;
		$ctrl.getRemainingBuys = () => roundWrapper.totalAvailableBuys;
		$ctrl.getRemainingGemsToSpend = () => roundWrapper.availableGems;
		$ctrl.getCheckMarkClass = getCheckMarkClass;
		$ctrl.getCheckMarkClassForEnahancement = getCheckMarkClassForEnahancement;
		$ctrl.hasBoughtEnhancement = (enhancement: purchaseEnhancement) => roundWrapper.haveBoughtEnhancement(enhancement);
		$ctrl.hasBoughtItem = (item: IItem) => roundWrapper.haveBoughtItem(item);

		$ctrl.buyEnhancement = buyEnhancement;
		$ctrl.canBuyEnhancement = canBuyEnhancement;
		$ctrl.getEnhancementCost = getEnhancementCost;
		$ctrl.getEnhancementsToBuy = getEnhancementsToBuy;
		$ctrl.getEnhancementName = (enhancement: purchaseEnhancement) => styleHelper.getEnhancementName(enhancement);
		$ctrl.getEnhancementInfo = (enhancement: purchaseEnhancement) => cardInformationHelper.showGem(enhancement);
		$ctrl.refundEnhancement = refundEnhancement;
		$ctrl.refundItem = refundItem;

		$ctrl.getItemsToBuy = () => gameWrapper.game.currentRound.thingsToBuy.items[itemBuyHelper.effect];
		$ctrl.buyItem = buyItem;
		$ctrl.canBuyClass = (item: IItem) => roundWrapper.canBuyItem(item);
		$ctrl.getItemCost = (item: IItem) => item.cost - roundWrapper.cardDiscount;

		function getHeader() {
			if (itemBuyHelper.showGem)
				return "Spend Gems";
			return styleHelper.getCardName(itemBuyHelper.effect);
		}
		function getDescription() {
			if (itemBuyHelper.showGem)
				return "Spend your hard earned gems by enhancing various things to help you win.";
			return styleHelper.getCardDescription({ amount: 0, cost: 0, effect: itemBuyHelper.effect, points: 0 }, player, roundWrapper);
		}

		function buyItem(item: IItem) {
			roundWrapper.buyItem(item);
		}

		function getItemsToBuy() {
			return gameWrapper.game.currentRound.thingsToBuy.items;
		}

		function canBuyEnhancement(enhancement: purchaseEnhancement) {
			return roundWrapper.canBuyEnhancement(enhancement, $ctrl.getEnhancementCost(enhancement), player);
		}
		function buyEnhancement(enhancement: purchaseEnhancement) {
			roundWrapper.buyEnhancement(enhancement, $ctrl.getEnhancementCost(enhancement), player);
		}
		function getEnhancementCost(enhancement: purchaseEnhancement) {
			return gameWrapper.game.currentRound.thingsToBuy.enhancments.find(en => en.enhancement == enhancement).cost
				+ roundWrapper.getAdditionalEnhancementCost(enhancement);
		}
		function getEnhancementsToBuy() {
			return gameWrapper.game.currentRound.thingsToBuy.enhancments.map(en => en.enhancement);
		}
		function refundEnhancement(enhancement: purchaseEnhancement) {
			const enhancementNdx = roundWrapper.buySelection.enhancements.findIndex(e => e == enhancement);
			if (enhancementNdx >= 0)
				roundWrapper.refundEnhancement(enhancementNdx, enhancement)
		}
		function refundItem(item: IItem) {
			// roundWrapper will not allow you to refund if you haven't bought one.
			roundWrapper.refundItem(item);
		}
		function getCheckMarkClass(item: IItem) {
			const previouslyBoughtAmt = roundWrapper.buySelection.items.reduce((amt, i) => amt += i.points == item.points && i.amount == item.amount && i.effect == item.effect ? 1 : 0, 0);
			if (previouslyBoughtAmt == 1)
				return "fa fa-check";
			if (previouslyBoughtAmt == 2)
				return "fa fa-check-double";
			if (previouslyBoughtAmt > 2)
				return "fa fa-check-circle";
			return "";
		}
		function getCheckMarkClassForEnahancement(enhancement: purchaseEnhancement) {
			const previouslyBoughtAmt = roundWrapper.buySelection.enhancements.reduce((amt, e) => amt += e == enhancement ? 1 : 0, 0);
			if (previouslyBoughtAmt == 1)
				return "fa fa-check";
			if (previouslyBoughtAmt == 2)
				return "fa fa-check-double";
			if (previouslyBoughtAmt > 2)
				return "fa fa-check-circle";
			return "";
		}
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/itemBuyPopup.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}