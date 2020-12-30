const ROUND_POPUP_COMPONENT = "roundPopup";
angular.module('mainApp').component(ROUND_POPUP_COMPONENT, roundPopupComponentFunc());
function roundPopupComponentFunc() {
    const controllerFunc = function (userData, gameWrapper, styleHelper, roundSummaryHelper, cardInformationHelper, hoverKeyHelper) {
        var $ctrl = this;
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        $ctrl.roundSummaryHelper = roundSummaryHelper;
        $ctrl.getRoundHeader = getRoundHeader;
        $ctrl.getWinningPlayers = getWinningPlayers;
        $ctrl.getPlayerSelections = getPlayerSelections;
        $ctrl.getPlayers = () => styleHelper.getPlayers(player);
        $ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
        $ctrl.getEnhancementName = (enhancement) => styleHelper.getEnhancementName(enhancement);
        $ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
        $ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
        $ctrl.clickItem = (item) => cardInformationHelper.showItem(item.effect, styleHelper.getCardDescription(item), item.points);
        $ctrl.clickEnhancement = (enhancement) => cardInformationHelper.showGem(enhancement);
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
                let info = {
                    selection: roundSummaryHelper.roundData.selectionResults.playerSelectionData[p.playerData.index],
                    player: p
                };
                return info;
            });
        }
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/roundPopup.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=roundPopup.js.map