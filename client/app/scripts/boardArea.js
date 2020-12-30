const BOARDAREA_COMPONENT = "boardArea";
angular.module('mainApp').component(BOARDAREA_COMPONENT, boardAreaFunc());
function boardAreaFunc() {
    const controllerFunc = function (userData, gameWrapper, roundWrapper, styleHelper, hoverKeyHelper) {
        var $ctrl = this;
        $ctrl.selection = roundWrapper.getSelection();
        $ctrl.getCardIconClass = styleHelper.getCardIconClass;
        $ctrl.getSpaceClasses = getSpaceClasses;
        $ctrl.getSpacePoints = (ndx) => roundWrapper.getSpacePoints(ndx);
        $ctrl.hasGem = (index) => roundWrapper.hasGem(index);
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
        function getSpaceClasses(item, index) {
            if (typeof item === "undefined" || item == null) {
                // If there is no item here, but you're passed it, then show it's visited.
                if (roundWrapper.getSelection().currentLocation > index)
                    return "visited-space";
            }
            else {
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
    const bindings = {};
    var buyActionComponent = {
        templateUrl: 'app/views/boardArea.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return buyActionComponent;
}
//# sourceMappingURL=boardArea.js.map