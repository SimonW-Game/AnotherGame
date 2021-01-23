const socket: SocketIOClient.Socket = io();
const PLAY_CARD_EVENT = "PlayCardEvent";
const CHANGE_DECK_EVENT = "DrawHandEvent";
const SCALE_SETTINGS = "sw-scale";
const ASSIST_SETTINGS = "sw-assist";

class Game {
	public gameId: string;
	public players: IPlayer[];
	public completedRounds: IRoundData[];
	public currentRound: IRoundData;
	public roundPhaseStatus: RoundPhaseStatus;
	public options: IGameOptions;

	public constructor(gameId: string, players: IPlayer[], completedRounds: IRoundData[], options: IGameOptions) {
		this.gameId = gameId;
		this.players = players;
		this.completedRounds = completedRounds;
		this.currentRound = { selectionResults: undefined, buySelectionData: undefined, thingsToBuy: undefined };
		this.roundPhaseStatus = RoundPhaseStatus.PreRound;
		this.options = options;
	}
	public addPlayer(playerData: IPlayerClientData) {
		this.players.push({ playerData: playerData, isDisconnected: false, isWaitingOnOthers: false });
	}
	public playerDisconnected(index: number, hasGameNotStarted: boolean) {
		if (hasGameNotStarted) {
			// If the game hasn't started, just remove the player.
			const playersIndex = this.players.findIndex(p => p.playerData.index === index);
			this.players.splice(playersIndex, 1);
		} else {
			const player = this.players.find(p => p.playerData.index === index);
			player.isDisconnected = true;
		}
	}
	public getPlayerByIndex(index: number): IPlayer {
		return this.players.find(p => p.playerData.index == index);
	}
}

enum RoundPhaseStatus {
	PreRound,
	PlayPhase,
	BuyPhase,
	GameAnalysisPhase,
}

interface IGameOptions {
	gameMode?: number; // Set when clicking the mode I guess.

	giveRoundBonuses: boolean;
	disableAssistMode: boolean;
	enableTimeLimit: boolean;
	enableEndGameBonus: boolean;

	secondsPerPhase: number;

	totalRounds: number;
	startingGems: number;
	startingBuys: number;
	startingPlayerHandSize: number;
	startingBaneThreshold: number;
	pointsPerEndGameBonus: number;

	endGameMoneyForPoints: number; // number of money's = 1 point.
	endGameGemsForPoints: number; // number of gems = 1 point.


	endGameBonuses: endGameBonus[];

	perks: noHandPerk[];
	startingHand: IItem[]; // Will have to figure out the power, etc...
	forceBuys: IItem[][]; // a list for each round
	effectsAvailable: itemEffect[][]; // a list for each round.
	enhancementsAvailable: purchaseEnhancement[][]; // a list for each round.
}

interface IPlayerClientData {
	index: number;
	username: string;
	totalScore: number;
	items: IItem[];
	gemTotal: number;
	availableBuys: number;
	startingPosition: number;
	baneThreshold: number;
	handSize: number;
	hasPerkAvailable: boolean;

	totalBustedCount: number;
	totalGameGemCount: number;
	totalMovedSquares: number;
	totalCardsPlayed: number;
	totalCardsBought: number;
	totalEnhancements: purchaseEnhancement[];
}
interface IGameWrapper {
	game: Game;
	gameMode: number;
	endGameInfo: IEndGameInfo;
}
const gameWrapper: IGameWrapper = {
	game: undefined,
	gameMode: 0,
	endGameInfo: undefined,
}

interface IGlobalSettings {
	isShowing: boolean;
	scaleOption: number; // could do enum
	assistMode: boolean;
}

