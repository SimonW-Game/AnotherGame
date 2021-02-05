const GAME_CONTROLLER: string = "GameController";
interface IGameController {
	gameWrapper: IGameWrapper;
	userData: IUserData;
	errorMessage: string;

	isPreRound: () => boolean;
	isPlayPhase: () => boolean;
	isBuyPhase: () => boolean;
	isEndGamePhase: () => boolean;
	startRound: () => void;
}
angular.module('mainApp').controller(GAME_CONTROLLER,
	["$scope", "gameWrapper", "userData", "roundWrapper", "roundSummaryHelper", "globalSettings", "cardInformationHelper", "effectChooserHelper", "itemBuyHelper", "$timeout", gameController]);
function gameController($scope: ng.IScope,
	gameWrapper: IGameWrapper,
	userData: IUserData,
	roundWrapper: RoundWrapper,
	roundSummaryHelper: RoundSummaryHelper,
	globalSettings: IGlobalSettings,
	cardInformationHelper: CardInformationHelper,
	effectChooserHelper: EffectChooserHelper,
	itemBuyHelper: ItemBuyHelper,
	$timeout: ng.ITimeoutService) {
	const vm: IGameController = this;
	vm.gameWrapper = gameWrapper;
	vm.userData = userData;

	vm.isPreRound = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.PreRound;
	vm.isPlayPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.PlayPhase;
	vm.isBuyPhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.BuyPhase;
	vm.isEndGamePhase = () => gameWrapper.game.roundPhaseStatus == RoundPhaseStatus.GameAnalysisPhase;
	vm.startRound = startRound;

	setupSocketCallbacks();

	// If you click "ESC", close popups.
	document.body.onkeydown = function (ev: KeyboardEvent) {
		if (ev.keyCode == 27/*ESC*/) {
			roundSummaryHelper.isShowing = false;
			globalSettings.isShowing = false;
			cardInformationHelper.close();
			effectChooserHelper.closeAll();
			itemBuyHelper.close();
			$scope.$apply();
			$scope.$digest();
		}
	}

	function startRound() {
		socket.emit("startGame", gameWrapper.game.gameId, gameWrapper.game.options);
	}

	function setupSocketCallbacks() {
		socket.on("restartGame", function (playerDatas: IPlayerClientData[]) {
			gameWrapper.game.resetGame();
			// Get rid of the disconnected players.
			gameWrapper.game.players = gameWrapper.game.players.filter(p => !p.isDisconnected);
			updatePlayerData(playerDatas);
			$scope.$digest();
		});
		socket.on("gameStarted", function (currentRoundData: IRoundData, options: IGameOptions, playerDatas: IPlayerClientData[]) {
			gameWrapper.endGameInfo = undefined;
			gameWrapper.game.options = options;
			updatePlayerData(playerDatas);
			roundWrapper.startPlayPhase(userData.index);
			gameWrapper.game.currentRound = currentRoundData;
			$scope.$digest();
		});
		socket.on("showSelectionResults", function (roundData: IRoundData, playerDatas: IPlayerClientData[]) {
			gameWrapper.game.currentRound.selectionResults = roundData.selectionResults;
			gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.BuyPhase;

			roundSummaryHelper.showCurrentRound();

			updatePlayerData(playerDatas);

			const playerData = gameWrapper.game.getPlayerByIndex(userData.index).playerData;
			roundWrapper.startBuyRound(playerData);
			$scope.$apply();
		});
		socket.on("roundEnd", function (roundData: IRoundData, playerDatas: IPlayerClientData[], currentRoundData: IRoundData) {
			// If last round is finished, gonna need to do something else.
			updatePlayerData(playerDatas);

			gameWrapper.game.currentRound.buySelectionData = roundData.buySelectionData;
			roundSummaryHelper.showCurrentRound();
			gameWrapper.game.completedRounds.push(gameWrapper.game.currentRound);
			gameWrapper.game.currentRound = currentRoundData;
			roundWrapper.startPlayPhase(userData.index); // Don't stop the gameplay.

			$scope.$apply();
		});
		socket.on("showGameResults", function (roundData: IRoundData, playerDatas: IPlayerClientData[], endGameInfo: IEndGameInfo) {
			gameWrapper.game.currentRound.selectionResults = roundData.selectionResults;
			gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.GameAnalysisPhase;
			gameWrapper.endGameInfo = endGameInfo;

			// I don't think we want to force users to look at the round, but I could be mistaken.
			//roundSummaryHelper.showCurrentRound();

			// Don't show people as done with phase at the end of the game.
			gameWrapper.game.players.forEach(p => p.isWaitingOnOthers = false);

			updatePlayerData(playerDatas);

			$scope.$apply();
		});
		function updatePlayerData(playerDatas: IPlayerClientData[]) {
			// Update player data.
			playerDatas.forEach(pd => {
				gameWrapper.game.getPlayerByIndex(pd.index).playerData = pd;
			});
		}
	}
}