const INVENTORY_COMPONENT = "inventoryArea";
angular.module('mainApp').component(INVENTORY_COMPONENT, invectoryFunc());
var ViewType;
(function (ViewType) {
    ViewType[ViewType["round"] = 0] = "round";
    ViewType[ViewType["total"] = 1] = "total";
})(ViewType || (ViewType = {}));
function invectoryFunc() {
    const controllerFunc = function ($scope, userData, gameWrapper, roundWrapper, globalSettings, styleHelper, cardInformationHelper) {
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        // Cache the current view.  If things change, make sure to clear and repopulate this cache.
        let itemGroups = [];
        var $ctrl = this;
        $ctrl.viewType = ViewType.round;
        $ctrl.getEffectCount = getEffectCount;
        $ctrl.getCardClass = styleHelper.getCardClass;
        $ctrl.getCardIconClass = styleHelper.getCardIconClass;
        $ctrl.getCardName = styleHelper.getCardName;
        $ctrl.getCardTypes = getCardTypes;
        $ctrl.clickOnCard = clickOnCard;
        $ctrl.showEffectCount = showEffectCount;
        $ctrl.getDeckCount = getDeckCount;
        $ctrl.getPercentageForCard = getPercentageForCard;
        $ctrl.getPercentageToBust = getPercentageToBust;
        $ctrl.getCardWidth = () => (100 / Math.ceil((itemGroups.length + 1) / 2)) + "%";
        $ctrl.isAssistMode = () => globalSettings.assistMode && !gameWrapper.game.options.disableAssistMode;
        $ctrl.gameHasTimer = () => gameWrapper.game.options.enableTimeLimit;
        $ctrl.timerCountDown = () => !roundWrapper.timerHelper.secondsLeft ? "-" : String(Math.ceil(roundWrapper.timerHelper.secondsLeft));
        $ctrl.getTimerWidth = () => !roundWrapper.timerHelper.secondsLeft ? "0px" : Math.round((roundWrapper.timerHelper.secondsLeft / gameWrapper.game.options.secondsPerPhase) * 100) + "%";
        function getEffectCount(effect) {
            if (effect == itemEffect.Bane)
                return Math.max(0, player.playerData.baneThreshold - roundWrapper.getSelection().baneCount);
            else if (effect == itemEffect.SpecialNoEffect)
                return roundWrapper.selection.playedItems.reduce((count, i) => i.effect == effect ? count + 1 : count, 0);
            return 0;
        }
        function clickOnCard(effect) {
            cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ amount: 0, effect: effect, points: 0, cost: 0 }, player, roundWrapper), 0);
        }
        function getCardTypes() {
            if (itemGroups.length == 0) {
                let baseData;
                if ($ctrl.viewType == ViewType.round)
                    baseData = roundWrapper.remainingItems;
                else
                    baseData = player.playerData.items; // If this throws, we got bigger issues.
                const groupedItems = baseData.reduce((acc, item) => {
                    const key = Number(item.effect);
                    (acc[key] = acc[key] || []).push(item);
                    return acc;
                }, getDefaultEffectMap());
                itemGroups = Object.keys(groupedItems).map((itemEffectKey) => {
                    const itemEffect = Number(itemEffectKey);
                    let itemMap = groupedItems[itemEffectKey].reduce((acc, item) => {
                        let pointsKey = item.points;
                        if (item.points > 4) // For Far Moving.
                            pointsKey = 1;
                        if (item.amount > item.points)
                            pointsKey = item.amount; // extra money uses this.  Unsure if others will, it seems safe.
                        acc[pointsKey] = (acc[pointsKey] || 0) + 1;
                        return acc;
                    }, { 1: 0, 2: 0, 3: 0, 4: 0 });
                    return {
                        effect: itemEffect,
                        itemMap: itemMap
                    };
                });
            }
            return itemGroups;
        }
        function getDefaultEffectMap() {
            let defaulteffectMap = {};
            defaulteffectMap[itemEffect.Bane] = [];
            return Object.keys(gameWrapper.game.currentRound.thingsToBuy.items).reduce((acc, type) => { acc[type] = []; return acc; }, defaulteffectMap);
        }
        function showEffectCount(effect) {
            return effect == itemEffect.Bane || effect == itemEffect.SpecialNoEffect;
        }
        function getDeckCount() {
            return roundWrapper.remainingItems.length;
        }
        function getPercentageToBust() {
            if (roundWrapper.showSelectionTurnOptions(player.playerData))
                return roundWrapper.getPercentageToBust(player) + "%";
            return "-";
        }
        function getPercentageForCard() {
            if (roundWrapper.showSelectionTurnOptions(player.playerData))
                return roundWrapper.getPercentageForOneCard(player) + "%";
            return "-";
        }
        $scope.$on(CHANGE_DECK_EVENT, function (event) {
            if ($ctrl.viewType == ViewType.round)
                itemGroups = [];
        });
        $scope.$watch(_ => gameWrapper.game.roundPhaseStatus, function (newValue) {
            if (newValue == RoundPhaseStatus.BuyPhase) {
                $ctrl.viewType = ViewType.total;
            }
            else {
                $ctrl.viewType = ViewType.round;
            }
            itemGroups = [];
        });
    };
    const bindings = {};
    var buyActionComponent = {
        templateUrl: 'app/views/inventoryArea.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return buyActionComponent;
}
//# sourceMappingURL=inventoryArea.js.map