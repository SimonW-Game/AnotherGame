const PREGAME_SETTINGS_COMPONENT = "pregameSettings";
angular.module('mainApp').component(PREGAME_SETTINGS_COMPONENT, pregameSettingsFunc());

interface IPregameSettingsController extends ng.IComponentController {
	game: Game;

	getInfo: (item: IItem) => void;
	getCardName: (effect: itemEffect) => string;
	getEnhancementName: (enhancement: purchaseEnhancement) => string;
	getCardIconClass: (effect: itemEffect) => string;
	getCardClass: (effect: itemEffect) => string;
	getCardDescription: (item: IItem) => string;
	removeFromHand: (item: IItem) => void;
	addCardToHand: () => void;
	getModeName: (ndx: number) => string;
	setMode: (ndx: number) => void;
	getEffectInfo: (effect: itemEffect) => void;

	getRoundArray: () => number[];
	getAllPerks: () => noHandPerk[];
	getPerkName: (perk: noHandPerk) => string;
	togglePerk: (perk: noHandPerk) => void;

	getNewCardEffectForRound: (roundIndex: number) => itemEffect[];
	removeFromNewEffectsInRound: (roundIndex: number, effect: itemEffect) => void;
	addEffectToRound: (roundIndex: number) => void;

	getForceBuysForRound: (roundIndex: number) => IItem[];
	removeFromForceBuysInRound: (roundIndex: number, item: IItem) => void;
	addForceCardToRound: (roundIndex: number) => void;

	getEnhancementsForRound: (roundIndex: number) => purchaseEnhancement[];
	removeFromEnhancementsInRound: (roundIndex: number, item: purchaseEnhancement) => void;
	addEnhancementToRound: (roundIndex: number) => void;
	getEnhancementInfo: (enhancement: purchaseEnhancement) => void;

	getEndGameBonuses: (roundIndex: number) => endGameBonus[];
	getEndGameBonusName: (bonus: endGameBonus) => string;
	toggleEndGameBonus: (bonus: endGameBonus) => void;
}

function pregameSettingsFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, styleHelper: StyleHelper, cardInformationHelper: CardInformationHelper, effectChooserHelper: EffectChooserHelper, $scope: ng.IScope, $timeout: ng.ITimeoutService) {
		let internalMode = 0;

		var $ctrl: IPregameSettingsController = this;
		$ctrl.game = gameWrapper.game;
		$ctrl.getEnhancementName = (enhancement: purchaseEnhancement) => styleHelper.getEnhancementName(enhancement);
		$ctrl.getCardName = (effect: itemEffect) => styleHelper.getCardName(effect);
		$ctrl.getCardIconClass = (effect: itemEffect) => styleHelper.getCardIconClass(effect);
		$ctrl.getCardClass = (effect: itemEffect) => styleHelper.getCardClass(effect);
		$ctrl.getCardDescription = (item: IItem) => { return styleHelper.getCardDescription(item); };
		$ctrl.getInfo = (item: IItem) => cardInformationHelper.showItem(item.effect, styleHelper.getCardDescription(item), item.points);
		$ctrl.getEnhancementInfo = (enhancement: purchaseEnhancement) => cardInformationHelper.showGem(enhancement);
		$ctrl.getEffectInfo = (effect: itemEffect) => cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ effect: effect, points: 0, amount: 0, cost: 0 }));
		$ctrl.removeFromHand = (item: IItem) => gameWrapper.game.options.startingHand.splice(gameWrapper.game.options.startingHand.findIndex(i => i == item), 1);
		$ctrl.addCardToHand = addCardToHand;
		$ctrl.getRoundArray = getRoundArray;
		$ctrl.setMode = setMode;
		$ctrl.getModeName = getModeName;
		$ctrl.getAllPerks = getAllPerks;
		$ctrl.getPerkName = (perk: noHandPerk) => styleHelper.getPerkName(perk);
		$ctrl.togglePerk = togglePerk;
		$ctrl.getEndGameBonuses = getEndGameBonuses;
		$ctrl.getEndGameBonusName = (bonus: endGameBonus) => styleHelper.getEndGameBonusName(bonus);
		$ctrl.toggleEndGameBonus = toggleEndGameBonus;

		$ctrl.getNewCardEffectForRound = (roundIndex: number) => $ctrl.game.options.effectsAvailable[roundIndex];
		$ctrl.removeFromNewEffectsInRound = removeFromNewEffectsInRound;
		$ctrl.addEffectToRound = (roundIndex: number) => effectChooserHelper.openEffect((effect) => { if ($ctrl.game.options.effectsAvailable[roundIndex].indexOf(effect) == -1) $ctrl.game.options.effectsAvailable[roundIndex].push(effect); });

		$ctrl.getForceBuysForRound = (roundIndex: number) => $ctrl.game.options.forceBuys[roundIndex];
		$ctrl.removeFromForceBuysInRound = (roundIndex: number, item: IItem) => $ctrl.game.options.forceBuys[roundIndex].splice($ctrl.game.options.forceBuys[roundIndex].findIndex(i => i == item), 1);
		$ctrl.addForceCardToRound = (roundIndex: number) => effectChooserHelper.openEffect((effect, amount) => $ctrl.game.options.forceBuys[roundIndex].push({ effect: effect, points: amount, amount: 0, cost: 0 }), true, true);

		$ctrl.getEnhancementsForRound = (roundIndex: number) => $ctrl.game.options.enhancementsAvailable[roundIndex];
		$ctrl.removeFromEnhancementsInRound = (roundIndex: number, enhancement: purchaseEnhancement) => $ctrl.game.options.enhancementsAvailable[roundIndex].splice($ctrl.game.options.enhancementsAvailable[roundIndex].findIndex(e => e == enhancement), 1);
		$ctrl.addEnhancementToRound = (roundIndex: number) => effectChooserHelper.openEnhancement((enhancement) => { if ($ctrl.game.options.enhancementsAvailable[roundIndex].indexOf(enhancement) == -1) $ctrl.game.options.enhancementsAvailable[roundIndex].push(enhancement); });

		let optionsUpdateTimeout: ng.IPromise<void> = undefined;

		function addCardToHand() {
			effectChooserHelper.openEffect((effect, amount) => { gameWrapper.game.options.startingHand.push({ effect: effect, points: amount, amount: 0, cost: 0 }); }, true, true);
		}

		function getRoundArray() {
			if ($ctrl.game.options.totalRounds != $ctrl.game.options.effectsAvailable.length) {
				if ($ctrl.game.options.totalRounds > $ctrl.game.options.effectsAvailable.length)
					$ctrl.game.options.effectsAvailable.push(...new Array($ctrl.game.options.totalRounds - $ctrl.game.options.effectsAvailable.length).fill([]).map(_ => []));
				else
					$ctrl.game.options.effectsAvailable.length = $ctrl.game.options.totalRounds;
			}

			if ($ctrl.game.options.totalRounds != $ctrl.game.options.forceBuys.length) {
				if ($ctrl.game.options.totalRounds > $ctrl.game.options.forceBuys.length)
					$ctrl.game.options.forceBuys.push(...new Array($ctrl.game.options.totalRounds - $ctrl.game.options.forceBuys.length).fill([]).map(_ => []));
				else
					$ctrl.game.options.forceBuys.length = $ctrl.game.options.totalRounds;
			}

			if ($ctrl.game.options.totalRounds != $ctrl.game.options.enhancementsAvailable.length) {
				if ($ctrl.game.options.totalRounds > $ctrl.game.options.enhancementsAvailable.length)
					$ctrl.game.options.enhancementsAvailable.push(...new Array($ctrl.game.options.totalRounds - $ctrl.game.options.enhancementsAvailable.length).fill([]).map(_ => []));
				else
					$ctrl.game.options.enhancementsAvailable.length = $ctrl.game.options.totalRounds;
			}

			return new Array($ctrl.game.options.totalRounds).fill(0).map((_, ndx) => ndx);
		}
		function removeFromNewEffectsInRound(roundIndex: number, effect: itemEffect) {
			if (roundIndex > 0 || $ctrl.game.options.effectsAvailable[0].length > 1)
				$ctrl.game.options.effectsAvailable[roundIndex].splice($ctrl.game.options.effectsAvailable[roundIndex].findIndex(e => e == effect), 1);
		}
		function removeFromForceBuysInRound(roundIndex: number, item: IItem) {
			$ctrl.game.options.forceBuys[roundIndex].splice($ctrl.game.options.forceBuys[roundIndex].findIndex(i => i == item), 1);
		}

		function getModeName(ndx: number) {
			if (ndx == 0)
				return "Standard";
			else if (ndx == 1)
				return "Learning";
			else if (ndx == 2)
				return "Fight Against Banes";
			else if (ndx == 3)
				return "Standard Attacking";
			else if (ndx == 4)
				return "Standard Variant";
			return "";
		}

		function setMode(ndx: number) {
			if (userData.isHost && gameWrapper.game.options.gameMode != ndx) {
				internalMode = ndx;
				socket.emit("setOptionMode", gameWrapper.game.gameId, ndx);
			}
		}

		function getAllPerks() {
			return new Array(Number(noHandPerk.GainExtraMoneyDuringBuyPhase) + 1).fill(0).map((_, ndx) => <noHandPerk>ndx);
		}

		function togglePerk(perk: noHandPerk) {
			let perkIndex = gameWrapper.game.options.perks.indexOf(perk);
			if (perkIndex >= 0)
				gameWrapper.game.options.perks.splice(perkIndex, 1);
			else
				gameWrapper.game.options.perks.push(perk);
		}

		function getEndGameBonuses() {
			return new Array(Number(endGameBonus.BanesLeast) + 1).fill(0).map((_, ndx) => <endGameBonus>ndx);
		}

		function toggleEndGameBonus(bonus: endGameBonus) {
			let index = gameWrapper.game.options.endGameBonuses.indexOf(bonus);
			if (index == -1)
				gameWrapper.game.options.endGameBonuses.push(bonus);
			else
				gameWrapper.game.options.endGameBonuses.splice(index, 1);
		}

		$scope.$watch((_) => gameWrapper.game.options, function (newOptions, oldOptions) {
			if (userData.isHost) {
				if (internalMode >= 0)
					internalMode = -1;
				else
					newOptions.gameMode = -1;
				if (optionsUpdateTimeout)
					$timeout.cancel(optionsUpdateTimeout);
				optionsUpdateTimeout = $timeout(() => { optionsUpdateTimeout = undefined; socket.emit("updateOptions", gameWrapper.game.gameId, newOptions); }, 3000);
			} else {
				// Way to disable editing kind of.  But messes with "updatedOptions" from host.
				//if (!optionsUpdateTimeout) {
				//	if (internalMode != 0)
				//		optionsUpdateTimeout = $timeout(() => { optionsUpdateTimeout = undefined; gameWrapper.game.options = oldOptions; internalMode = 0; }, 10) // If you aren't the host, you can't do anything!
				//	else
				//		internalMode = 1;
				//}
			}
		}, true);
	}

	const bindings = {
	};
	var pregameSettingsComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/pregameSettings.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return pregameSettingsComponent;
}