interface IEndGameInfo {
	endGameBonuses: { [endGameBonus: number]: { winningAmount: number, winners: number[] } };
	players: IEndGamePlayerInfo[];
}
interface IEndGamePlayerInfo {
	playerData: IPlayerClientData;
	endGamePointsForMoney: number;
	endGamePointsForGems: number;
	endGamePointsForCards: number;
}
class StyleHelper {
	constructor() { }
	public getCardClass(effect: itemEffect): string {
		let cardClass = "";

		if (effect == itemEffect.Bane)
			cardClass = "sw-card-bane";
		else if (effect == itemEffect.JustMove)
			cardClass = "sw-card-just-move";
		else if (effect == itemEffect.SpecialNoEffect)
			cardClass = "sw-card-special-no-effect";
		else if (effect == itemEffect.AddToHand)
			cardClass = "sw-card-add-to-hand";
		else if (effect == itemEffect.GemsForKeys)
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
		else if (effect == itemEffect.CopyOfPreviousCard)
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
		else if (effect == itemEffect.BaneBriber)
			cardClass = "sw-card-bane-briber";
		else if (effect == itemEffect.BaneDrawer)
			cardClass = "sw-card-bane-drawer";
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
		else if (effect == itemEffect.MoveTo5)
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
		else if (effect == itemEffect.FutureGemsUp)
			cardClass = "sw-card-extra-future-gem";
		else if (effect == itemEffect.FuturePassingGemsUp)
			cardClass = "sw-card-passing-future-gem";
		else if (effect == itemEffect.MoveAndPoint)
			cardClass = "sw-card-move-point";
		else if (effect == itemEffect.MoveNextGem)
			cardClass = "sw-card-move-to-gem";
		else if (effect == itemEffect.GemsForMoney)
			cardClass = "sw-card-gem-for-money";
		else if (effect == itemEffect.PointsForPassingGems)
			cardClass = "sw-card-points-no-gems";
		else if (effect == itemEffect.MoneyForPassingGems)
			cardClass = "sw-card-money-pass-gem";
		else if (effect == itemEffect.JustDrewEmptyBonus)
			cardClass = "sw-card-just-drew-bonus";
		else if (effect == itemEffect.JustDrewEmptyMover)
			cardClass = "sw-card-just-drew-mover";
		else if (effect == itemEffect.PlayCardMovement)
			cardClass = "sw-card-play-card-movement";
		else
			cardClass = "sw-perk-card";

		return cardClass;
	}
	public getCardIconClass(effect: itemEffect): string {
		let cardClass = "";

		if (effect == itemEffect.Bane)
			cardClass = "fa fa-skull";
		else if (effect == itemEffect.JustMove)
			cardClass = "fa fa-walking";
		else if (effect == itemEffect.SpecialNoEffect)
			cardClass = "fa fa-key";
		else if (effect == itemEffect.AddToHand)
			cardClass = "fa fa-hand-holding-medical";
		else if (effect == itemEffect.GemsForKeys)
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
		else if (effect == itemEffect.CopyOfPreviousCard)
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
		else if (effect == itemEffect.BaneBriber)
			cardClass = "fa fa-briefcase";
		else if (effect == itemEffect.BaneDrawer)
			cardClass = "fa fa-heart-broken";
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
		else if (effect == itemEffect.MoveTo5)
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
		else if (effect == itemEffect.FutureGemsUp)
			cardClass = "fa fa-calendar-plus";
		else if (effect == itemEffect.FuturePassingGemsUp)
			cardClass = "fa fa-calendar-plus";
		else if (effect == itemEffect.MoveAndPoint)
			cardClass = "fa fa-medal";
		else if (effect == itemEffect.MoveNextGem)
			cardClass = "fa fa-angle-double-right";
		else if (effect == itemEffect.GemsForMoney)
			cardClass = "fa fa-exchange-alt";
		else if (effect == itemEffect.PointsForPassingGems)
			cardClass = "fa fa-times-circle";
		else if (effect == itemEffect.MoneyForPassingGems)
			cardClass = "fa fa-circle-notch";
		else if (effect == itemEffect.JustDrewEmptyBonus)
			cardClass = "fa fa-bell";
		else if (effect == itemEffect.JustDrewEmptyMover)
			cardClass = "far fa-bell";
		else if (effect == itemEffect.PlayCardMovement)
			cardClass = "fa fa-people-carry";

		return cardClass;
	}
	public getCardName(effect: itemEffect): string {
		let cardName = "idk";

		if (effect == itemEffect.Bane)
			cardName = "Bane";
		else if (effect == itemEffect.JustMove)
			cardName = "Move";
		else if (effect == itemEffect.SpecialNoEffect)
			cardName = "Key";
		else if (effect == itemEffect.AddToHand)
			cardName = "Add To Hand";
		else if (effect == itemEffect.GemsForKeys)
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
		else if (effect == itemEffect.CopyOfPreviousCard)
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
		else if (effect == itemEffect.BaneBriber)
			cardName = "Bane Briber";
		else if (effect == itemEffect.BaneDrawer)
			cardName = "Bane Drawer";
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
		else if (effect == itemEffect.MoveTo5)
			cardName = "Move To 5n";
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
		else if (effect == itemEffect.FutureGemsUp)
			cardName = "Future Gems Up";
		else if (effect == itemEffect.FuturePassingGemsUp)
			cardName = "Gain Passing Gems";
		else if (effect == itemEffect.MoveAndPoint)
			cardName = "Extra Point";
		else if (effect == itemEffect.MoveNextGem)
			cardName = "Move To Gem";
		else if (effect == itemEffect.GemsForMoney)
			cardName = "Gems for Money";
		else if (effect == itemEffect.PointsForPassingGems)
			cardName = "Passing Gems Points";
		else if (effect == itemEffect.MoneyForPassingGems)
			cardName = "Pass Gem Money";
		else if (effect == itemEffect.JustDrewEmptyBonus)
			cardName = "Empty Draw Bonus";
		else if (effect == itemEffect.JustDrewEmptyMover)
			cardName = "Empty Draw Mover";
		else if (effect == itemEffect.PlayCardMovement)
			cardName = "Hand Move Evolver";

		return cardName;
	}
	public getCardDescription(item: IItem, player: IPlayer = undefined, roundWrapper: RoundWrapper = undefined): string {
		let description = "idk";

		if (item.effect == itemEffect.Bane) {
			let baneCount: number;
			if (typeof player !== "undefined" && typeof roundWrapper !== "undefined")
				baneCount = Math.max(0, player.playerData.baneThreshold - roundWrapper.getSelection().baneCount);
			else
				baneCount = -1;
			description = "Bane will give you points, but too many Bane's will cause you to bust" + (baneCount == -1 ? "" : "(" + baneCount + " base movement left)") + ".  If you bust, you will have to chose to gain points or spend money.  Effects that make Banes move further do not increase their bane count.";
		} else if (item.effect == itemEffect.JustMove) {
			description = "Moves you forward on the board.  No special effect.";
		} else if (item.effect == itemEffect.SpecialNoEffect) {
			description = "Keys will do nothing on their own.  Other cards rely on playing keys.";
		} else if (item.effect == itemEffect.AddToHand) {
			let additionalCardText: string;
			if (item.amount == 0)
				additionalCardText = "";
			else
				additionalCardText = item.amount + " ";
			description = "Draw " + additionalCardText + "more card(s) to your hand, then chose a remaining card to play (additional cards will be reshuffled).";
		} else if (item.effect == itemEffect.GemsForKeys) {
			description = "Gain 1 extra gem for each Key you've played so far, up to three extra gems.";
		} else if (item.effect == itemEffect.MovesForSpecial) {
			description = "Move an extra space for each Key you've played so far, up to three extra spaces.";
		} else if (item.effect == itemEffect.FarMoving) {
			description = "Moves 6 places forward.  The only card to move more than 4 spaces by default.";
		} else if (item.effect == itemEffect.GemLandingExtra) {
			let additionalCardText: string;
			if (item.amount == 0)
				additionalCardText = "1-2 extra gems";
			else if (item.amount == 1)
				additionalCardText = "an extra gem";
			else
				additionalCardText = "an extra " + item.amount + " gems";
			description = "Gain " + additionalCardText + " if this card lands on a gem.  If not, gain no gems.";
		} else if (item.effect == itemEffect.ShuffleHand) {
			description = "Shuffle the remaining cards in your hand back into your deck.";
		} else if (item.effect == itemEffect.DrawLowestNonBane) {
			description = "Draw the lowest 0-1 moving, non-bane card from your deck and add it to your hand.  Ties decided randomly (attack cards can be drawn)";
		} else if (item.effect == itemEffect.GrowingMover) {
			let additionalCardText: string;
			if (item.points == 1)
				additionalCardText = "0 space";
			else
				additionalCardText = item.points + " spaces"

			description = "Moves " + additionalCardText + " forward.  After each round, this will permanently move one additional space until it reaches 4 spaces.";
		} else if (item.effect == itemEffect.GrowingPoints) {
			let additionalCardText: string;
			if (item.amount == 0)
				additionalCardText = "0 point";
			else if (item.amount == 1)
				additionalCardText = "1 point";
			else
				additionalCardText = item.amount + " points"

			description = "Gains " + additionalCardText + " at the end of the last round.  Each time you play this, this will permanently gain one additional point until it reaches 4 points. This does not move you forward.";
		} else if (item.effect == itemEffect.CopyMover) {
			description = "For each Copycat you play immediately after each other, you move double the spaces (up to 8 spaces).";
		} else if (item.effect == itemEffect.SpecialAdjacentMover) {
			description = "If the last card you played was a Key, move an additional space.";
		} else if (item.effect == itemEffect.RemovePreviousBane) {
			description = "If you play this card immediately after drawing it (without playing another afterward) and the last card you played was a Bane, shuffle it back into your deck and remove one bane counter.";
		} else if (item.effect == itemEffect.CopyOfPreviousCard) {
			description = "If you play this card immediately after drawing it (without playing another afterward), copy the last card you played and put it in our hand (with the choice to end your turn if desired).";
		} else if (item.effect == itemEffect.CardsCostLess) {
			let additionalCardText: string = "";
			if (item.points > 0)
				additionalCardText = String(item.points) + " ";
			description = "Cards cost " + additionalCardText + "less during the buy phase.";
		} else if (item.effect == itemEffect.LastCardGem) {
			description = "If this is the last card you played during the selection phase, earn 4 gems.";
		} else if (item.effect == itemEffect.Virus) {
			description = "When drawn it shuffles your leftmost card in your hand back into your deck.  When played, this adds a copy of itself back into your deck.";
		} else if (item.effect == itemEffect.Poison) {
			description = "Prevents you from drawing or ending your turn until played.  When played, draw up to your hand size plus one.  Poisons only last one round and will be trashed after the buy phase.";
		} else if (item.effect == itemEffect.PoisonBrewer) {
			description = "Adds a Poison to everyone else's deck during the next selection phase (Poison will be trashed after one round).  This effect stacks, send as many Poisons to your opponents as you can!";
		} else if (item.effect == itemEffect.BaneBriber) {
			description = "Adds a Bane Drawer to everyone else's deck during the next selection phase (Bane Drawers will be trashed after one round).  This effect stacks, send as many Bane Drawers to your opponents as you can!";
		} else if (item.effect == itemEffect.BaneGiver) {
			description = "If somebody plays at least one Bane Giver, everyone who has not played a Bane Giver this selection phase will add a Bane 1 to their deck.";
		} else if (item.effect == itemEffect.TaxCollector) {
			description = "Adds a Tax to everyone else's deck during the next selection phase (Tax will be trashed after one round).  This effect stacks, send as many Taxes to your opponents as you can!";
		} else if (item.effect == itemEffect.BaneDrawer) {
			description = "When played, this will draw the next bane in your deck (you will have the choice to end your turn).  Bane Drawers only last one round and will be trashed after the buy phase.";
		} else if (item.effect == itemEffect.Tax) {
			description = "When played, this will decrease the money you have to buy with during the buy phase by 10% (rounding down, or at least 1).  Taxes only last one round and will be trashed after the buy phase.";
		} else if (item.effect == itemEffect.TrashItem) {
			description = "When played, trash the card to the left of this card (removing it from your deck).  If there are no cards to the left of this, it trashes nothing.";
		} else if (item.effect == itemEffect.DiscardItem) {
			description = "When played, discard the card to the left of this card.  If there are no cards to the left of this, it discards nothing.";
		} else if (item.effect == itemEffect.PointInvestment) {
			let additionalText: string;
			if (item.amount == 0)
				additionalText = "1-2 points";
			else if (item.amount == 1)
				additionalText = "1 point";
			else if (item.amount == 2)
				additionalText = "2 points";
			description = "When played, it will earn you " + additionalText + ".  Then it will be trashed and you will be refunded half of the cost.";
		} else if (item.effect == itemEffect.PlayedMostReward) {
			description = "Gains a bonus for playing more of these than others. Playing the least yields no reward. Playing more than one other player gains you 1 money for the buy phase.  Playing more than half of the other players also gives you starting location + 1.  If you played the most of these this round, gain a money, starting location + 1, and a point.";
		} else if (item.effect == itemEffect.BonusForKeys) {
			description = "Gains a bonus for keys played before this. 1 key = 1 extra money during buy phase.  2 keys = 1 point.  3 or more keys = 1 money, 1 point, and 1 gem.";
		} else if (item.effect == itemEffect.GainExtraBuy) {
			description = "Gain an extra buy during the buy phase.  This effect stacks.";
		} else if (item.effect == itemEffect.MoveTo5) {
			description = "Move to the next board space multiple of 5 (Will not move if already on a multiple of 5).";
		} else if (item.effect == itemEffect.BaneCountRemoval) {
			description = "Remove a single bane counter.  You can only have one of these in your deck.";
		}
		else if (item.effect == itemEffect.GainExtraMoney) {
			let additionalCardText: string = "";
			if (item.points > 0)
				additionalCardText = String(item.amount) + " ";
			description = "Gain " + additionalCardText + "extra money for the buy phase.  This card always moves one space.";
		}
		else if (item.effect == itemEffect.GainPoints5X) {
			description = "If you play this card so it lands on a board space of a multiple of 5, gain two points (after the selection phase).  This effect stacks.";
		}
		else if (item.effect == itemEffect.Bane1Moves2) {
			description = "For every Bane 1 you play after this, it will move one additional space.  This card effect does not stack (it will still move an additional space if another effect also adds movement to the Bane 1).  This will not increase the bane count (Bane 1's will always only decrease the bane threshold by 1).";
		}
		else if (item.effect == itemEffect.MovesForGems) {
			description = "Move an extra space for every 5 gems you've earned this round so far, up to three spaces.";
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
		else if (item.effect == itemEffect.FutureGemsUp) {
			description = "Landing on gems gain you an extra gem for the rest of the round. This effect stacks.";
		}
		else if (item.effect == itemEffect.FuturePassingGemsUp) {
			description = "Passing gems gain you 2 gems for the rest of the round (or 2 extra gems if this effect is already active). This effect stacks.";
		}
		else if (item.effect == itemEffect.MoveAndPoint) {
			description = "Does nothing aside from moving when played.  At the end of the game, gain a point.";
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
		else if (item.effect == itemEffect.PointsForPassingGems) {
			description = "At the end of the round, gain a point for the number of gems passed minus the number of gems landed on, up to 4 points.";//gain a point for every additional gem you passed more than gem you landed on, up to 4 points.";
		}
		else if (item.effect == itemEffect.MoneyForPassingGems) {
			let additionalText: string;
			if (item.amount == 0)
				additionalText = "1-2";
			else
				additionalText = String(item.amount);
			description = "Gain " + additionalText + " money for every gem you have not landed on so far.";
		}
		else if (item.effect == itemEffect.JustDrewEmptyBonus) {
			let additionalText: string;
			if (item.amount == 0)
				additionalText = "1-2 points, 1-2 money, and 1-2 gems.";
			else if (item.amount == 1)
				additionalText = "1 point, 1 money, and 1 gem.";
			else if (item.amount == 2)
				additionalText = "2 points, 2 money, and 2 gems";
			description = "If you drew this with an empty hand, gain " + additionalText;
		}
		else if (item.effect == itemEffect.JustDrewEmptyMover) {
			description = "If you drew this with an empty hand, move 3 extra spaces.";
		}
		else if (item.effect == itemEffect.PlayCardMovement) {
			description = "For every 2 cards you play while this is in your hand, gain 1 extra movement (up to 3).";
		}
		return description;
	}

	public getEnhancementName(enhancement: purchaseEnhancement) {
		let name: string = "idk";
		if (enhancement == purchaseEnhancement.IncreaseStartingSquare) {
			name = "Starting Location + 1";
		} else if (enhancement == purchaseEnhancement.IncreaseHandSize) {
			name = "Hand Size + 1";
		} else if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
			name = "Buy Duplicate Card";
		} else if (enhancement == purchaseEnhancement.GainPoint) {
			name = "Gain 1 Point";
		} else if (enhancement == purchaseEnhancement.GainTwoPoints) {
			name = "Gain 2 Points";
		} else if (enhancement == purchaseEnhancement.GainThreePoints) {
			name = "Gain 3 Points";
		} else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold) {
			name = "Increase Bane Threshold";
		} else if (enhancement == purchaseEnhancement.VirusSpreader) {
			name = "Super Spreader";
		} else if (enhancement == purchaseEnhancement.ExtraMoney) {
			name = "4 Money";
		} else if (enhancement == purchaseEnhancement.RefreshPerk) {
			name = "Refresh Perk";
		} else if (enhancement == purchaseEnhancement.NextRoundGemsUp) {
			name = "Earn Extra Gems";
		} else if (enhancement == purchaseEnhancement.UpgradeFirstCard) {
			name = "Upgrade First Card";
		} else if (enhancement == purchaseEnhancement.BuyExtraMoves) {
			name = "Buying Extra Moves";
		}
		return name;
	}

