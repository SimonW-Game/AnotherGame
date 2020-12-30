const CARD_INFORMATION_POPUP_COMPONENT = "cardInformationPopup";
angular.module('mainApp').component(CARD_INFORMATION_POPUP_COMPONENT, cardInfoPopupComponentFunc());
function cardInfoPopupComponentFunc() {
    const controllerFunc = function (userData, gameWrapper, roundWrapper, styleHelper, cardInformationHelper) {
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        var $ctrl = this;
        $ctrl.cardInformationHelper = cardInformationHelper;
        $ctrl.getCardPrices = getCardPrices;
        $ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
        $ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
        $ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
        $ctrl.getCardDescription = (item) => { return styleHelper.getCardDescription(item, player, roundWrapper); };
        function getCardPrices(effect) {
            if (gameWrapper.game && gameWrapper.game.currentRound && gameWrapper.game.currentRound.thingsToBuy)
                return gameWrapper.game.currentRound.thingsToBuy.items[effect];
            return [];
        }
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/cardInformationPopup.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=cardInformationPopup.js.map