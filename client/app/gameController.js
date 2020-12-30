const GAME_CONTROLLER = "GameController";
angular.module('mainApp').controller(GAME_CONTROLLER, ["$scope", "gameWrapper", "userData", "roundWrapper", "roundSummaryHelper", "globalSettings", "cardInformationHelper", "effectChooserHelper", "itemBuyHelper", "$timeout", gameController]);
function gameController($scope, gameWrapper, userData, roundWrapper, roundSummaryHelper, globalSettings, cardInformationHelper, effectChooserHelper, itemBuyHelper, $timeout) {
    const vm = this;
    vm.gameWrapper = gameWrapper;
    vm.userData = userData;
    vm.isPreRound = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.PreRound;
    vm.isPlayPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.PlayPhase;
    vm.isBuyPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.BuyPhase;
    vm.isEndGamePhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.GameAnalysisPhase;
    vm.startRound = startRound;
    setupSocketCallbacks();
    // If you click "ESC", close popups.
    document.body.onkeydown = function (ev) {
        if (ev.keyCode == 27 /*ESC*/) {
            roundSummaryHelper.isShowing = false;
            globalSettings.isShowing = false;
            cardInformationHelper.close();
            effectChooserHelper.closeAll();
            itemBuyHelper.close();
            $scope.$apply();
            $scope.$digest();
        }
    };
    function startRound() {
        socket.emit("startGame", gameWrapper.game.gameId, gameWrapper.game.options);
    }
    function setupSocketCallbacks() {
        socket.on("gameStarted", function (currentRoundData, options, playerDatas) {
            gameWrapper.endGameInfo = undefined;
            gameWrapper.game.options = options;
            updatePlayerData(playerDatas);
            roundWrapper.startPlayPhase(userData.index);
            gameWrapper.game.currentRound = currentRoundData;
            $scope.$digest();
        });
        socket.on("showSelectionResults", function (roundData, playerDatas) {
            gameWrapper.game.currentRound.selectionResults = roundData.selectionResults;
            gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.BuyPhase;
            roundSummaryHelper.showCurrentRound();
            updatePlayerData(playerDatas);
            const playerData = gameWrapper.game.getPlayerByIndex(userData.index).playerData;
            roundWrapper.startBuyRound(playerData);
            $scope.$apply();
        });
        socket.on("showGameResults", function (roundData, playerDatas, endGameInfo) {
            gameWrapper.game.currentRound.selectionResults = roundData.selectionResults;
            gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.GameAnalysisPhase;
            gameWrapper.endGameInfo = endGameInfo;
            // I don't think we want to force users to look at the round, but I could be mistaken.
            //roundSummaryHelper.showCurrentRound();
            updatePlayerData(playerDatas);
            $scope.$apply();
        });
        socket.on("roundEnd", function (roundData, playerDatas, currentRoundData) {
            // If last round is finished, gonna need to do something else.
            updatePlayerData(playerDatas);
            gameWrapper.game.currentRound.buySelectionData = roundData.buySelectionData;
            roundSummaryHelper.showCurrentRound();
            gameWrapper.game.completedRounds.push(gameWrapper.game.currentRound);
            gameWrapper.game.currentRound = currentRoundData;
            roundWrapper.startPlayPhase(userData.index); // Don't stop the gameplay.
            $scope.$apply();
        });
        function updatePlayerData(playerDatas) {
            // Update player data.
            playerDatas.forEach(pd => {
                gameWrapper.game.getPlayerByIndex(pd.index).playerData = pd;
            });
        }
    }
}
//# sourceMappingURL=gameController.js.map