	public getEnhancementDescription(enhancement: purchaseEnhancement) {
		let name: string = "idk";
		if (enhancement == purchaseEnhancement.IncreaseStartingSquare) {
			name = "You starting location for every future round increases by one.";
		} else if (enhancement == purchaseEnhancement.IncreaseHandSize) {
			name = "You will be able to hold one more card in your hand for every future round.";
		} else if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
			name = "You can buy a second of the same card effect this buy phase without using up a buy.";
		} else if (enhancement == purchaseEnhancement.GainPoint) {
			name = "Your total score will be increased by 1 point";
		} else if (enhancement == purchaseEnhancement.GainTwoPoints) {
			name = "Your total score will be increased by 2 points";
		} else if (enhancement == purchaseEnhancement.GainThreePoints) {
			name = "Your total score will be increased by 3 points";
		} else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold) {
			name = "For the next round, your bane counter increases by 1.";
		} else if (enhancement == purchaseEnhancement.VirusSpreader) {
			name = "Give every other player a virus card that stays for the duration of the game.";
		} else if (enhancement == purchaseEnhancement.ExtraMoney) {
			name = "Immediately gain 4 money for this buy phase (to buy cards with).";
		} else if (enhancement == purchaseEnhancement.RefreshPerk) {
			name = "Refresh your perk so you are able to use your 'no hand perk' again in future selection phases.";
		} else if (enhancement == purchaseEnhancement.NextRoundGemsUp) {
			name = "For the next round, landing on gems gain you an extra gem.";
		} else if (enhancement == purchaseEnhancement.UpgradeFirstCard) {
			name = "Increase the movement of the first card you played in the selection phase of this round by one for the rest of the game. Banes that are upgraded will not increase their bane count.";
		} else if (enhancement == purchaseEnhancement.BuyExtraMoves) {
			name = "Cards bought during this buy phase gain 1 extra movement.";
		}
		return name;
	}

	public getPlayers = function (player: IPlayer): IPlayer[] {
		// You're always first, then top to bottom.
		if (gameWrapper.game) {
			const otherPlayers = gameWrapper.game.players.filter(p => p != player);
			return [player, ...otherPlayers.sort((a, b) => b.playerData.totalScore - a.playerData.totalScore)];
		}
		return [];
	};
	public getPerkName(perk: noHandPerk): string {
		//let perkPrefix = "This is a perk, a one time use until the effect is reloaded.  Only available on an empty hand.  ";
		let name: string = "idk";
		if (perk == noHandPerk.DrawNoPenalty) {
			name = this.getCardName(itemEffect.DrawNoPenalty);
		}
		else if (perk == noHandPerk.GainExtraMoneyDuringBuyPhase) {
			name = "2 Money";
		}

		return name;
	}



	public getEndGameBonusName(bonus: endGameBonus) {
		let name = "idk";
		if (bonus == endGameBonus.GemsMost) {
			name = "Most Gems";
		} else if (bonus == endGameBonus.GemsLeast) {
			name = "Least Gems";
		} else if (bonus == endGameBonus.SpacesMost) {
			name = "Most Spaces";
		} else if (bonus == endGameBonus.SpacesLeast) {
			name = "Least Spaces";
		} else if (bonus == endGameBonus.CrownsMost) {
			name = "Most Crowns";
		} else if (bonus == endGameBonus.CrownsLeast) {
			name = "Least Crowns";
		} else if (bonus == endGameBonus.CardsMost) {
			name = "Most Cards Played";
		} else if (bonus == endGameBonus.CardsLeast) {
			name = "Least Cards Played";
		} else if (bonus == endGameBonus.BustedMost) {
			name = "Most Busts";
		} else if (bonus == endGameBonus.BustedLeast) {
			name = "Least Busts";
		} else if (bonus == endGameBonus.BuysMost) {
			name = "Most Buys";
		} else if (bonus == endGameBonus.BuysLeast) {
			name = "Least Buys";
		} else if (bonus == endGameBonus.BanesMost) {
			name = "Most Banes Played";
		} else if (bonus == endGameBonus.BanesLeast) {
			name = "Least Banes Played";
		}
		return name;
	}
}

