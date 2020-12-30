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
function effectAddPopupComponentFunc() {
    const controllerFunc = function (gameWrapper, styleHelper, effectChooserHelper, cardInformationHelper) {
        let activeTab = TAB_ALL;
        let effects = [];
        var $ctrl = this;
        $ctrl.options = gameWrapper.game.options;
        $ctrl.effectChooserHelper = effectChooserHelper;
        $ctrl.getAvailableEnhancements = getAvailableEnhancements;
        $ctrl.getAvailableEffects = () => effects;
        $ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
        $ctrl.getEnhancementName = (enhancement) => styleHelper.getEnhancementName(enhancement);
        $ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
        $ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
        $ctrl.choseEffect = choseEffect;
        $ctrl.clickTab = clickTab;
        $ctrl.isTabActive = (tabIndex) => tabIndex == activeTab;
        $ctrl.choseEnhancement = choseEnhancement;
        $ctrl.getEffectInfo = (effect) => cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ effect: effect, points: 0, amount: 0, cost: 0 }));
        $ctrl.getEnhancementInfo = (enhancement) => cardInformationHelper.showGem(enhancement);
        $ctrl.clickTab(TAB_ALL);
        function choseEffect(effect) {
            if (effectChooserHelper.showSlider)
                effectChooserHelper.closeEffect(effect, effectChooserHelper.amount);
            else
                effectChooserHelper.closeEffect(effect);
        }
        function choseEnhancement(enhancement) {
            effectChooserHelper.closeEnhancement(enhancement);
        }
        function getAvailableEnhancements() {
            return new Array(Number(purchaseEnhancement.CanBuyADuplicate) + 1).fill(0).map((_, ndx) => ndx);
        }
        function clickTab(tabIndex) {
            activeTab = tabIndex;
            if (tabIndex == TAB_ALL) {
                effects = new Array(Number(itemEffect.Bane) + (effectChooserHelper.includeBane ? 1 : 0)).fill(0).map((_, ndx) => ndx);
            }
            else if (tabIndex == TAB_KEY) {
                effects = [itemEffect.SpecialNoEffect, itemEffect.MoneyForSpecial, itemEffect.MovesForSpecial, itemEffect.SpecialAdjacentMover, itemEffect.BonusForKeys];
            }
            else if (tabIndex == TAB_MOVERS) {
                effects = [itemEffect.JustMove, itemEffect.MovesForSpecial, itemEffect.SpecialAdjacentMover, itemEffect.FarMoving, itemEffect.GrowingMover, itemEffect.CopyMover, itemEffect.Move5X, itemEffect.Bane1Moves2, itemEffect.MovesForGems, itemEffect.EmptyHandMoves, itemEffect.MoveNextGem];
            }
            else if (tabIndex == TAB_POINTS) {
                effects = [itemEffect.BonusForKeys, itemEffect.GrowingPoints, itemEffect.PointInvestment, itemEffect.GainPoints5X, itemEffect.GainPointPerBuy, itemEffect.PlayedMostReward, itemEffect.MoveAndPoint, itemEffect.PointsForNoGems];
            }
            else if (tabIndex == TAB_GEMS) {
                effects = [itemEffect.MoneyForSpecial, itemEffect.GemLandingExtra, itemEffect.LastCardGem, itemEffect.MovesForGems, itemEffect.EmptyHandGems, itemEffect.GainExtraGemFromHere, itemEffect.MoveNextGem, itemEffect.GemsForMoney, itemEffect.PointsForNoGems, itemEffect.MoneyForPassingGems];
            }
            else if (tabIndex == TAB_HAND) {
                effects = [itemEffect.AddToHand, itemEffect.ShuffleHand, itemEffect.CopyOfPreviousCardToHand, itemEffect.TrashItem, itemEffect.DiscardItem, itemEffect.EmptyHandGems, itemEffect.EmptyHandMoves, itemEffect.IncreaseHandSize, itemEffect.DrawLowestNonBane];
            }
            else if (tabIndex == TAB_PLAY_MORE) {
                effects = [itemEffect.BonusForKeys /*eh*/, itemEffect.CopyOfPreviousCardToHand, itemEffect.PlayedMostReward];
            }
            else if (tabIndex == TAB_BUY) {
                effects = [itemEffect.CardsCostLess, itemEffect.PointInvestment, itemEffect.GainExtraBuy, itemEffect.GainExtraMoney, itemEffect.GainPointPerBuy, itemEffect.TaxCollector, itemEffect.MoneyForPassingGems, itemEffect.GemsForMoney];
            }
            else if (tabIndex == TAB_BANE) {
                effects = [itemEffect.RemovePreviousBane, itemEffect.BaneCountRemoval, itemEffect.Bane1Moves2, itemEffect.BaneGiver];
            }
            else if (tabIndex == TAB_UNIQUE) {
                effects = [itemEffect.AddToHand, itemEffect.ShuffleHand, itemEffect.CopyOfPreviousCardToHand, itemEffect.IncreaseHandSize, itemEffect.DrawLowestNonBane];
            }
            else if (tabIndex == TAB_ATTACK) {
                effects = [itemEffect.PoisonBrewer, itemEffect.TaxCollector, itemEffect.BaneGiver, itemEffect.BaneBriber, itemEffect.Poison, itemEffect.Tax, itemEffect.Virus, itemEffect.BaneDrawer];
            }
        }
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/effectAddPopup.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=effectAddPopup.js.map