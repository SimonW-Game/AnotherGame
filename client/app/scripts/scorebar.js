const SCOREBAR_COMPONENT = "scorebar";
angular.module('mainApp').component(SCOREBAR_COMPONENT, scorebarComponentFunc());
function scorebarComponentFunc() {
    const controllerFunc = function (userData, gameWrapper, styleHelper, roundSummaryHelper, hoverKeyHelper) {
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        var $ctrl = this;
        $ctrl.getPlayers = () => { return styleHelper.getPlayers(player); };
        $ctrl.showRoundInfo = () => roundSummaryHelper.showCurrentRound();
        $ctrl.viewScorebarInfo = () => hoverKeyHelper.show(infoKeyType.scoreboard);
        $ctrl.exitScorebarInfo = () => hoverKeyHelper.close();
        $ctrl.playerIsWinning = function (player) {
            if (player.totalScore >= gameWrapper.game.players.reduce((num, p) => num > p.playerData.totalScore ? num : p.playerData.totalScore, 0))
                return true;
            return false;
        };
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/scorebar.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=scorebar.js.map