class RoundSummaryHelper {
	public isShowing: boolean;
	public roundData: IRoundData;
	private gameWrapper: IGameWrapper;
	public roundIndex: number;
	public constructor(gameWrapper: IGameWrapper) {
		this.isShowing = false;
		this.gameWrapper = gameWrapper;
	}
	public showCurrentRound() {
		this.isShowing = true;
		this.roundData = this.gameWrapper.game.currentRound;
		this.roundIndex = this.gameWrapper.game.completedRounds.length;
	}
	public showCompletedRound() {
		this.isShowing = true;
		this.roundIndex = Math.max(this.gameWrapper.game.completedRounds.length - 1, 0);
		this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
	}
	public showPreviousRound() {
		this.roundIndex = Math.max(this.roundIndex - 1, 0);
		if (this.roundIndex == this.gameWrapper.game.completedRounds.length) // In case there is no previous round.
			this.roundData = this.gameWrapper.game.currentRound;
		else
			this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
	}
	public isPreviousDisabled() {
		return this.roundIndex == 0;
	}
	public isNextDisabled() {
		return this.roundIndex == this.gameWrapper.game.completedRounds.length;
	}
	public showNextRound() {
		this.roundIndex = Math.min(this.roundIndex + 1, this.gameWrapper.game.completedRounds.length);
		if (this.roundIndex == this.gameWrapper.game.completedRounds.length)
			this.roundData = this.gameWrapper.game.currentRound;
		else
			this.roundData = this.gameWrapper.game.completedRounds[this.roundIndex];
	}
}
class CardInformationHelper {
	public effect: itemEffect;

