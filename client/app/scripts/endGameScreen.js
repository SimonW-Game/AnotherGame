const END_GAME_COMPONENT = "endGameScreen";
angular.module('mainApp').component(END_GAME_COMPONENT, endGameScreenComponentFunc());
function endGameScreenComponentFunc() {
    const controllerFunc = function (userData, gameWrapper, roundWrapper, styleHelper, itemBuyHelper, hoverKeyHelper) {
        var $ctrl = this;
        $ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
        $ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
        $ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
        $ctrl.getEnhancementName = (enhancement) => styleHelper.getEnhancementName(enhancement);
        $ctrl.getPlayers = () => gameWrapper.endGameInfo.players;
        $ctrl.getPlayerItems = getPlayerItems;
        $ctrl.getPlayerEnhancements = getPlayerEnhancements;
        $ctrl.didPlayerWin = (player) => player.playerData.totalScore == gameWrapper.endGameInfo.players[0].playerData.totalScore;
        $ctrl.getBonuses = () => Object.keys(gameWrapper.endGameInfo.endGameBonuses).map(ndx => Number(ndx));
        $ctrl.getBonusName = (bonus) => styleHelper.getEndGameBonusName(bonus);
        $ctrl.getBonusAmount = (bonus) => Math.abs(gameWrapper.endGameInfo.endGameBonuses[bonus].winningAmount);
        $ctrl.getBonusWinners = getBonusWinners;
        $ctrl.getBonusPointAmount = () => gameWrapper.game.options.pointsPerEndGameBonus;
        $ctrl.viewEndGameInfo = () => hoverKeyHelper.show(infoKeyType.endGame);
        $ctrl.exitInfo = () => hoverKeyHelper.close();
        function getPlayerItems(player) {
            player.playerData.items.sort(function (a, b) { return (a.effect * 10 + a.points) - (b.effect * 10 + b.points); });
            return player.playerData.items;
        }
        function getPlayerEnhancements(player) {
            player.playerData.totalEnhancements.sort(function (a, b) { return a - b; });
            return player.playerData.totalEnhancements;
        }
        function getBonusWinners(bonus) {
            let winners = gameWrapper.endGameInfo.endGameBonuses[bonus].winners.map(ndx => {
                return gameWrapper.endGameInfo.players.find(p => p.playerData.index == ndx).playerData.username;
            }).join(", ");
            return winners;
        }
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/endGameScreen.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=endGameScreen.js.map