const PREGAME_SETTINGS_COMPONENT = "pregameSettings";
angular.module('mainApp').component(PREGAME_SETTINGS_COMPONENT, pregameSettingsFunc());
function pregameSettingsFunc() {
    const controllerFunc = function (userData, gameWrapper, styleHelper, cardInformationHelper, effectChooserHelper, $scope, $timeout) {
        let internalMode = 0;
        var $ctrl = this;
        $ctrl.game = gameWrapper.game;
        $ctrl.getEnhancementName = (enhancement) => styleHelper.getEnhancementName(enhancement);
        $ctrl.getCardName = (effect) => styleHelper.getCardName(effect);
        $ctrl.getCardIconClass = (effect) => styleHelper.getCardIconClass(effect);
        $ctrl.getCardClass = (effect) => styleHelper.getCardClass(effect);
        $ctrl.getCardDescription = (item) => { return styleHelper.getCardDescription(item); };
        $ctrl.getInfo = (item) => cardInformationHelper.showItem(item.effect, styleHelper.getCardDescription(item), item.points);
        $ctrl.getEnhancementInfo = (enhancement) => cardInformationHelper.showGem(enhancement);
        $ctrl.getEffectInfo = (effect) => cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ effect: effect, points: 0, amount: 0, cost: 0 }));
        $ctrl.removeFromHand = (item) => gameWrapper.game.options.startingHand.splice(gameWrapper.game.options.startingHand.findIndex(i => i == item), 1);
        $ctrl.addCardToHand = addCardToHand;
        $ctrl.getRoundArray = getRoundArray;
        $ctrl.setMode = setMode;
        $ctrl.getModeName = getModeName;
        $ctrl.getAllPerks = getAllPerks;
        $ctrl.getPerkName = (perk) => styleHelper.getPerkName(perk);
        $ctrl.togglePerk = togglePerk;
        $ctrl.getEndGameBonuses = getEndGameBonuses;
        $ctrl.getEndGameBonusName = (bonus) => styleHelper.getEndGameBonusName(bonus);
        $ctrl.toggleEndGameBonus = toggleEndGameBonus;
        $ctrl.getNewCardEffectForRound = (roundIndex) => $ctrl.game.options.effectsAvailable[roundIndex];
        $ctrl.removeFromNewEffectsInRound = removeFromNewEffectsInRound;
        $ctrl.addEffectToRound = (roundIndex) => effectChooserHelper.openEffect((effect) => { if ($ctrl.game.options.effectsAvailable[roundIndex].indexOf(effect) == -1)
            $ctrl.game.options.effectsAvailable[roundIndex].push(effect); });
        $ctrl.getForceBuysForRound = (roundIndex) => $ctrl.game.options.forceBuys[roundIndex];
        $ctrl.removeFromForceBuysInRound = (roundIndex, item) => $ctrl.game.options.forceBuys[roundIndex].splice($ctrl.game.options.forceBuys[roundIndex].findIndex(i => i == item), 1);
        $ctrl.addForceCardToRound = (roundIndex) => effectChooserHelper.openEffect((effect, amount) => $ctrl.game.options.forceBuys[roundIndex].push({ effect: effect, points: amount, amount: 0, cost: 0 }), true, true);
        $ctrl.getEnhancementsForRound = (roundIndex) => $ctrl.game.options.enhancementsAvailable[roundIndex];
        $ctrl.removeFromEnhancementsInRound = (roundIndex, enhancement) => $ctrl.game.options.enhancementsAvailable[roundIndex].splice($ctrl.game.options.enhancementsAvailable[roundIndex].findIndex(e => e == enhancement), 1);
        $ctrl.addEnhancementToRound = (roundIndex) => effectChooserHelper.openEnhancement((enhancement) => { if ($ctrl.game.options.enhancementsAvailable[roundIndex].indexOf(enhancement) == -1)
            $ctrl.game.options.enhancementsAvailable[roundIndex].push(enhancement); });
        let optionsUpdateTimeout = undefined;
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
        function removeFromNewEffectsInRound(roundIndex, effect) {
            if (roundIndex > 0 || $ctrl.game.options.effectsAvailable[0].length > 1)
                $ctrl.game.options.effectsAvailable[roundIndex].splice($ctrl.game.options.effectsAvailable[roundIndex].findIndex(e => e == effect), 1);
        }
        function removeFromForceBuysInRound(roundIndex, item) {
            $ctrl.game.options.forceBuys[roundIndex].splice($ctrl.game.options.forceBuys[roundIndex].findIndex(i => i == item), 1);
        }
        function getModeName(ndx) {
            if (ndx == 0)
                return "Standard";
            else if (ndx == 1)
                return "Learning";
            else if (ndx == 2)
                return "Fight Against Banes";
            else if (ndx == 3)
                return "Attacking Game";
            return "";
        }
        function setMode(ndx) {
            if (userData.isHost && gameWrapper.game.options.gameMode != ndx) {
                internalMode = ndx;
                socket.emit("setOptionMode", gameWrapper.game.gameId, ndx);
            }
        }
        function getAllPerks() {
            return new Array(Number(noHandPerk.GainExtraMoneyDuringBuyPhase) + 1).fill(0).map((_, ndx) => ndx);
        }
        function togglePerk(perk) {
            let perkIndex = gameWrapper.game.options.perks.indexOf(perk);
            if (perkIndex >= 0)
                gameWrapper.game.options.perks.splice(perkIndex, 1);
            else
                gameWrapper.game.options.perks.push(perk);
        }
        function getEndGameBonuses() {
            return new Array(Number(endGameBonus.BanesLeast) + 1).fill(0).map((_, ndx) => ndx);
        }
        function toggleEndGameBonus(bonus) {
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
            }
            else {
                // Way to disable editing kind of.  But messes with "updatedOptions" from host.
                //if (!optionsUpdateTimeout) {
                //	if (internalMode != 0)
                //		optionsUpdateTimeout = $timeout(() => { optionsUpdateTimeout = undefined; gameWrapper.game.options = oldOptions; internalMode = 0; }, 10) // If you aren't the host, you can't do anything!
                //	else
                //		internalMode = 1;
                //}
            }
        }, true);
    };
    const bindings = {};
    var pregameSettingsComponent = {
        templateUrl: 'app/views/pregameSettings.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return pregameSettingsComponent;
}
//# sourceMappingURL=pregameSettings.js.map