	public isShowing: boolean;
	public class: string;
	public iconClass: string;
	public headerText: string;
	public descriptionText: string;
	public priceHeaderClass: string;
	public styleHelper: StyleHelper;

	constructor(styleHelper: StyleHelper) {
		this.styleHelper = styleHelper;
		this.close();
	}
	public showItem(effect: itemEffect, description: string, points: number = 0) {
		this.isShowing = true;
		this.class = this.styleHelper.getCardClass(effect);
		this.iconClass = this.styleHelper.getCardIconClass(effect);
		this.headerText = this.styleHelper.getCardName(effect) + " " + (points > 0 ? points : "")
		this.descriptionText = description;
		this.priceHeaderClass = "fa fa-money-bill-alt";
		this.effect = effect;
	}

	public showGem(enhancement: purchaseEnhancement) {
		this.isShowing = true;
		this.headerText = this.styleHelper.getEnhancementName(enhancement);
		this.descriptionText = this.styleHelper.getEnhancementDescription(enhancement);
		this.priceHeaderClass = "fa fa-gem";
		this.class = "sw-enhancement-background";
		this.iconClass = "fa fa-gem";
	}

	public showInformation(header: string, description: string) {
		this.isShowing = true;
		this.headerText = header;
		this.descriptionText = description;
		this.priceHeaderClass = "";
		this.class = "";
		this.iconClass = "";
	}
	public close() {
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
	public effect: itemEffect;
	public showGem: boolean;;
	constructor() {
		this.close();
	}
	public close() {
		this.effect = undefined;
		this.showGem = false;
	}
}
class EffectChooserHelper {
	public chosenEffectCallback: (effect: itemEffect, amount?: number) => void;
	public chosenEnhancementCallback: (enhancement: purchaseEnhancement) => void;
	public showSlider: boolean;
	public includeBane: boolean;
	public amount: number;
	public showEffect: boolean;
	constructor() {
		this.closeAll();
		this.amount = 1;
	}
	public openEffect(chosenEffectCallback: (effect: itemEffect, amount?: number) => void, includeBane: boolean = false, showSlider: boolean = false) {
		this.chosenEnhancementCallback = undefined;
		this.chosenEffectCallback = chosenEffectCallback;
		this.showSlider = showSlider;
		this.includeBane = includeBane;
		this.showEffect = true;
		//this.amount = 1;
	}
	public openEnhancement(chosenEnhancementCallback: (enhancement: purchaseEnhancement) => void) {
		this.chosenEffectCallback = undefined;
		this.chosenEnhancementCallback = chosenEnhancementCallback;
		this.showEffect = false;
	}
	public closeEffect(effect: itemEffect = undefined, amount: number = undefined) {
		if (typeof this.chosenEffectCallback != "undefined")
			this.chosenEffectCallback(effect, amount);
		this.closeAll();
	}
	public closeEnhancement(enhancement: purchaseEnhancement) {
		if (typeof this.chosenEnhancementCallback != "undefined")
			this.chosenEnhancementCallback(enhancement);
		this.closeAll();
	}

