const EFFECT_ADD_POPUP_COMPONENT = "effectAddPopup";
angular.module('mainApp').component(EFFECT_ADD_POPUP_COMPONENT, effectAddPopupComponentFunc());

const TAB_ALL = 0;
const TAB_KEY = 1;
const TAB_MOVERS = 2;
const TAB_POINTS = 3;
const TAB_GEMS = 4;
const TAB_HAND = 5;
const TAB_PLAY_MORE = 6;
const TAB_BUY = 7;
const TAB_BANE = 8;
const TAB_UNIQUE = 9;
const TAB_ATTACK = 10;

interface effectAddPopupComponent extends ng.IComponentController {
	options: IGameOptions;
	effectChooserHelper: EffectChooserHelper

	getAvailableEffects: () => itemEffect[];
	getCardName: (effect: itemEffect) => string;
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	choseEffect: (effect: itemEffect) => void;
	getEffectInfo: (effect: itemEffect) => void;
	getEnhancementInfo: (enhancement: purchaseEnhancement) => void;

	getAvailableEnhancements: () => purchaseEnhancement[];
	getEnhancementName: (enhancement: purchaseEnhancement) => string;
	choseEnhancement: (enhancement: purchaseEnhancement) => void;
	isTabActive: (tabIndex: number) => boolean;
	clickTab: (tabIndex: number) => void;
}

function effectAddPopupComponentFunc() {
	const controllerFunc = function ($scope: ng.IScope, gameWrapper: IGameWrapper, styleHelper: StyleHelper, effectChooserHelper: EffectChooserHelper, cardInformationHelper: CardInformationHelper) {
		let activeTab = TAB_ALL;
		let effects: itemEffect[] = [];
		var $ctrl: ICardInfoPopupComponent = this;
		$ctrl.options = gameWrapper.game.options;
		$ctrl.effectChooserHelper = effectChooserHelper

		$ctrl.getAvailableEnhancements = getAvailableEnhancements;
		$ctrl.getAvailableEffects = () => effects;
		$ctrl.getCardName = (effect: itemEffect) => styleHelper.getCardName(effect);
		$ctrl.getEnhancementName = (enhancement: purchaseEnhancement) => styleHelper.getEnhancementName(enhancement);
		$ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
		$ctrl.choseEffect = choseEffect;
		$ctrl.clickTab = clickTab;
		$ctrl.isTabActive = (tabIndex: number) => tabIndex == activeTab;
		$ctrl.choseEnhancement = choseEnhancement;
		$ctrl.getEffectInfo = (effect: itemEffect) => cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ effect: effect, points: 0, amount: 0, cost: 0 }));
		$ctrl.getEnhancementInfo = (enhancement: purchaseEnhancement) => cardInformationHelper.showGem(enhancement);

		$ctrl.clickTab(TAB_ALL);

		function choseEffect(effect: itemEffect) {
			if (effectChooserHelper.showSlider)
				effectChooserHelper.closeEffect(effect, effectChooserHelper.amount);
			else
				effectChooserHelper.closeEffect(effect);
		}
		function choseEnhancement(enhancement: purchaseEnhancement) {
			effectChooserHelper.closeEnhancement(enhancement);
		}

		function getAvailableEnhancements() {
			return new Array(Number(purchaseEnhancement.CanBuyADuplicate) + 1).fill(0).map((_, ndx) => <purchaseEnhancement>ndx);
		}

		function clickTab(tabIndex: number) {
			activeTab = tabIndex;
			if (tabIndex == TAB_ALL) {
				effects = new Array(Number(itemEffect.Bane) + (effectChooserHelper.includeBane ? 1 : 0)).fill(0).map((_, ndx) => <itemEffect>ndx);
			} else if (tabIndex == TAB_KEY) {
				effects = [itemEffect.SpecialNoEffect, itemEffect.GemsForKeys, itemEffect.MovesForSpecial, itemEffect.SpecialAdjacentMover, itemEffect.BonusForKeys];
			} else if (tabIndex == TAB_MOVERS) {
				effects = [itemEffect.JustMove, itemEffect.MovesForSpecial, itemEffect.SpecialAdjacentMover, itemEffect.FarMoving, itemEffect.GrowingMover, itemEffect.CopyMover, itemEffect.MoveTo5, itemEffect.Bane1Moves2, itemEffect.MovesForGems, itemEffect.EmptyHandMoves, itemEffect.MoveNextGem, itemEffect.PlayCardMovement];
			} else if (tabIndex == TAB_POINTS) {
				effects = [itemEffect.BonusForKeys, itemEffect.GrowingPoints, itemEffect.PointInvestment, itemEffect.GainPoints5X, itemEffect.GainPointPerBuy, itemEffect.PlayedMostReward, itemEffect.MoveAndPoint, itemEffect.PointsForPassingGems];
			} else if (tabIndex == TAB_GEMS) {
				effects = [itemEffect.GemsForKeys, itemEffect.GemLandingExtra, itemEffect.LastCardGem, itemEffect.MovesForGems, itemEffect.EmptyHandGems, itemEffect.FutureGemsUp, itemEffect.FuturePassingGemsUp, itemEffect.MoveNextGem, itemEffect.GemsForMoney, itemEffect.PointsForPassingGems, itemEffect.MoneyForPassingGems];
			} else if (tabIndex == TAB_HAND) {
				effects = [itemEffect.AddToHand, itemEffect.ShuffleHand, itemEffect.CopyOfPreviousCard, itemEffect.TrashItem, itemEffect.DiscardItem, itemEffect.EmptyHandGems, itemEffect.EmptyHandMoves, itemEffect.JustDrewEmptyBonus, itemEffect.JustDrewEmptyMover, itemEffect.IncreaseHandSize];
			} else if (tabIndex == TAB_PLAY_MORE) {
				effects = [itemEffect.BonusForKeys /*eh*/, itemEffect.CopyMover, itemEffect.CopyOfPreviousCard, itemEffect.PlayedMostReward];
			} else if (tabIndex == TAB_BUY) {
				effects = [itemEffect.CardsCostLess, itemEffect.PointInvestment, itemEffect.GainExtraBuy, itemEffect.GainExtraMoney, itemEffect.GainPointPerBuy, itemEffect.TaxCollector, itemEffect.MoneyForPassingGems, itemEffect.GemsForMoney];
			} else if (tabIndex == TAB_BANE) {
				effects = [itemEffect.RemovePreviousBane, itemEffect.BaneCountRemoval, itemEffect.Bane1Moves2, itemEffect.BaneGiver, itemEffect.BaneBriber];
			} else if (tabIndex == TAB_UNIQUE) {
				effects = [itemEffect.AddToHand, itemEffect.ShuffleHand, itemEffect.CopyOfPreviousCard, itemEffect.IncreaseHandSize, itemEffect.DrawLowestNonBane, itemEffect.PlayCardMovement];
			} else if (tabIndex == TAB_ATTACK) {
				effects = [itemEffect.Bane, itemEffect.PoisonBrewer, itemEffect.TaxCollector, itemEffect.BaneGiver, itemEffect.BaneBriber, itemEffect.Poison, itemEffect.Tax, itemEffect.Virus, itemEffect.BaneDrawer];
			}
		}
		$scope.$watch(_ => effectChooserHelper.includeBane, function (__) { clickTab(activeTab) });
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/effectAddPopup.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}