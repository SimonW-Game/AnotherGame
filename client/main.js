const socket = io();
const PLAY_CARD_EVENT = "PlayCardEvent";
const CHANGE_DECK_EVENT = "DrawHandEvent";
const SCALE_SETTINGS = "sw-scale";
const ASSIST_SETTINGS = "sw-assist";
class Game {
    constructor(gameId, players, completedRounds, options) {
        this.gameId = gameId;
        this.players = players;
        this.completedRounds = completedRounds;
        this.currentRound = { selectionResults: undefined, buySelectionData: undefined, thingsToBuy: undefined };
        this.roundPhaseStatus = RoundPhaseStatus.PreRound;
        this.options = options;
    }
    addPlayer(playerData) {
        this.players.push({ playerData: playerData, isDisconnected: false, isWaitingOnOthers: false });
    }
    playerDisconnected(index, hasGameNotStarted) {
        if (hasGameNotStarted) {
            // If the game hasn't started, just remove the player.
            const playersIndex = this.players.findIndex(p => p.playerData.index === index);
            this.players.splice(playersIndex, 1);
        }
        else {
            const player = this.players.find(p => p.playerData.index === index);
            player.isDisconnected = true;
        }
    }
    getPlayerByIndex(index) {
        return this.players.find(p => p.playerData.index == index);
    }
}
var RoundPhaseStatus;
(function (RoundPhaseStatus) {
    RoundPhaseStatus[RoundPhaseStatus["PreRound"] = 0] = "PreRound";
    RoundPhaseStatus[RoundPhaseStatus["PlayPhase"] = 1] = "PlayPhase";
    RoundPhaseStatus[RoundPhaseStatus["BuyPhase"] = 2] = "BuyPhase";
    RoundPhaseStatus[RoundPhaseStatus["GameAnalysisPhase"] = 3] = "GameAnalysisPhase";
})(RoundPhaseStatus || (RoundPhaseStatus = {}));
const gameWrapper = {
    game: undefined,
    gameMode: 0,
    endGameInfo: undefined,
};
class StyleHelper {
    constructor() {
        this.getPlayers = function (player) {
            // You're always first, then top to bottom.
            if (gameWrapper.game) {
                const otherPlayers = gameWrapper.game.players.filter(p => p != player);
                return [player, ...otherPlayers.sort((a, b) => b.playerData.totalScore - a.playerData.totalScore)];
            }
            return [];
        };
    }
    getCardClass(effect) {
        let cardClass = "";
        if (effect == itemEffect.Bane)
            cardClass = "sw-card-bane";
        else if (effect == itemEffect.JustMove)
            cardClass = "sw-card-just-move";
        else if (effect == itemEffect.SpecialNoEffect)
            cardClass = "sw-card-special-no-effect";
        else if (effect == itemEffect.AddToHand)
            cardClass = "sw-card-add-to-hand";
        else if (effect == itemEffect.MoneyForSpecial)
            cardClass = "sw-card-money-for-special";
        else if (effect == itemEffect.MovesForSpecial)
            cardClass = "sw-card-moves-for-special";
        else if (effect == itemEffect.FarMoving)
            cardClass = "sw-card-far-reaching";
        else if (effect == itemEffect.GemLandingExtra)
            cardClass = "sw-card-extra-gem";
        else if (effect == itemEffect.ShuffleHand)
            cardClass = "sw-card-shuffle-hand";
        else if (effect == itemEffect.DrawLowestNonBane)
            cardClass = "sw-card-draw-lowest";
        else if (effect == itemEffect.GrowingMover)
            cardClass = "sw-card-growing-mover";
        else if (effect == itemEffect.GrowingPoints)
            cardClass = "sw-card-grower-points";
        else if (effect == itemEffect.CopyMover)
            cardClass = "sw-card-copyMover-hand";
        else if (effect == itemEffect.SpecialAdjacentMover)
            cardClass = "sw-card-special-adjacent-mover";
        else if (effect == itemEffect.RemovePreviousBane)
            cardClass = "sw-card-remove-bane";
        else if (effect == itemEffect.CopyOfPreviousCardToHand)
            cardClass = "sw-card-copy-previous";
        else if (effect == itemEffect.CardsCostLess)
            cardClass = "sw-card-cost-less";
        else if (effect == itemEffect.LastCardGem)
            cardClass = "sw-card-last-card-gem";
        else if (effect == itemEffect.Virus)
            cardClass = "sw-card-virus";
        else if (effect == itemEffect.Poison)
            cardClass = "sw-card-poison";
        else if (effect == itemEffect.PoisonBrewer)
            cardClass = "sw-card-poison-brewer";
        else if (effect == itemEffect.Tax)
            cardClass = "sw-card-tax";
        else if (effect == itemEffect.TaxCollector)
            cardClass = "sw-card-tax-collector";
        else if (effect == itemEffect.BaneGiver)
            cardClass = "sw-card-bane-giver";
        else if (effect == itemEffect.TrashItem)
            cardClass = "sw-card-trash-item";
        else if (effect == itemEffect.DiscardItem)
            cardClass = "sw-card-discard-item";
        else if (effect == itemEffect.PointInvestment)
            cardClass = "sw-card-point-investment";
        else if (effect == itemEffect.PlayedMostReward)
            cardClass = "sw-card-played-most-reward";
        else if (effect == itemEffect.BonusForKeys)
            cardClass = "sw-card-bonus-for-keys";
        else if (effect == itemEffect.GainExtraBuy)
            cardClass = "sw-card-gain-buy";
        else if (effect == itemEffect.Move5X)
            cardClass = "sw-card-move-5x";
        else if (effect == itemEffect.BaneCountRemoval)
            cardClass = "sw-card-bane-removal";
        else if (effect == itemEffect.GainExtraMoney)
            cardClass = "sw-card-extra-money";
        else if (effect == itemEffect.GainPoints5X)
            cardClass = "sw-card-points-5x";
        else if (effect == itemEffect.Bane1Moves2)
            cardClass = "sw-card-bane-moves";
        else if (effect == itemEffect.MovesForGems)
            cardClass = "sw-card-moves-for-gems";
        else if (effect == itemEffect.EmptyHandGems)
            cardClass = "sw-card-empty-gems";
        else if (effect == itemEffect.EmptyHandMoves)
            cardClass = "sw-card-empty-moves";
        else if (effect == itemEffect.IncreaseHandSize)
            cardClass = "sw-card-increase-hand";
        else if (effect == itemEffect.GainPointPerBuy)
            cardClass = "sw-card-points-per-buy";
        else if (effect == itemEffect.GainExtraGemFromHere)
            cardClass = "sw-card-extra-future-gem";
        else if (effect == itemEffect.MoveAndPoint)
            cardClass = "sw-card-move-point";
        else if (effect == itemEffect.MoveNextGem)
            cardClass = "sw-card-move-to-gem";
        else if (effect == itemEffect.GemsForMoney)
            cardClass = "sw-card-gem-for-money";
        else if (effect == itemEffect.PointsForNoGems)
            cardClass = "sw-card-points-no-gems";
        else if (effect == itemEffect.MoneyForPassingGems)
            cardClass = "sw-card-money-pass-gem";
        else
            cardClass = "sw-perk-card";
        return cardClass;
    }
    getCardIconClass(effect) {
        let cardClass = "";
        if (effect == itemEffect.Bane)
            cardClass = "fa fa-skull";
        else if (effect == itemEffect.JustMove)
            cardClass = "fa fa-walking";
        else if (effect == itemEffect.SpecialNoEffect)
            cardClass = "fa fa-key";
        else if (effect == itemEffect.AddToHand)
            cardClass = "fa fa-hand-holding-medical";
        else if (effect == itemEffect.MoneyForSpecial)
            cardClass = "fa fa-search-dollar";
        else if (effect == itemEffect.MovesForSpecial)
            cardClass = "fa fa-running";
        else if (effect == itemEffect.FarMoving)
            cardClass = "fa fa-fast-forward";
        else if (effect == itemEffect.GemLandingExtra)
            cardClass = "far fa-gem";
        else if (effect == itemEffect.ShuffleHand)
            cardClass = "fa fa-random";
        else if (effect == itemEffect.DrawLowestNonBane)
            cardClass = "fa fa-search-minus";
        else if (effect == itemEffect.GrowingMover)
            cardClass = "fa fa-seedling";
        else if (effect == itemEffect.GrowingPoints)
            cardClass = "fa fa-seedling";
        else if (effect == itemEffect.CopyMover)
            cardClass = "far fa-copy";
        else if (effect == itemEffect.SpecialAdjacentMover)
            cardClass = "fa fa-caret-square-left";
        else if (effect == itemEffect.RemovePreviousBane)
            cardClass = "fa fa-eraser";
        else if (effect == itemEffect.CopyOfPreviousCardToHand)
            cardClass = "far fa-clone";
        else if (effect == itemEffect.CardsCostLess)
            cardClass = "fa fa-tags";
        else if (effect == itemEffect.LastCardGem)
            cardClass = "fa fa-step-forward";
        else if (effect == itemEffect.Virus)
            cardClass = "fa fa-virus";
        else if (effect == itemEffect.Tax)
            cardClass = "fa fa-funnel-dollar";
        else if (effect == itemEffect.Poison)
            cardClass = "fa fa-vial";
        else if (effect == itemEffect.PoisonBrewer)
            cardClass = "fa fa-vials";
        else if (effect == itemEffect.TaxCollector)
            cardClass = "fa fa-search-dollar";
        else if (effect == itemEffect.BaneGiver)
            cardClass = "fa fa-bone";
        else if (effect == itemEffect.TrashItem)
            cardClass = "fa fa-dumpster-fire";
        else if (effect == itemEffect.DiscardItem)
            cardClass = "fa fa-recycle";
        else if (effect == itemEffect.PointInvestment)
            cardClass = "fa fa-credit-card";
        else if (effect == itemEffect.PlayedMostReward)
            cardClass = "fa fa-greater-than";
        else if (effect == itemEffect.BonusForKeys)
            cardClass = "fa fa-unlock-alt";
        else if (effect == itemEffect.GainExtraBuy)
            cardClass = "fa fa-shopping-basket";
        else if (effect == itemEffect.Move5X)
            cardClass = "fa fa-dice-five";
        else if (effect == itemEffect.BaneCountRemoval)
            cardClass = "fa fa-minus-square";
        else if (effect == itemEffect.GainExtraMoney)
            cardClass = "fa fa-coins";
        else if (effect == itemEffect.GainPoints5X)
            cardClass = "fa fa-shield-alt";
        else if (effect == itemEffect.Bane1Moves2)
            cardClass = "fa fa-expand-alt";
        else if (effect == itemEffect.MovesForGems)
            cardClass = "fa fa-gem";
        else if (effect == itemEffect.EmptyHandGems)
            cardClass = "fa fa-hand-sparkles";
        else if (effect == itemEffect.EmptyHandMoves)
            cardClass = "fa fa-hand-sparkles";
        else if (effect == itemEffect.IncreaseHandSize)
            cardClass = "fa fa-hand-point-up";
        else if (effect == itemEffect.GainPointPerBuy)
            cardClass = "fa fa-shopping-bag";
        else if (effect == itemEffect.GainExtraGemFromHere)
            cardClass = "fa fa-calendar-plus";
        else if (effect == itemEffect.MoveAndPoint)
            cardClass = "fa fa-medal";
        else if (effect == itemEffect.MoveNextGem)
            cardClass = "fa fa-angle-double-right";
        else if (effect == itemEffect.GemsForMoney)
            cardClass = "fa fa-exchange-alt";
        else if (effect == itemEffect.PointsForNoGems)
            cardClass = "fa fa-times-circle";
        else if (effect == itemEffect.MoneyForPassingGems)
            cardClass = "fa fa-circle-notch";
        return cardClass;
    }
    getCardName(effect) {
        let cardName = "idk";
        if (effect == itemEffect.Bane)
            cardName = "Bane";
        else if (effect == itemEffect.JustMove)
            cardName = "Move";
        else if (effect == itemEffect.SpecialNoEffect)
            cardName = "Key";
        else if (effect == itemEffect.AddToHand)
            cardName = "Add To Hand";
        else if (effect == itemEffect.MoneyForSpecial)
            cardName = "Gems For Keys";
        else if (effect == itemEffect.MovesForSpecial)
            cardName = "Moves For Keys";
        else if (effect == itemEffect.FarMoving)
            cardName = "Far Moving";
        else if (effect == itemEffect.GemLandingExtra)
            cardName = "Extra Gems";
        else if (effect == itemEffect.ShuffleHand)
            cardName = "Shuffle Hand";
        else if (effect == itemEffect.DrawLowestNonBane)
            cardName = "Draw Lowest";
        else if (effect == itemEffect.GrowingMover)
            cardName = "Evolving Mover";
        else if (effect == itemEffect.GrowingPoints)
            cardName = "Evolving Points";
        else if (effect == itemEffect.CopyMover)
            cardName = "Copycat Mover";
        else if (effect == itemEffect.SpecialAdjacentMover)
            cardName = "Adjacent Key Mover";
        else if (effect == itemEffect.RemovePreviousBane)
            cardName = "Remove Bane";
        else if (effect == itemEffect.CopyOfPreviousCardToHand)
            cardName = "Copy Previous";
        else if (effect == itemEffect.CardsCostLess)
            cardName = "Card Sale";
        else if (effect == itemEffect.LastCardGem)
            cardName = "Last Card Gem";
        else if (effect == itemEffect.Virus)
            cardName = "Virus";
        else if (effect == itemEffect.Poison)
            cardName = "Poison";
        else if (effect == itemEffect.PoisonBrewer)
            cardName = "Poison Brewer";
        else if (effect == itemEffect.TaxCollector)
            cardName = "Tax Collector";
        else if (effect == itemEffect.Tax)
            cardName = "Tax";
        else if (effect == itemEffect.BaneGiver)
            cardName = "Bane Giver";
        else if (effect == itemEffect.TrashItem)
            cardName = "Trash Card";
        else if (effect == itemEffect.DiscardItem)
            cardName = "Discard Card";
        else if (effect == itemEffect.PointInvestment)
            cardName = "Point Investment";
        else if (effect == itemEffect.PlayedMostReward)
            cardName = "Play Most Reward";
        else if (effect == itemEffect.BonusForKeys)
            cardName = "Bonus For Keys";
        else if (effect == itemEffect.GainExtraBuy)
            cardName = "Extra Buy";
        else if (effect == itemEffect.Move5X)
            cardName = "Move On 5";
        else if (effect == itemEffect.BaneCountRemoval)
            cardName = "Remove Bane Count";
        else if (effect == itemEffect.GainExtraMoney)
            cardName = "Extra Money";
        else if (effect == itemEffect.GainPoints5X)
            cardName = "Points For 5";
        else if (effect == itemEffect.Bane1Moves2)
            cardName = "Banes Move Extra";
        else if (effect == itemEffect.MovesForGems)
            cardName = "Moves for Gems";
        else if (effect == itemEffect.DrawNoPenalty)
            cardName = "No Penalty Draw";
        else if (effect == itemEffect.EmptyHandGems)
            cardName = "Empty Hand Gems";
        else if (effect == itemEffect.EmptyHandMoves)
            cardName = "Empty Hand Moves";
        else if (effect == itemEffect.IncreaseHandSize)
            cardName = "Hand Size Up";
        else if (effect == itemEffect.GainPointPerBuy)
            cardName = "Point Per Buy";
        else if (effect == itemEffect.GainExtraGemFromHere)
            cardName = "Future Gems Up";
        else if (effect == itemEffect.MoveAndPoint)
            cardName = "Extra Point";
        else if (effect == itemEffect.MoveNextGem)
            cardName = "Move To Gem";
        else if (effect == itemEffect.GemsForMoney)
            cardName = "Gems for Money";
        else if (effect == itemEffect.PointsForNoGems)
            cardName = "Low Gems Points";
        else if (effect == itemEffect.MoneyForPassingGems)
            cardName = "Pass Gem Money";
        return cardName;
    }
    getCardDescription(item, player = undefined, roundWrapper = undefined) {
        let description = "idk";
        if (item.effect == itemEffect.Bane) {
            let baneCount;
            if (typeof player !== "undefined" && typeof roundWrapper !== "undefined")
                baneCount = Math.max(0, player.playerData.baneThreshold - roundWrapper.getSelection().baneCount);
            else
                baneCount = -1;
            description = "Bane will give you points, but too many Bane's will cause you to bust" + (baneCount == -1 ? "" : "(" + baneCount + " left)") + ".  If you bust, you will have to chose to gain points or spend money.";
        }
        else if (item.effect == itemEffect.JustMove) {
            description = "Moves you forward on the board.  No special effect.";
        }
        else if (item.effect == itemEffect.SpecialNoEffect) {
            description = "Keys will do nothing on their own.  Other cards rely on playing keys.";
        }
        else if (item.effect == itemEffect.AddToHand) {
            let additionalCardText;
            if (item.amount == 0)
                additionalCardText = "";
            else
                additionalCardText = item.amount + " ";
            description = "Draw " + additionalCardText + "more card(s) to your hand, then chose a remaining card to play (additional cards will be reshuffled).";
        }
        else if (item.effect == itemEffect.MoneyForSpecial) {
            description = "Gain 1 extra gem for each Key you've played so far, up to three extra gems.";
        }
        else if (item.effect == itemEffect.MovesForSpecial) {
            description = "Move an extra space for each Key you've played so far, up to three extra spaces.";
        }
        else if (item.effect == itemEffect.FarMoving) {
            description = "Moves 6 places forward.  The only card to move more than 4 spaces by default.";
        }
        else if (item.effect == itemEffect.GemLandingExtra) {
            let additionalCardText;
            if (item.amount == 0)
                additionalCardText = "extra gems";
            else
                additionalCardText = "an extra " + item.amount + " gems";
            description = "Gain " + additionalCardText + " if this is placed on a gem.  If not placed on a gem, you gain no gems.";
        }
        else if (item.effect == itemEffect.ShuffleHand) {
            description = "Shuffle the remaining cards in your hand back into your deck.";
        }
        else if (item.effect == itemEffect.DrawLowestNonBane) {
            description = "Draw the lowest moving 0-2 moving, non-bane card.  Ties decided randomly (attack cards can be drawn)";
        }
        else if (item.effect == itemEffect.GrowingMover) {
            let additionalCardText;
            if (item.points == 1)
                additionalCardText = "1 space";
            else
                additionalCardText = item.points + " spaces";
            description = "Moves " + additionalCardText + " forward.  After each round, this will permanently move one additional space until it reaches 4 spaces.";
        }
        else if (item.effect == itemEffect.GrowingPoints) {
            let additionalCardText;
            if (item.amount <= 1)
                additionalCardText = "1 point";
            else
                additionalCardText = item.amount + " points";
            description = "Gains " + additionalCardText + " at the end of the last round.  Each time you play this, this will permanently gain one additional point until it reaches 4 points. This does not move you forward.";
        }
        else if (item.effect == itemEffect.CopyMover) {
            description = "For each Copycat you play immediately after each other, you move double the spaces (up to 8 spaces).";
        }
        else if (item.effect == itemEffect.SpecialAdjacentMover) {
            description = "If the last card you played was a Key, move an additional space.";
        }
        else if (item.effect == itemEffect.RemovePreviousBane) {
            description = "If the last card you played was a Bane, shuffle it back into your deck removing its bane counter.";
        }
        else if (item.effect == itemEffect.CopyOfPreviousCardToHand) {
            description = "If you play this card immediately after drawing it (without playing another afterward), copy the last card you played and put it in our hand (with the choice to end your turn if desired).";
        }
        else if (item.effect == itemEffect.CardsCostLess) {
            let additionalCardText = "";
            if (item.points > 0)
                additionalCardText = String(item.points) + " ";
            description = "Cards cost " + additionalCardText + "less during the buy phase.";
        }
        else if (item.effect == itemEffect.LastCardGem) {
            description = "If this is the last card you played during the selection phase, earn 4 gems.";
        }
        else if (item.effect == itemEffect.Virus) {
            description = "When drawn it shuffles your leftmost card in your hand back into your deck.  When played, this adds a copy of itself back into your deck.";
        }
        else if (item.effect == itemEffect.Poison) {
            description = "Prevents you from drawing or ending your turn until played.  When played, draw up to your hand size plus one.  Poisons only last one round and will be trashed after the buy phase.";
        }
        else if (item.effect == itemEffect.PoisonBrewer) {
            description = "Adds a Poison to everyone else's deck during the next selection phase (Poison will be trashed after one round).  This effect stacks, send as many Poisons to your opponents as you can!";
        }
        else if (item.effect == itemEffect.BaneBriber) {
            description = "Adds a Bane Drawer to everyone else's deck during the next selection phase (Bane Drawers will be trashed after one round).  This effect stacks, send as many Bane Drawers to your opponents as you can!";
        }
        else if (item.effect == itemEffect.BaneGiver) {
            description = "If somebody plays at least one Bane Giver, everyone who has not played a Bane Giver this selection phase will add a Bane 1 to their deck.";
        }
        else if (item.effect == itemEffect.TaxCollector) {
            description = "Adds a Tax to everyone else's deck during the next selection phase (Tax will be trashed after one round).  This effect stacks, send as many Taxes to your opponents as you can!";
        }
        else if (item.effect == itemEffect.BaneDrawer) {
            description = "When played, this will decrease the money you have to buy with during the buy phase by 10% (rounding down, or at least 1).  Taxes only last one round and will be trashed after the buy phase.";
        }
        else if (item.effect == itemEffect.Tax) {
            description = "When played, this will decrease the money you have to buy with during the buy phase by 10% (rounding down, or at least 1).  Taxes only last one round and will be trashed after the buy phase.";
        }
        else if (item.effect == itemEffect.TrashItem) {
            description = "When played, trash the card to the left of this card (removing it from your deck).  If there are no cards to the left of this, it trashes nothing.";
        }
        else if (item.effect == itemEffect.DiscardItem) {
            description = "When played, discard the card to the left of this card.  If there are no cards to the left of this, it discards nothing.";
        }
        else if (item.effect == itemEffect.PointInvestment) {
            description = "Has no effect during the selection phase.  When played, it will earn you a point.  Then it will be trashed and you will be refunded half of the cost.";
        }
        else if (item.effect == itemEffect.PlayedMostReward) {
            description = "Gains a bonus for playing more of these than others. Playing the least yields no reward. Playing more than one other player gains you 1 money for the buy phase.  Playing more than half of the other players also gives you starting location + 1.  If you played the most of these this round, gain a money, starting location + 1, and a point.";
        }
        else if (item.effect == itemEffect.BonusForKeys) {
            description = "Gains a bonus for keys played before this. 1 key = 1 extra money during buy phase.  2 keys = 1 point.  3 or more keys = 1 extra money and 1 point.";
        }
        else if (item.effect == itemEffect.GainExtraBuy) {
            description = "Gain an extra buy during the buy phase.  This effect stacks.";
        }
        else if (item.effect == itemEffect.Move5X) {
            description = "If you play this card while on a board space of a multiple of 5, move an extra space.";
        }
        else if (item.effect == itemEffect.BaneCountRemoval) {
            description = "Remove a single bane counter.";
        }
        else if (item.effect == itemEffect.GainExtraMoney) {
            let additionalCardText = "";
            if (item.points > 0)
                additionalCardText = String(item.amount) + " ";
            description = "Gain " + additionalCardText + "extra money for the buy phase.  This card always moves one space.";
        }
        else if (item.effect == itemEffect.GainPoints5X) {
            description = "If you play this card so it lands on a board space of a multiple of 5, gain two points (after the selection phase).  This effect stacks.";
        }
        else if (item.effect == itemEffect.Bane1Moves2) {
            description = "For every Bane 1 you play after this, it will move 2 spaces instead of 1.";
        }
        else if (item.effect == itemEffect.MovesForGems) {
            description = "Move an extra space for every 4 gems you've earned this round so far, up to three spaces.";
        }
        else if (item.effect == itemEffect.DrawNoPenalty) {
            description = "Draw your hand size + 1 with the additional option of ending your turn (for the next two cards you play before the effect wears off).";
        }
        else if (item.effect == itemEffect.EmptyHandGems) {
            description = "If this is the last card you played in your hand, gain 3 gems.";
        }
        else if (item.effect == itemEffect.EmptyHandMoves) {
            description = "If this is the last card you played in your hand, move one extra space.";
        }
        else if (item.effect == itemEffect.IncreaseHandSize) {
            description = "Incrase your hand limit by one for the rest of this round.";
        }
        else if (item.effect == itemEffect.GainPointPerBuy) {
            description = "For each card you buy the round you play this, gain a point.  Spending gems does not earn points.  This card does not move you.";
        }
        else if (item.effect == itemEffect.GainExtraGemFromHere) {
            description = "Landing on gems gain you an extra gem for the rest of the round. This effect stacks.";
        }
        else if (item.effect == itemEffect.MoveAndPoint) {
            description = "At the end of the game, gain a point";
        }
        else if (item.effect == itemEffect.MoveNextGem) {
            description = "Place this on the next gem on the board.";
        }
        else if (item.effect == itemEffect.GemsForMoney) {
            if (item.amount == 0)
                description = "If you have 3 or more gems, exchange them for 1 money.  Do this for each \"power\" of the card.";
            else
                description = "If you have " + (item.amount * 3) + " or more gems, exchange them for " + item.amount + " money.";
        }
        else if (item.effect == itemEffect.PointsForNoGems) {
            description = "Gain a point for every number below 4 gems you've earned at the end of this round.";
        }
        else if (item.effect == itemEffect.MoneyForPassingGems) {
            description = "Gain 1 money for every gem you have not landed on so far.";
        }
        return description;
    }
    getEnhancementName(enhancement) {
        let name = "idk";
        if (enhancement == purchaseEnhancement.IncreaseStartingSquare) {
            name = "Starting Location + 1";
        }
        else if (enhancement == purchaseEnhancement.IncreaseHandSize) {
            name = "Hand Size + 1";
        }
        else if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
            name = "Buy Duplicate Card";
        }
        else if (enhancement == purchaseEnhancement.GainPoint) {
            name = "Gain 1 Point";
        }
        else if (enhancement == purchaseEnhancement.GainTwoPoints) {
            name = "Gain 2 Points";
        }
        else if (enhancement == purchaseEnhancement.GainThreePoints) {
            name = "Gain 3 Points";
        }
        else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold) {
            name = "Increase Bane Threshold";
        }
        else if (enhancement == purchaseEnhancement.VirusSpreader) {
            name = "Super Spreader";
        }
        else if (enhancement == purchaseEnhancement.ExtraMoney) {
            name = "4 Money";
        }
        else if (enhancement == purchaseEnhancement.RefreshPerk) {
            name = "Refresh Perk";
        }
        return name;
    }
    getEnhancementDescription(enhancement) {
        let name = "idk";
        if (enhancement == purchaseEnhancement.IncreaseStartingSquare) {
            name = "You starting location for every future round increases by one.";
        }
        else if (enhancement == purchaseEnhancement.IncreaseHandSize) {
            name = "You will be able to hold one more card in your hand for every future round.";
        }
        else if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
            name = "You can buy a second of the same card effect this buy phase without using up a buy.";
        }
        else if (enhancement == purchaseEnhancement.GainPoint) {
            name = "Your total score will be increased by 1 point";
        }
        else if (enhancement == purchaseEnhancement.GainTwoPoints) {
            name = "Your total score will be increased by 2 points";
        }
        else if (enhancement == purchaseEnhancement.GainThreePoints) {
            name = "Your total score will be increased by 3 points";
        }
        else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold) {
            name = "You can play an additional bane before busting.";
        }
        else if (enhancement == purchaseEnhancement.VirusSpreader) {
            name = "Give every other player a virus card that stays for the duration of the game.";
        }
        else if (enhancement == purchaseEnhancement.ExtraMoney) {
            name = "Immediately gain 4 money for this buy phase (to buy cards with).";
        }
        else if (enhancement == purchaseEnhancement.RefreshPerk) {
            name = "Refresh your perk so you are able to use your 'no hand perk' again in future selection phases.";
        }
        return name;
    }
    getPerkName(perk) {
        //let perkPrefix = "This is a perk, a one time use until the effect is reloaded.  Only available on an empty hand.  ";
        let name = "idk";
        if (perk == noHandPerk.DrawNoPenalty) {
            name = this.getCardName(itemEffect.DrawNoPenalty);
        }
        else if (perk == noHandPerk.GainExtraMoneyDuringBuyPhase) {
            name = "2 Money";
        }
        return name;
    }
    getEndGameBonusName(bonus) {
        let name = "idk";
        if (bonus == endGameBonus.GemsMost) {
            name = "Most Gems";
        }
        else if (bonus == endGameBonus.GemsLeast) {
            name = "Least Gems";
        }
        else if (bonus == endGameBonus.SpacesMost) {
            name = "Most Spaces";
        }
        else if (bonus == endGameBonus.SpacesLeast) {
            name = "Least Spaces";
        }
        else if (bonus == endGameBonus.CrownsMost) {
            name = "Most Crowns";
        }
        else if (bonus == endGameBonus.CrownsLeast) {
            name = "Least Crowns";
        }
        else if (bonus == endGameBonus.CardsMost) {
            name = "Most Cards Played";
        }
        else if (bonus == endGameBonus.CardsLeast) {
            name = "Least Cards Played";
        }
        else if (bonus == endGameBonus.BustedMost) {
            name = "Most Busts";
        }
        else if (bonus == endGameBonus.BustedLeast) {
            name = "Least Busts";
        }
        else if (bonus == endGameBonus.BuysMost) {
            name = "Most Buys";
        }
        else if (bonus == endGameBonus.BuysLeast) {
            name = "Least Buys";
        }
        else if (bonus == endGameBonus.BanesMost) {
            name = "Most Banes Played";
        }
        else if (bonus == endGameBonus.BanesLeast) {
            name = "Least Banes Played";
        }
        return name;
    }
}
class RoundSummaryHelper {
    constructor(gameWrapper) {
        this.isShowing = false;
        this.gameWrapper = gameWrapper;
    }
    showCurrentRound() {
        this.isShowing = true;
        this.roundData = this.gameWrapper.game.currentRound;
        this.roundIndex = this.gameWrapper.game.completedRounds.length;
    }
    showCompletedRound() {
        this.isShowing = true;
        this.roundIndex = Math.max(this.gameWrapper.game.completedRounds.length - 1, 0);
        this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
    }
    showPreviousRound() {
        this.roundIndex = Math.max(this.roundIndex - 1, 0);
        if (this.roundIndex == this.gameWrapper.game.completedRounds.length) // In case there is no previous round.
            this.roundData = this.gameWrapper.game.currentRound;
        else
            this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
    }
    isPreviousDisabled() {
        return this.roundIndex == 0;
    }
    isNextDisabled() {
        return this.roundIndex == this.gameWrapper.game.completedRounds.length;
    }
    showNextRound() {
        this.roundIndex = Math.min(this.roundIndex + 1, this.gameWrapper.game.completedRounds.length);
        if (this.roundIndex == this.gameWrapper.game.completedRounds.length)
            this.roundData = this.gameWrapper.game.currentRound;
        else
            this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
    }
}
class CardInformationHelper {
    constructor(styleHelper) {
        this.styleHelper = styleHelper;
        this.close();
    }
    showItem(effect, description, points = 0) {
        this.isShowing = true;
        this.class = this.styleHelper.getCardClass(effect);
        this.iconClass = this.styleHelper.getCardIconClass(effect);
        this.headerText = this.styleHelper.getCardName(effect) + " " + (points > 0 ? points : "");
        this.descriptionText = description;
        this.priceHeaderClass = "fa fa-money-bill-alt";
        this.effect = effect;
    }
    showGem(enhancement) {
        this.isShowing = true;
        this.headerText = this.styleHelper.getEnhancementName(enhancement);
        this.descriptionText = this.styleHelper.getEnhancementDescription(enhancement);
        this.priceHeaderClass = "fa fa-gem";
        this.class = "sw-enhancement-background";
        this.iconClass = "fa fa-gem";
    }
    showInformation(header, description) {
        this.isShowing = true;
        this.headerText = header;
        this.descriptionText = description;
        this.priceHeaderClass = "";
        this.class = "";
        this.iconClass = "";
    }
    close() {
        this.isShowing = false;
        this.class = "";
        this.iconClass = "";
        this.headerText = "";
        this.descriptionText = "";
        this.priceHeaderClass = "";
        this.effect = undefined;
    }
}
class ItemBuyHelper {
    constructor() {
        this.close();
    }
    ;
    close() {
        this.effect = undefined;
        this.showGem = false;
    }
}
class EffectChooserHelper {
    constructor() {
        this.closeAll();
        this.amount = 1;
    }
    openEffect(chosenEffectCallback, includeBane = false, showSlider = false) {
        this.chosenEnhancementCallback = undefined;
        this.chosenEffectCallback = chosenEffectCallback;
        this.showSlider = showSlider;
        this.includeBane = includeBane;
        this.showEffect = true;
        //this.amount = 1;
    }
    openEnhancement(chosenEnhancementCallback) {
        this.chosenEffectCallback = undefined;
        this.chosenEnhancementCallback = chosenEnhancementCallback;
        this.showEffect = false;
    }
    closeEffect(effect = undefined, amount = undefined) {
        if (typeof this.chosenEffectCallback != "undefined")
            this.chosenEffectCallback(effect, amount);
        this.closeAll();
    }
    closeEnhancement(enhancement) {
        if (typeof this.chosenEnhancementCallback != "undefined")
            this.chosenEnhancementCallback(enhancement);
        this.closeAll();
    }
    closeAll() {
        this.chosenEffectCallback = undefined;
        this.chosenEnhancementCallback = undefined;
        this.includeBane = false;
        this.showSlider = false;
        //this.amount = 1;
    }
}
class HoverKeyHelper {
    constructor() {
        this.close();
    }
    show(infoKey) {
        this.infoKey = infoKey;
    }
    close() {
        this.infoKey = undefined;
    }
}
var infoKeyType;
(function (infoKeyType) {
    infoKeyType[infoKeyType["scoreboard"] = 0] = "scoreboard";
    infoKeyType[infoKeyType["currencySelection"] = 1] = "currencySelection";
    infoKeyType[infoKeyType["currencyBuy"] = 2] = "currencyBuy";
    infoKeyType[infoKeyType["boardSpace"] = 3] = "boardSpace";
    infoKeyType[infoKeyType["roundResultSpoils"] = 4] = "roundResultSpoils";
    infoKeyType[infoKeyType["tapTutorial"] = 5] = "tapTutorial";
    infoKeyType[infoKeyType["endGame"] = 6] = "endGame";
})(infoKeyType || (infoKeyType = {}));
// This is copied to server/Game.ts...
var itemEffect;
(function (itemEffect) {
    itemEffect[itemEffect["JustMove"] = 0] = "JustMove";
    itemEffect[itemEffect["SpecialNoEffect"] = 1] = "SpecialNoEffect";
    itemEffect[itemEffect["MoneyForSpecial"] = 2] = "MoneyForSpecial";
    itemEffect[itemEffect["MovesForSpecial"] = 3] = "MovesForSpecial";
    itemEffect[itemEffect["SpecialAdjacentMover"] = 4] = "SpecialAdjacentMover";
    itemEffect[itemEffect["BonusForKeys"] = 5] = "BonusForKeys";
    itemEffect[itemEffect["AddToHand"] = 6] = "AddToHand";
    itemEffect[itemEffect["FarMoving"] = 7] = "FarMoving";
    itemEffect[itemEffect["GemLandingExtra"] = 8] = "GemLandingExtra";
    itemEffect[itemEffect["ShuffleHand"] = 9] = "ShuffleHand";
    itemEffect[itemEffect["GrowingMover"] = 10] = "GrowingMover";
    itemEffect[itemEffect["GrowingPoints"] = 11] = "GrowingPoints";
    itemEffect[itemEffect["CopyMover"] = 12] = "CopyMover";
    itemEffect[itemEffect["RemovePreviousBane"] = 13] = "RemovePreviousBane";
    itemEffect[itemEffect["CopyOfPreviousCardToHand"] = 14] = "CopyOfPreviousCardToHand";
    itemEffect[itemEffect["CardsCostLess"] = 15] = "CardsCostLess";
    itemEffect[itemEffect["LastCardGem"] = 16] = "LastCardGem";
    itemEffect[itemEffect["TrashItem"] = 17] = "TrashItem";
    itemEffect[itemEffect["DiscardItem"] = 18] = "DiscardItem";
    itemEffect[itemEffect["PointInvestment"] = 19] = "PointInvestment";
    itemEffect[itemEffect["GainExtraBuy"] = 20] = "GainExtraBuy";
    itemEffect[itemEffect["Move5X"] = 21] = "Move5X";
    itemEffect[itemEffect["GainPoints5X"] = 22] = "GainPoints5X";
    itemEffect[itemEffect["BaneCountRemoval"] = 23] = "BaneCountRemoval";
    itemEffect[itemEffect["GainExtraMoney"] = 24] = "GainExtraMoney";
    itemEffect[itemEffect["Bane1Moves2"] = 25] = "Bane1Moves2";
    itemEffect[itemEffect["MovesForGems"] = 26] = "MovesForGems";
    itemEffect[itemEffect["EmptyHandGems"] = 27] = "EmptyHandGems";
    itemEffect[itemEffect["EmptyHandMoves"] = 28] = "EmptyHandMoves";
    itemEffect[itemEffect["IncreaseHandSize"] = 29] = "IncreaseHandSize";
    itemEffect[itemEffect["GainPointPerBuy"] = 30] = "GainPointPerBuy";
    itemEffect[itemEffect["GainExtraGemFromHere"] = 31] = "GainExtraGemFromHere";
    itemEffect[itemEffect["PlayedMostReward"] = 32] = "PlayedMostReward";
    itemEffect[itemEffect["DrawLowestNonBane"] = 33] = "DrawLowestNonBane";
    itemEffect[itemEffect["MoveAndPoint"] = 34] = "MoveAndPoint";
    itemEffect[itemEffect["MoveNextGem"] = 35] = "MoveNextGem";
    itemEffect[itemEffect["GemsForMoney"] = 36] = "GemsForMoney";
    itemEffect[itemEffect["PointsForNoGems"] = 37] = "PointsForNoGems";
    itemEffect[itemEffect["MoneyForPassingGems"] = 38] = "MoneyForPassingGems";
    // Get Reward if you have the most of these played
    // Decide if you want to add the previous card back to your deck.
    // Decide if you want to add a copy of the previous card to your deck at the end of the round (luck based, yuck).
    itemEffect[itemEffect["Tax"] = 39] = "Tax";
    itemEffect[itemEffect["Virus"] = 40] = "Virus";
    itemEffect[itemEffect["BaneDrawer"] = 41] = "BaneDrawer";
    itemEffect[itemEffect["BaneBriber"] = 42] = "BaneBriber";
    itemEffect[itemEffect["Poison"] = 43] = "Poison";
    itemEffect[itemEffect["PoisonBrewer"] = 44] = "PoisonBrewer";
    itemEffect[itemEffect["TaxCollector"] = 45] = "TaxCollector";
    itemEffect[itemEffect["BaneGiver"] = 46] = "BaneGiver";
    itemEffect[itemEffect["Bane"] = 47] = "Bane";
    // Cards after this are perks.
    itemEffect[itemEffect["DrawNoPenalty"] = 48] = "DrawNoPenalty";
})(itemEffect || (itemEffect = {}));
var purchaseEnhancement;
(function (purchaseEnhancement) {
    purchaseEnhancement[purchaseEnhancement["IncreaseStartingSquare"] = 0] = "IncreaseStartingSquare";
    purchaseEnhancement[purchaseEnhancement["IncreaseHandSize"] = 1] = "IncreaseHandSize";
    purchaseEnhancement[purchaseEnhancement["GainPoint"] = 2] = "GainPoint";
    purchaseEnhancement[purchaseEnhancement["GainTwoPoints"] = 3] = "GainTwoPoints";
    purchaseEnhancement[purchaseEnhancement["GainThreePoints"] = 4] = "GainThreePoints";
    purchaseEnhancement[purchaseEnhancement["IncreaseBaneThreshold"] = 5] = "IncreaseBaneThreshold";
    purchaseEnhancement[purchaseEnhancement["VirusSpreader"] = 6] = "VirusSpreader";
    purchaseEnhancement[purchaseEnhancement["RefreshPerk"] = 7] = "RefreshPerk";
    // Below here doesn't cost extra money to buy
    purchaseEnhancement[purchaseEnhancement["ExtraMoney"] = 8] = "ExtraMoney";
    purchaseEnhancement[purchaseEnhancement["CanBuyADuplicate"] = 9] = "CanBuyADuplicate";
})(purchaseEnhancement || (purchaseEnhancement = {}));
var noHandPerk;
(function (noHandPerk) {
    noHandPerk[noHandPerk["DrawNoPenalty"] = 0] = "DrawNoPenalty";
    noHandPerk[noHandPerk["GainExtraMoneyDuringBuyPhase"] = 1] = "GainExtraMoneyDuringBuyPhase";
})(noHandPerk || (noHandPerk = {}));
var endGameBonus;
(function (endGameBonus) {
    endGameBonus[endGameBonus["GemsMost"] = 0] = "GemsMost";
    endGameBonus[endGameBonus["GemsLeast"] = 1] = "GemsLeast";
    endGameBonus[endGameBonus["SpacesMost"] = 2] = "SpacesMost";
    endGameBonus[endGameBonus["SpacesLeast"] = 3] = "SpacesLeast";
    endGameBonus[endGameBonus["CrownsMost"] = 4] = "CrownsMost";
    endGameBonus[endGameBonus["CrownsLeast"] = 5] = "CrownsLeast";
    endGameBonus[endGameBonus["CardsMost"] = 6] = "CardsMost";
    endGameBonus[endGameBonus["CardsLeast"] = 7] = "CardsLeast";
    endGameBonus[endGameBonus["BustedMost"] = 8] = "BustedMost";
    endGameBonus[endGameBonus["BustedLeast"] = 9] = "BustedLeast";
    endGameBonus[endGameBonus["BuysMost"] = 10] = "BuysMost";
    endGameBonus[endGameBonus["BuysLeast"] = 11] = "BuysLeast";
    endGameBonus[endGameBonus["BanesMost"] = 12] = "BanesMost";
    endGameBonus[endGameBonus["BanesLeast"] = 13] = "BanesLeast"; // Have these two be last
})(endGameBonus || (endGameBonus = {}));
//# sourceMappingURL=main.js.map