	public closeAll() {
		this.chosenEffectCallback = undefined;
		this.chosenEnhancementCallback = undefined;
		this.includeBane = false;
		this.showSlider = false;
		//this.amount = 1;
	}
}

class HoverKeyHelper {
	public infoKey: infoKeyType;
	constructor() {
		this.close();
	}
	public show(infoKey: infoKeyType) {
		this.infoKey = infoKey;
	}
	public close() {
		this.infoKey = undefined;
	}
}

interface IPlayer {
	playerData: IPlayerClientData;
	isDisconnected: boolean;
	isWaitingOnOthers: boolean;
}
interface IUserData {
	isHost: boolean;
	username: string;
	index: number;
}

interface IRoundData {
	selectionResults: ISelectionResults;
	buySelectionData: IBuyResults;

	thingsToBuy: IThingsToBuy;
}
interface IThingsToBuy {
	items: { [effect: number /*itemEffect*/]: IItem[] };
	// Enhancements to buy with gems.
	enhancments: { enhancement: purchaseEnhancement, cost: number }[]
}

enum infoKeyType {
	scoreboard,
	currencySelection,
	currencyBuy,
	boardSpace,
	roundResultSpoils,
	tapTutorial,
	endGame,
	handInfo,
}

// This is copied to server/Game.ts...
enum itemEffect {
	JustMove, // Just moves you along the board.
	SpecialNoEffect, // These do nothing (except progress you through the board).  They will be used as triggers to other card effects.
	GemsForKeys, // Adds one money for each SpecialNoEffect's you have played.
	MovesForSpecial, // Move one extra spot for each SpecialNoEffect's you have played.
	SpecialAdjacentMover, // If the previous card is SpecialNoEffect, do something.
	BonusForKeys, // Grants you a bonus depending on how many keys you've played before this.
	AddToHand, // Playing it will add <amount> of cards to your hand (or replace your hand or something).
	FarMoving, // Literally an expensive item that moves you far.
	GemLandingExtra,	// Gain an extra gem if you landed on a gem.
	ShuffleHand, // Shuffle remaining cards in your hand to your deck.
	GrowingMover, // Starts at 1 and grows each time you play it up to 4.
	GrowingPoints, // Gain "amount" points at the end of the game.  Does nothing in your deck. Grows each time you play it up to 4.
	CopyMover, // Moves twice as far as the immediately played CopyMover
	RemovePreviousBane, // If the previous card is a Bane, shuffle it back in deck (remove bane penalty).
	CopyOfPreviousCard, // Add a copy of the previous card you played to your hand.
	CardsCostLess, // Cards cost less during buy phase.
	LastCardGem, // If this was the last card you played, gain gems.
	TrashItem, // Super OP. Remove the leftmost card in your hand from your deck. (Might want to make it so you can't play if it's the last card in hand)
	DiscardItem, // Discards the leftmost card in your hand.
	PointInvestment, // Single use card that will grant you a point (you get most of your money back for buy phase when you play it).
	GainExtraBuy, // Grants you an additional buy during the buy phase.
	MoveTo5, // Move to next multiple of 5.
	GainPoints5X, // If you land on a multiple of 5, gain a point.
	BaneCountRemoval, // Remove a bane counter
	GainExtraMoney, // Gain extra money during the buy phase.
	Bane1Moves2, // Future Bane 1's you play move 2 spaces.  Take that BaneGiver!
	MovesForGems, // For each 5 gems you got this round, move an extra space (up to three).
	EmptyHandGems, // Gain 3 gems if played with an empty hand.
	EmptyHandMoves, // Move an extra space if played with an empty hand.
	JustDrewEmptyMover, // Moves you 4 spaces if you drew it with an empty hand.
	JustDrewEmptyBonus, // Gain Money, gem, and point if you drew it with an empty hand.
	IncreaseHandSize, // Increase hand size for the rest of the round
	GainPointPerBuy, // Gain a point for every card you buy during the buy phase.
	FutureGemsUp, // Every time you land on a gem from here on out, gain an additional gem
	FuturePassingGemsUp, // Get 2 gems for each gem you pass.
	PlayedMostReward, // Reward the player for playing the most of these
	DrawLowestNonBane, // Draws lowest moving non-bane card.
	MoveAndPoint, // Just moves and gives you points.
	MoveNextGem, // Moves to the next gem.
	GemsForMoney, // Removes 3 gems for 1 money.
	PointsForPassingGems, // point for each gem below 4 you are.
	MoneyForPassingGems, // Get extra money for each gem you passed.
	PlayCardMovement, // While this is in your hand, every two cards you play will increase its movement by 1, up to 3 extra spaces.
	// Move as far as the furthest moving card you've played this round.
	// Decide if you want to add the previous card back to your deck.
	// Decide if you want to add a copy of the previous card to your deck at the end of the round (luck based, yuck).
	// Play the next card in your deck.  If it is a bane, reduce it's bane count by 1.  Combo breaker, but really safe to play.


