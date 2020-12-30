const PLAY_ACTION_COMPONENT = "playActionArea";
angular.module('mainApp').component(PLAY_ACTION_COMPONENT, playActionFunc());
function playActionFunc() {
    const controllerFunc = function (userData, gameWrapper, globalSettings, roundWrapper, styleHelper, cardInformationHelper) {
        var ctrl = this;
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        ctrl.roundWrapper = roundWrapper;
        ctrl.clickItem = clickItem;
        ctrl.clickInformation = clickInformation;
        ctrl.drawItems = drawItems;
        ctrl.endTurn = endTurn;
        ctrl.getCardClass = styleHelper.getCardClass;
        ctrl.getCardIconClass = styleHelper.getCardIconClass;
        ctrl.getCardName = getCardName;
        ctrl.isEndTurnWarning = () => endTurnWarning;
        ctrl.isWaitingForOthers = () => roundWrapper.isWaitingOnOthers();
        ctrl.giveTurnOptions = () => roundWrapper.showSelectionTurnOptions(player.playerData);
        ctrl.isExtraCard = (item) => roundWrapper.isExtraCard(item);
        ctrl.willCauseBust = (item) => item.effect == itemEffect.Bane && player.playerData.baneThreshold - roundWrapper.getSelection().baneCount - item.points < 0;
        ctrl.isCardEffective = isCardEffective;
        ctrl.getMovementText = getMovementText;
        ctrl.getAvailablePerks = getAvailablePerks;
        ctrl.clickPerk = clickPerk;
        ctrl.getItemFromPerk = getItemFromPerk;
        ctrl.getPerkName = (perk) => styleHelper.getPerkName(perk);
        ctrl.willLandOnGem = (item) => roundWrapper.willLandOnGem(item);
        let endTurnWarning = false;
        function clickItem(item) {
            roundWrapper.playItem(player.playerData, item);
            endTurnWarning = false;
        }
        function clickInformation(item, event) {
            event.stopPropagation();
            endTurnWarning = false;
            cardInformationHelper.showItem(item.effect, styleHelper.getCardDescription(item, player, roundWrapper), item.points);
            return false;
        }
        function drawItems(item, event) {
            roundWrapper.drawHand(player.playerData);
            endTurnWarning = false;
        }
        function endTurn() {
            // Should additionally check if there is anything left to buy with remaining money.
            // End without prompting if there is not.
            const canBust = roundWrapper.remainingItems.length > 0 && roundWrapper.getPercentageToBust(player) > 0;
            let canPlayCard = false;
            if (!endTurnWarning && globalSettings.assistMode && !gameWrapper.game.options.disableAssistMode) {
                // If you're in assist mode and can still buy something, put up a warning.
                if (!canBust && roundWrapper.remainingItems.length > 0)
                    cardInformationHelper.showInformation("End Turn?", "There is a 0% chance to bust if you draw another card.  Ending your turn now will result in less money for the buy phase (and less points!).  Draw as many cards as you can and then click the \"End\" button (or click it a second time now to end without drawing).");
                // If assist mode, also prevent them from ending if you can play a card with their deck empty.
                if (roundWrapper.remainingItems.length == 0 && roundWrapper.currentHand.length > 0) {
                    let baneCount = Math.max(0, player.playerData.baneThreshold - roundWrapper.selection.baneCount);
                    // if you have a playable card in your hand, you might want to play it.
                    if (roundWrapper.currentHand.some(item => item.effect != itemEffect.Bane || item.points <= baneCount)) {
                        canPlayCard = true;
                        cardInformationHelper.showInformation("End Turn?", "You have a playable card in your hand.");
                    }
                }
            }
            if ((canBust && !canPlayCard) || (roundWrapper.remainingItems.length == 0 && roundWrapper.currentHand.length == 0) || endTurnWarning) {
                roundWrapper.endSelectionTurn(true);
                endTurnWarning = false;
            }
            else {
                endTurnWarning = !endTurnWarning;
            }
        }
        function getCardName(item) {
            let cardName = styleHelper.getCardName(item.effect);
            if (item.effect == itemEffect.GainExtraMoney)
                cardName = cardName + " " + item.amount;
            return cardName;
        }
        function isCardEffective(item) {
            if (item.effect == itemEffect.MoneyForSpecial) {
                return roundWrapper.selection.playedItems.findIndex(i => i.effect == itemEffect.SpecialNoEffect) >= 0;
            }
            else if (item.effect == itemEffect.MovesForSpecial) {
                return roundWrapper.selection.playedItems.findIndex(i => i.effect == itemEffect.SpecialNoEffect) >= 0;
            }
            else if (item.effect == itemEffect.SpecialAdjacentMover) {
                return roundWrapper.wasPreviousCardOfType(itemEffect.SpecialNoEffect);
            }
            else if (item.effect == itemEffect.GemLandingExtra) {
                return roundWrapper.willLandOnGem(item);
            }
            else if (item.effect == itemEffect.CopyMover) {
                return roundWrapper.wasPreviousCardOfType(itemEffect.CopyMover);
            }
            else if (item.effect == itemEffect.RemovePreviousBane) {
                return roundWrapper.wasPreviousCardOfType(itemEffect.Bane) && roundWrapper.didJustDraw(item);
            }
            else if (item.effect == itemEffect.CopyOfPreviousCardToHand) {
                return roundWrapper.didJustDraw(item);
            }
            else if (item.effect == itemEffect.ShuffleHand) {
                return roundWrapper.currentHand.length > 1; // if you have another card in your hand
            }
            else if (item.effect == itemEffect.DiscardItem) {
                return roundWrapper.currentHand[0] != item; // if this is not the leftmost card in your hand
            }
            else if (item.effect == itemEffect.TrashItem) {
                return roundWrapper.currentHand[0] != item; // if this is not the leftmost card in your hand
            }
            else if (item.effect == itemEffect.Move5X) {
                return roundWrapper.selection.currentLocation > 0 && roundWrapper.selection.currentLocation % 5 == 0; // if you are on a multiple of 5
            }
            else if (item.effect == itemEffect.Bane) {
                return roundWrapper.getExtraMoves(item) > 0;
            }
            else if (item.effect == itemEffect.GainPoints5X) {
                return (roundWrapper.selection.currentLocation + item.points) % 5 == 0; // if you are landing on a multiple of 5
            }
            else if (item.effect == itemEffect.MovesForGems) {
                return roundWrapper.selection.gemGains >= 4; // if you've earned at least 4 gems.
            }
            else if (item.effect == itemEffect.EmptyHandGems) {
                return roundWrapper.currentHand.length == 1; // if this is the only card in your hand, playing it would make your hand empty.
            }
            else if (item.effect == itemEffect.DrawLowestNonBane) {
                return roundWrapper.remainingItems.some(i => i.effect != itemEffect.Bane && i.points < 3); // if there is a non-bane card in your deck
            }
            else if (item.effect == itemEffect.MoveNextGem) {
                return !roundWrapper.hasGem(roundWrapper.selection.currentLocation + item.points); // if you will move more than one space.
            }
            else if (item.effect == itemEffect.GemsForMoney) {
                return roundWrapper.selection.gemGains - (item.amount * 3) >= 0; // if you have enough gems to spend.
            }
            return false; // If not one of the above, then it is not effective.
        }
        function getMovementText(item) {
            const extraMoves = roundWrapper.getExtraMoves(item);
            if (extraMoves > 0)
                return item.points + " + " + extraMoves + " = " + (item.points + extraMoves);
            return String(item.points);
        }
        function getAvailablePerks() {
            if (roundWrapper.currentHand.length == 0 && roundWrapper.extraCardsInHand.length == 0 && roundWrapper.selection.hasPerkAvailable) { // Check if has used perk, then don't show either.
                return gameWrapper.game.options.perks;
            }
            return [];
        }
        function clickPerk(perk) {
            endTurnWarning = false;
            const item = getItemFromPerk(perk);
            roundWrapper.selection.hasPerkAvailable = false;
            roundWrapper.playItem(player.playerData, item);
        }
        function getItemFromPerk(perk) {
            const item = {
                effect: itemEffect.Bane,
                amount: 0,
                cost: 0,
                points: 0
            };
            if (perk == noHandPerk.DrawNoPenalty) {
                item.effect = itemEffect.DrawNoPenalty;
            }
            if (perk == noHandPerk.GainExtraMoneyDuringBuyPhase) {
                item.points = 0;
                item.amount = 2;
                item.effect = itemEffect.GainExtraMoney;
            }
            return item;
        }
    };
    const bindings = {};
    var playActionComponent = {
        templateUrl: 'app/views/playActionArea.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return playActionComponent;
}
//# sourceMappingURL=playActionArea.js.map