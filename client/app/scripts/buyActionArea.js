const BUY_ACTION_COMPONENT = "buyActionArea";
angular.module('mainApp').component(BUY_ACTION_COMPONENT, buyActionFunc());
function buyActionFunc() {
    const controllerFunc = function (userData, gameWrapper, globalSettings, roundWrapper, styleHelper, itemBuyHelper, cardInformationHelper) {
        let endTurnWarning = false;
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        var $ctrl = this;
        $ctrl.choseToBuy = choseToBuy;
        $ctrl.choseToScore = choseToScore;
        $ctrl.endTurn = endTurn;
        $ctrl.getGemAmount = getGemAmount;
        $ctrl.getRoundMoneyAmount = getRoundMoneyAmount;
        $ctrl.getRoundPointsAmount = getRoundPointsAmount;
        $ctrl.needsToChooseBustOption = needsToChooseBustOption;
        $ctrl.isEndTurnWarning = () => endTurnWarning;
        $ctrl.isWaitingForOthers = () => roundWrapper.isWaitingOnOthers();
        $ctrl.getCardClass = styleHelper.getCardClass;
        $ctrl.getCardIconClass = styleHelper.getCardIconClass;
        $ctrl.getCardName = styleHelper.getCardName;
        $ctrl.hasBoughtEffect = (effect) => roundWrapper.buySelection.items.findIndex(item => item.effect == effect) >= 0;
        $ctrl.hasBoughtEnhancement = () => roundWrapper.buySelection.enhancements.length > 0;
        $ctrl.getItemsToBuy = getItemsToBuy;
        $ctrl.clickItemEffect = clickItemEffect;
        $ctrl.clickSpendGems = clickSpendGems;
        function choseToBuy() {
            roundWrapper.buySelection.buyingItems = true;
        }
        function choseToScore() {
            roundWrapper.buySelection.gainingPoints = true;
            // if you're chosing to score, you have nothing left to do this round.
            roundWrapper.endBuyTurn();
        }
        function endTurn() {
            // Should additionally check if there is anything left to buy with remaining money.
            // End without prompting if there is not.
            const items = gameWrapper.game.currentRound.thingsToBuy.items;
            const thingsToDoStill = roundWrapper.totalAvailableBuys > 0
                && roundWrapper.availableMoney >= Object.keys(items).reduce((cost, effect) => { items[Number(effect)].forEach(i => cost = i.cost < cost ? i.cost : cost); return cost; }, roundWrapper.availableMoney + 1);
            if (!endTurnWarning && globalSettings.assistMode && !gameWrapper.game.options.disableAssistMode) {
                // If you're in assist mode and can still buy something, put up a warning.
                if (thingsToDoStill) {
                    cardInformationHelper.showInformation("End Turn?", "You can still buy something with your remaining money.  Money goes away after the buy phase (gems do not).  Spend as much money as you can and then click the \"End\" button (or click it a second time now to end without buying).");
                }
            }
            if (!thingsToDoStill || endTurnWarning) {
                roundWrapper.endBuyTurn();
                endTurnWarning = false;
            }
            else {
                endTurnWarning = !endTurnWarning;
            }
        }
        function getRoundMoneyAmount() {
            return gameWrapper.game.currentRound.selectionResults.playerSelectionData[userData.index].moneyGains;
        }
        function getGemAmount() {
            return player.playerData.gemTotal;
        }
        function getRoundPointsAmount() {
            return gameWrapper.game.currentRound.selectionResults.playerSelectionData[userData.index].pointGains;
        }
        function needsToChooseBustOption() {
            // If both false, then user busted and hasn't picked option yet.
            return roundWrapper.buySelection.buyingItems == false && roundWrapper.buySelection.gainingPoints == false;
        }
        function getItemsToBuy() {
            return Object.keys(gameWrapper.game.currentRound.thingsToBuy.items).map(i => Number(i));
        }
        function clickItemEffect(effect) {
            endTurnWarning = false;
            itemBuyHelper.effect = effect;
        }
        function clickSpendGems() {
            endTurnWarning = false;
            itemBuyHelper.showGem = true;
        }
    };
    const bindings = {};
    var buyActionComponent = {
        templateUrl: 'app/views/buyActionArea.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return buyActionComponent;
}
//# sourceMappingURL=buyActionArea.js.map