	TaxCollector, // Adds a Tax into every other players deck.
	PoisonBrewer, // Adds a poison into every other players deck for the next round.
	BaneBriber, // Adds a BaneDrawer into every other players deck for the next round.
	BaneGiver, // Adds a Bane 1 into every other players deck.
	Tax, // Removes one money from their buy phase.
	Poison, // prevents you from drawing or ending your turn while in hand.  When played, it draws cards up to your hand size + 1. (Might only want to remove if you played it)
	BaneDrawer, // Draws the first bane from your deck.
	Virus, // adds a copy to your deck when you play it.  When drawn, it shuffles your first card back in your deck.
	Bane, // Card driving the game's progress. This is the "Bad" type.  Bad boy always goes last.

	// Cards after this are perks.
	DrawNoPenalty,
}

enum purchaseEnhancement {
	IncreaseStartingSquare,
	IncreaseHandSize,
	GainPoint,
	GainTwoPoints,
	GainThreePoints,
	IncreaseBaneThreshold,
	VirusSpreader,
	RefreshPerk,
	NextRoundGemsUp,
	UpgradeFirstCard,
	BuyExtraMoves,


	// Below here doesn't cost extra money to buy
	ExtraMoney,


	CanBuyADuplicate, // Keep this one last so that getAvailableEnhancements works /shrug
}

enum noHandPerk {
	DrawNoPenalty,
	GainExtraMoneyDuringBuyPhase,


}

enum endGameBonus {
	GemsMost,
	GemsLeast,
	SpacesMost,
	SpacesLeast,
	CrownsMost,
	CrownsLeast,
	CardsMost,
	CardsLeast,
	BustedMost,
	BustedLeast,
	BuysMost,
	BuysLeast,


