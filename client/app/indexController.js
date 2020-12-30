const USERNAME_KEY = "Soup_Username";
const GAME_ID_KEY = "Soup_GameId";
const INDEX_CONTROLLER = "IndexController";
angular.module('mainApp').controller(INDEX_CONTROLLER, ["$scope", "gameWrapper", "roundWrapper", "userData", "globalSettings", "hoverKeyHelper", "$timeout", indexController]);
function indexController($scope, gameWrapper, roundWrapper, userData, globalSettings, hoverKeyHelper, $timeout) {
    const vm = this;
    vm.globalSettings = globalSettings;
    vm.gameWrapper = gameWrapper;
    vm.errorMessage = "";
    vm.userData = userData;
    vm.userData.username = localStorage.getItem(USERNAME_KEY) || "";
    vm.userData.index = -1;
    vm.gameId = localStorage.getItem(GAME_ID_KEY) ?? "";
    vm.createGame = createGame;
    vm.getBodyScaleClass = getBodyScaleClass;
    vm.isValidUsername = isValidUsername;
    vm.joinGame = joinGame;
    vm.getHeaderText = getHeaderText;
    vm.viewTutorialInfo = () => hoverKeyHelper.show(infoKeyType.tapTutorial);
    vm.exitInfo = () => hoverKeyHelper.close();
    let scaleSetting = localStorage.getItem(SCALE_SETTINGS);
    if (!isNaN(Number(scaleSetting)))
        globalSettings.scaleOption = Number(scaleSetting);
    let assistSetting = localStorage.getItem(ASSIST_SETTINGS);
    globalSettings.assistMode = assistSetting == null ? true : !!assistSetting;
    setupSocketCallbacks();
    function createGame() {
        setUsernameInStorage();
        socket.emit("createGame", vm.userData.username);
    }
    function isValidUsername() {
        return vm.userData.username.length > 1;
    }
    function getBodyScaleClass() {
        if (globalSettings.scaleOption == 1)
            return "scale-size-larger";
        if (globalSettings.scaleOption == 2)
            return "scale-size-medium";
        if (globalSettings.scaleOption == 3)
            return "scale-size-small";
        return "";
    }
    function joinGame() {
        setUsernameInStorage();
        socket.emit("joinGame", vm.gameId, vm.userData.username);
    }
    function setUsernameInStorage() {
        try {
            localStorage.setItem(USERNAME_KEY, vm.userData.username);
        }
        catch (e) { }
    }
    function getHeaderText() {
        if (gameWrapper.game)
            return "Round " + (gameWrapper.game.completedRounds.length + 1);
        return "";
    }
    function setupSocketCallbacks() {
        socket.on("cannotJoinGame", function (message) {
            vm.errorMessage = message;
            $timeout(() => {
                vm.errorMessage = "";
            }, 10000);
            $scope.$digest();
        });
        socket.on("joinedGame", function (gameId, players, index, completedRounds, options, isHost) {
            localStorage.setItem(GAME_ID_KEY, vm.gameId); // Remember in case disconnected to join easier. Will remove if it's not cleared properly.
            vm.gameId = "";
            gameWrapper.game = new Game(gameId, players.map(pd => { return { playerData: pd, isDisconnected: false, isWaitingOnOthers: false }; }), completedRounds, options);
            vm.userData.isHost = isHost;
            vm.userData.index = index;
            console.log("joined game" + vm.gameId);
            $scope.$digest();
        });
        socket.on("reconnectedToGame", function (gameId, players, index, completedRounds, currentRoundData, selection, buySelection, options, isHost) {
            localStorage.setItem(GAME_ID_KEY, vm.gameId); // Remember in case disconnected to join easier. Will remove if it's not cleared properly.
            vm.gameId = "";
            vm.userData.index = index;
            gameWrapper.game = new Game(gameId, players.map(pd => { return { playerData: pd, isDisconnected: false, isWaitingOnOthers: false }; }), completedRounds, options);
            gameWrapper.game.currentRound = currentRoundData;
            if (typeof currentRoundData.selectionResults === "undefined") {
                roundWrapper.startPlayPhase(userData.index);
                if (selection) {
                    roundWrapper.forceWaitingOnServer(); // if you already selected, then continue waiting.
                    roundWrapper.selection = selection;
                    setTimeout(() => { roundWrapper.scrollToIndex(selection.currentLocation); }, 100);
                }
            }
            else {
                gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.BuyPhase;
                roundWrapper.startBuyRound(gameWrapper.game.getPlayerByIndex(userData.index).playerData);
                if (selection)
                    roundWrapper.selection = selection;
                if (buySelection) {
                    roundWrapper.buySelection = buySelection;
                    roundWrapper.forceWaitingOnServer(); // if you already bought, then continue waiting.
                }
            }
            vm.userData.isHost = isHost;
            vm.userData.index = index;
            console.log("joined game" + vm.gameId);
            $scope.$digest();
        });
        socket.on("playerJoined", function (playerData) {
            console.log("playerJoined: " + playerData.username);
            gameWrapper.game.addPlayer(playerData);
            $scope.$digest();
        });
        socket.on("playerReconnected", function (playerData) {
            console.log("playerReconnected: " + playerData.username);
            const player = gameWrapper.game.players.find(p => p.isDisconnected && p.playerData.username == playerData.username);
            if (player) {
                player.isDisconnected = false;
            }
            else {
                gameWrapper.game.players.push({ isDisconnected: false, playerData: playerData, isWaitingOnOthers: false });
            }
            $scope.$digest();
        });
        socket.on("playerFinishedSelecting", function (playerIndex) {
            gameWrapper.game.getPlayerByIndex(playerIndex).isWaitingOnOthers = true;
            $scope.$digest();
        });
        socket.on("removedPlayer", function (index, hasGameNotStarted, newHostIndex) {
            console.log("playerLeft: " + index);
            gameWrapper.game.playerDisconnected(index, hasGameNotStarted);
            if (newHostIndex == userData.index)
                userData.isHost = true;
            $scope.$digest();
        });
        socket.on("updatedOptions", function (options, gameMode) {
            gameWrapper.game.options = options;
            gameWrapper.gameMode = gameMode;
            $scope.$digest();
        });
    }
}
//# sourceMappingURL=indexController.js.map