	BanesMost,
	BanesLeast // Have these two be last
}

interface IItem {
	effect: itemEffect;
	// Most of the time, amount and points are the same.
	amount: number; // amount is the effect it will have. Such as "draws three cards"
	points: number; // points is the number of spaces you will move. Such as "moves three places"
	cost: number;
	wasEffective?: boolean; // Only used for round results.
}

interface IItemGroup {
	effect: itemEffect;
	itemMap: { [points: number]: number };
}

// From client to server
interface ISelection {
	playedItems: IItem[];
	trashedCard: IItem[];
	gemGains: number; // Number of gems gained by playing cards.
	moneyGains: number; // Extra money earned this round.
	immediatePointGains: number; // Points gained from playing cards.  You get these points even if you bust.
	pointGains: number; // Amount of potential points gained.
	currentLocation: number; // This is the current position the player is in.  Starts at 0
	baneCount: number;
	additionalBuys: number;
	hasPerkAvailable: boolean;
}

// From client to server
interface IBuySelection {
	// If busted, user must choose one of the two.
	gainingPoints: boolean;
	buyingItems: boolean;

	gemsSpent: number;
	items: IItem[];
	enhancements: purchaseEnhancement[];
}

// From server to client for all players.
interface ISelectionResults {
	bonus: string;
	winnerIndexes: number[];
	playerSelectionData: { [index: number]: IPlayerSelectionData };
}
interface IPlayerSelectionData {
	playedItems: IItem[];
	trashedItems: IItem[];
	movement: number;
	moneyGains: number;
	immediatePoints: number;
	pointGains: number;
	gemsEarned: number;
	cardDiscount: number;
	totalAvailableBuys: number;
	didBust: boolean;
}
interface IBuyResults {
	additionalStartingPoints: { [index: number]: number };
	playerBuySelectionData: { [index: number]: IBuySelection };
}