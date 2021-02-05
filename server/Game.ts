import socketIo = require('socket.io');
import { debug } from "console";
import { getItem, getEnhancementCost, getAllItemsOfEffect } from './CardItems';
import gameModes = require('./gameModes');

const AIndex: number = (<any>'A').charCodeAt();
export const BANE_START = 7;
const HAND_START = 2;

function getCharacterFromIndex(index: number): string {
	if (index >= 26)
		return (index - 26).toString();
	else
		return String.fromCharCode(AIndex + index);
}

function getRandomId(): string {
	const numberOfDigits = 4;
	let randomId = "";
	let randomKey = Math.floor(Math.random() * (Math.pow(36, numberOfDigits)));
	for (let i = 0; i < numberOfDigits; i++) {
		const curKey = randomKey % 36;
		randomKey = Math.floor(randomKey / 36);
		randomId += getCharacterFromIndex(curKey);
	}
	return randomId;
}
class Round {
	public playerSelections: { [index: number]: ISelection };
	public playerBuySelections: { [index: number]: IBuySelection };
	public roundData: IRoundData;
	constructor() {
		this.roundData = {
			selectionResults: undefined,
			buySelectionData: undefined,
			thingsToBuy: undefined
		};
		this.playerSelections = {};
		this.playerBuySelections = {};
	}
	public addSelection(player: Player, selection: ISelection) {
		this.playerSelections[player.playerData.index] = selection;
	}
	public addBuySelection(player: Player, buySelection: IBuySelection) {
		this.playerBuySelections[player.playerData.index] = buySelection;
	}
	public getRoundData(): IRoundData {
		return this.roundData;
	}
	public allPlayersSelected(playerCount: number): boolean {
		return playerCount == Object.keys(this.playerSelections).length;
	}
	public allPlayersBoughtAndScored(playerCount: number): boolean {
		return playerCount == Object.keys(this.playerBuySelections).length;
	}
}
export class Player {
	public playerData: IPlayerClientData;
	public socket: socketIo.Socket;
	constructor(username: string, socket: socketIo.Socket, index: number) {
		this.socket = socket;
		const defaultGemCount = 5;
		this.playerData = {
			index: index,
			username: username,
			totalScore: 0,
			availableBuys: 0,
			items: [],
			gemTotal: defaultGemCount,
			startingPosition: 0,
			baneThreshold: BANE_START, // Starting bane position
			handSize: HAND_START, // Starting hand size
			hasPerkAvailable: false,

			// Following used for end of game stats.
			totalBustedCount: 0,
			totalEnhancements: [],
			totalGameGemCount: defaultGemCount,
			totalMovedSquares: 0,
			totalCardsPlayed: 0,
			totalCardsBought: 0,
		};
	}
}

class Game {
	public gameId: string;
	private playerIndex: number; // To make incoming players unique.
	public hostIndex: number; // index of the player who is host.
	private players: Player[];
	private removedPlayers: Player[];
	public completedRounds: IRoundData[];
	public round: Round;
	public options: IGameOptions;
	public constructor() {
		this.round = undefined;
		this.players = [];
		this.removedPlayers = [];
		this.completedRounds = [];
		this.playerIndex = 0;
		this.hostIndex = -1;
		this.options = gameModes.getDefaultGameOptions();
	}
	public hasGameNotStarted(): boolean {
		return typeof this.round === "undefined"
			&& this.completedRounds.length == 0;
	}

	public getPlayerCount(): number { return this.players.length + this.removedPlayers.length; }

	public addPlayer(username: string, socket: socketIo.Socket): Player {
		const player = new Player(username, socket, this.playerIndex++);
		if (this.hostIndex == -1)
			this.hostIndex = player.playerData.index;
		this.players.push(player);
		return player;
	}
	public removePlayer(socket: socketIo.Socket): Player {
		const index = this.players.findIndex(p => p.socket === socket);
		const removedPlayer = this.players.splice(index, 1)[0];
		if (removedPlayer) {
			if (!this.hasGameNotStarted())
				this.removedPlayers.push(removedPlayer); // Add to removed players in case they rejoin.
			console.log(this.removedPlayers.map(p => p.playerData.username));
		}
		return removedPlayer;
	}

	public hasDisconnectedPlayers() {
		return this.removedPlayers.length > 0;
	}

	public reconnected(username: string, socket: socketIo.Socket): Player {
		const playerIndex = this.removedPlayers.findIndex(p => p.playerData.username === username);
		if (playerIndex !== -1) {
			const player = this.removedPlayers.splice(playerIndex, 1)[0]; // Removes and returns the player.
			player.socket = socket;
			this.players.push(player);
			this.players.sort((a, b) => a.playerData.index - b.playerData.index);
			return player;
		}
		return undefined;
	}

	public getConnectedPlayer(): Player {
		return this.players[0];
	}

	public getPlayers() {
		return this.players.map(p => p.playerData);
	}

	public getPlayer(socket: socketIo.Socket): Player {
		return this.players.find(p => p.socket === socket);
	}

	public startGame() {
		// Must apply options to players.
		this.players.forEach(player => {
			player.playerData.baneThreshold = this.options.startingBaneThreshold;
			player.playerData.handSize = this.options.startingPlayerHandSize;
			player.playerData.items = this.getStartingHand();
			player.playerData.availableBuys = this.options.startingBuys;
			player.playerData.gemTotal = this.options.startingGems;
			player.playerData.totalGameGemCount = this.options.startingGems;
			player.playerData.hasPerkAvailable = this.options.perks.length > 0;
		});
	}

	public startRound() {
		this.round = new Round();
		this.setRoundBuyItems(this.round.roundData);
	}

	public hasPlayers() {
		return this.players.length > 0;
	}

	private getStartingHand(): IItem[] {
		return this.options.startingHand.map(baseItem => getItem(baseItem.effect, baseItem.points));
	}

	public playerCompletedSelecting(player: Player, selection: ISelection): void {
		this.round.addSelection(player, selection);
	}
	public allPlayersSelected(): boolean {
		return this.round.allPlayersSelected(this.getPlayerCount());
	}

	// Complete the round and see who gets what and how and such.
	public calculateSelectionResults() {
		let selectionResults: ISelectionResults = <ISelectionResults>{ playerSelectionData: {} };
		const playerSelections: { [index: number]: ISelection } = this.round.playerSelections;

		let winningPlayerScore = -1;
		selectionResults.winnerIndexes = [];
		let playedMostCounter: { player: Player, count: number }[] = [];

		this.players.forEach((player: Player) => {
			const playerSelection = playerSelections[player.playerData.index];
			let playerPlayedMostCount: { player: Player, count: number } = { player: player, count: 0 };
			let playerSelectionData = <IPlayerSelectionData>{};
			playerSelectionData.trashedItems = [];
			playerSelectionData.gemsEarned = playerSelection.gemGains;
			playerSelectionData.totalAvailableBuys = player.playerData.availableBuys + playerSelection.additionalBuys;

			player.playerData.hasPerkAvailable = playerSelection.hasPerkAvailable;

			playerSelectionData.movement = playerSelection.currentLocation;
			playerSelectionData.moneyGains = playerSelection.currentLocation + playerSelection.moneyGains;
			let previousHeadStart: number = 0;
			if (this.completedRounds.length > 0)
				previousHeadStart = this.completedRounds[this.completedRounds.length - 1].buySelectionData.additionalStartingPoints[player.playerData.index];
			player.playerData.totalMovedSquares += playerSelection.currentLocation - previousHeadStart - player.playerData.startingPosition;
			player.playerData.totalCardsPlayed += playerSelection.playedItems.length;

			playerSelectionData.immediatePoints = playerSelection.immediatePointGains;
			playerSelectionData.pointGains = playerSelection.pointGains;
			playerSelectionData.playedItems = playerSelection.playedItems;

			player.playerData.totalScore += playerSelection.immediatePointGains;

			const lastCard = playerSelectionData.playedItems[playerSelectionData.playedItems.length - 1];
			if (lastCard && lastCard.effect == itemEffect.LastCardGem) {
				playerSelectionData.gemsEarned += 4;
				playerSelection.gemGains += 4;
			}

			// Go through all the cards that do something when you play them.
			let discount = 0;
			let keysPlayed = 0;
			playerSelectionData.playedItems.forEach(item => {
				if (item.effect == itemEffect.SpecialNoEffect) {
					keysPlayed++;
				}
				else if (item.effect == itemEffect.CardsCostLess) {
					if (item.amount > discount)
						discount = item.amount;
				} else if (item.effect == itemEffect.Tax) {
					// Gotta do this here as we need to know how far we've moved.
					playerSelectionData.moneyGains -= Math.max(1, Math.floor(playerSelectionData.moneyGains * .1));
				} else if (item.effect == itemEffect.PlayedMostReward) {
					playerPlayedMostCount.count++;
				} else if (item.effect == itemEffect.GrowingMover) {
					let growItem = player.playerData.items.find(i => i.effect == item.effect && i.points == item.points && i.amount == item.amount);
					growItem.points = Math.min(4, growItem.points + 1);
				} else if (item.effect == itemEffect.GrowingPoints) {
					let growItem = player.playerData.items.find(i => i.effect == item.effect && i.points == item.points && i.amount == item.amount);
					growItem.amount += 1;
				}
			});

			playedMostCounter.push(playerPlayedMostCount);

			playerSelectionData.cardDiscount = discount;

			player.playerData.gemTotal += playerSelection.gemGains; // For now, always award the money.
			player.playerData.totalGameGemCount += playerSelection.gemGains;

			if (playerSelection.baneCount <= player.playerData.baneThreshold) {
				// didn't bust, well done. Say you didn't bust and you're in the running to get a bonus.
				playerSelectionData.didBust = false;
				if (playerSelection.currentLocation === winningPlayerScore)
					selectionResults.winnerIndexes.push(player.playerData.index);
				else if (playerSelection.currentLocation >= winningPlayerScore) {
					selectionResults.winnerIndexes = [player.playerData.index];
					winningPlayerScore = playerSelection.currentLocation;
				}
			} else {
				player.playerData.totalBustedCount++;
				playerSelectionData.didBust = true;
			}

			playerSelection.trashedCard.forEach(trashCard => {
				const trashIndex = player.playerData.items.findIndex(curItem => curItem.points == trashCard.points && curItem.amount == trashCard.amount && curItem.effect == trashCard.effect);
				if (trashIndex >= 0) {
					playerSelectionData.trashedItems.push(...player.playerData.items.splice(trashIndex, 1));
				}
			});

			selectionResults.playerSelectionData[player.playerData.index] = playerSelectionData;
		});
		if (selectionResults.winnerIndexes.length > 0 && this.options.giveRoundBonuses) {
			let randomBonus: number;
			const roundNumber = 1 + this.completedRounds.length;
			// Always award a point to the furthest player on the last round
			if (roundNumber == this.options.totalRounds)
				randomBonus = 0;
			else
				randomBonus = Math.random();

			const maxBonuses = 3;
			if (randomBonus < (1 / maxBonuses)) {
				const winners = selectionResults.winnerIndexes.map(ndx => this.players.find(p => p.playerData.index == ndx));
				winners.forEach(p => p.playerData.totalScore += 1);
				selectionResults.bonus = "Extra Point";
			} else if (randomBonus < (2 / maxBonuses)) {
				const winners = selectionResults.winnerIndexes.map(ndx => this.players.find(p => p.playerData.index == ndx));
				winners.forEach(p => p.playerData.gemTotal += 2);
				selectionResults.bonus = "2 Gems";
			} else if (randomBonus < (3 / maxBonuses)) {
				const winnerSelections = selectionResults.winnerIndexes.map(ndx => selectionResults.playerSelectionData[ndx]);
				winnerSelections.forEach(p => p.moneyGains += 1);
				selectionResults.bonus = "Extra Money";
			}
		}

		playedMostCounter.sort((a, b) => a.count - b.count);
		let leastPlayed = 0;
		let mostPlayed = playedMostCounter[playedMostCounter.length - 1].count;
		if (mostPlayed > 0) {
			playedMostCounter.forEach((pkv, index) => {
				if (index == 0) {
					leastPlayed = pkv.count;
				} else {
					if (pkv.count > leastPlayed) {
						selectionResults.playerSelectionData[pkv.player.playerData.index].moneyGains++;
						if (pkv.count == mostPlayed) {
							pkv.player.playerData.startingPosition++;
							pkv.player.playerData.totalScore++;
						}
						else if (pkv.count > playedMostCounter[Math.ceil(playedMostCounter.length / 2) - 1].count) {
							// Odd scenario.  3 people, 2 played one more than third.  Neither winner played more than half (equal, not half).
							pkv.player.playerData.startingPosition++;
						}
					}
				}
			});
		}
		this.round.roundData.selectionResults = selectionResults;
	}

	public setRoundBuyItems(roundData: IRoundData) {
		const roundNumber = 1 + this.completedRounds.length;
		let thingsToBuy: IThingsToBuy = { items: {}, enhancments: [] }

		thingsToBuy.items = new Array(roundNumber).fill(undefined).reduce(
			(effs: { [effect: number /*itemEffect*/]: IItem[] }, _, ndx) => {
				this.options.effectsAvailable[ndx].forEach(e => {
					const allItems = getAllItemsOfEffect(e);
					if (allItems.length > 0) {
						if (allItems[0].effect == itemEffect.MoveAndPoint)
							allItems.splice(0, 1); // Remove the first
						effs[e] = allItems;
					}
				});
				return effs;
			}, {});

		thingsToBuy.enhancments = new Array(roundNumber).fill(undefined).reduce(
			(enhs: { enhancement: purchaseEnhancement, cost: number }[], _, ndx) => {
				this.options.enhancementsAvailable[ndx].forEach(e => {
					if (enhs.findIndex(ec => ec.enhancement == e) == -1)
						enhs.push({ enhancement: e, cost: getEnhancementCost(e, this.options) });
				});
				return enhs;
			}, []);

		roundData.thingsToBuy = thingsToBuy;
	}

	public playerCompletedBuyingAndScoring(player: Player, selection: IBuySelection): void {
		this.round.addBuySelection(player, selection);
	}
	public allPlayersBoughtAndScored(): boolean {
		return this.round.allPlayersBoughtAndScored(this.getPlayerCount());
	}
	public calculateRoundResults(): IRoundData {
		const roundData = this.round.roundData;
		roundData.buySelectionData = {
			playerBuySelectionData: {},
			additionalStartingPoints: {}
		};

		let winningScore = 0;

		const roundNumber = this.completedRounds.length;

		// update players' money, items, and score, then update the round's roundData.
		const playerBuySelections: { [index: number]: IBuySelection } = this.round.playerBuySelections;

		// People who bought "superspreader"
		let virusInfectingPlayers = []; // duplicates allowed!
		let poisonInfectingPlayers = []; // duplicates allowed!
		let baneBribingPlayers = []; // duplicates allowed!
		let taxCollectingPlayers = []; // duplicates allowed!
		let bane1InfectingPlayers = []; // duplicates not allowed!

		this.players.forEach((player: Player) => {
			const buySelection = playerBuySelections[player.playerData.index];
			if (buySelection.gainingPoints) {
				this.populatePointsForCurrentRound(player, this.round.roundData);
			}

			// Remove poisons and taxes.
			this.removeRoundEndCards(player);

			// Could have evolving cards, moved previous evolving cards to after selection if they were played.
			// Evolve cards before adding bought items.
			//player.playerData.items.forEach(item => {
			//});

			let totalBoughtCards = 0;
			if (buySelection.buyingItems) {
				totalBoughtCards = buySelection.items.length;
				player.playerData.totalCardsBought = totalBoughtCards;

				// Do enhancements.
				buySelection.enhancements.forEach(enhancement => {
					if (enhancement == purchaseEnhancement.IncreaseHandSize)
						player.playerData.handSize++;
					else if (enhancement == purchaseEnhancement.IncreaseStartingSquare)
						player.playerData.startingPosition++;
					else if (enhancement == purchaseEnhancement.GainPoint)
						player.playerData.totalScore += 1;
					else if (enhancement == purchaseEnhancement.GainTwoPoints)
						player.playerData.totalScore += 2;
					else if (enhancement == purchaseEnhancement.GainThreePoints)
						player.playerData.totalScore += 3;
					else if (enhancement == purchaseEnhancement.VirusSpreader)
						virusInfectingPlayers.push(player.playerData.index);
					else if (enhancement == purchaseEnhancement.RefreshPerk)
						player.playerData.hasPerkAvailable = true;
					else if (enhancement == purchaseEnhancement.UpgradeFirstCard) {
						const firstCardPlayed = this.round.playerSelections[player.playerData.index].playedItems[0];
						if (firstCardPlayed) {
							const firstCard = player.playerData.items.find(c => c.effect == firstCardPlayed.effect && c.points == firstCardPlayed.points && c.amount == firstCardPlayed.amount);
							if (firstCard)
								firstCard.points += 1;
						}
					} else if (enhancement == purchaseEnhancement.BuyExtraMoves) {
						buySelection.items.forEach(card => card.points += 1);
					}

					player.playerData.totalEnhancements.push(enhancement);
				});
				player.playerData.gemTotal -= buySelection.gemsSpent;

				// Add bought cards to player deck
				player.playerData.items.push(...buySelection.items);
			}

			this.options.forceBuys[roundNumber].forEach(it => {
				const newCard = getItem(it.effect, it.points);
				player.playerData.items.unshift(newCard);
				buySelection.items.unshift(newCard);
			});

			let extraPointsPerBuy = 0;
			let addBaneInfection = false;
			roundData.selectionResults.playerSelectionData[player.playerData.index].playedItems.forEach(playedItem => {
				if (playedItem.effect == itemEffect.BaneGiver)
					addBaneInfection = true;
				else if (playedItem.effect == itemEffect.PoisonBrewer)
					poisonInfectingPlayers.push(player.playerData.index);
				else if (playedItem.effect == itemEffect.BaneBriber)
					baneBribingPlayers.push(player.playerData.index);
				else if (playedItem.effect == itemEffect.TaxCollector)
					taxCollectingPlayers.push(player.playerData.index);
				else if (playedItem.effect == itemEffect.GainPointPerBuy)
					extraPointsPerBuy++;
			});

			if (addBaneInfection)
				bane1InfectingPlayers.push(player.playerData.index);

			// Award extra points for buys.
			if (extraPointsPerBuy > 0)
				player.playerData.totalScore += (extraPointsPerBuy * totalBoughtCards);

			// Check who is winning to give a handicap to.
			if (winningScore < player.playerData.totalScore)
				winningScore = player.playerData.totalScore;

			roundData.buySelectionData.playerBuySelectionData[player.playerData.index] = buySelection;
		});

		// After adding up various things, go through players again and apply the sums.
		this.players.forEach((player: Player) => {
			let extraMovement = Math.floor((winningScore - player.playerData.totalScore) / 2.5);
			roundData.buySelectionData.additionalStartingPoints[player.playerData.index] = extraMovement;

			if (virusInfectingPlayers.length > 0) {
				const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
				const newViruses = new Array(virusInfectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(getItem(itemEffect.Virus));
				if (newViruses.length > 0) {
					player.playerData.items.push(...newViruses);
					buySelection.items.push(...newViruses);
				}
			}
			if (poisonInfectingPlayers.length > 0) {
				const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
				const newPoisons = new Array(poisonInfectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(getItem(itemEffect.Poison));
				if (newPoisons.length > 0) {
					player.playerData.items.push(...newPoisons);
					buySelection.items.push(...newPoisons);
				}
			}
			if (baneBribingPlayers.length > 0) {
				const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
				const newDrawer = new Array(baneBribingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(getItem(itemEffect.BaneDrawer));
				if (newDrawer.length > 0) {
					player.playerData.items.push(...newDrawer);
					buySelection.items.push(...newDrawer);
				}
			}
			if (taxCollectingPlayers.length > 0) {
				const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
				const newTaxes = new Array(taxCollectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(getItem(itemEffect.Tax));
				if (newTaxes.length > 0) {
					player.playerData.items.push(...newTaxes);
					buySelection.items.push(...newTaxes);
				}
			}
			if (bane1InfectingPlayers.length > 0) {
				const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
				// If this player did not play a bane giver, then they get one.
				if (bane1InfectingPlayers.every(pIndex => player.playerData.index != pIndex)) {
					const newBane = getItem(itemEffect.Bane, 1);
					player.playerData.items.push(newBane);
					buySelection.items.push(newBane);
				}
			}
		});

		// Start a new round.
		this.completedRounds.push(roundData);
		this.startRound();
		return roundData;
	}

	private removeRoundEndCards(player: Player) {
		player.playerData.items = player.playerData.items.filter(i => i.effect != itemEffect.Poison && i.effect != itemEffect.Tax && i.effect != itemEffect.BaneDrawer);
	}


	public calculateGameResults(): IEndGameInfo {
		let endGameInfo: IEndGameInfo = <IEndGameInfo>{ players: [] };
		// Calculate end game bonuses here.
		if (this.options.enableEndGameBonus) {
			endGameInfo.endGameBonuses = this.options.endGameBonuses.reduce((dict, bonus) => {
				dict[bonus] = { winners: [], winningAmount: 0 };// Will have to assume zero winners means we are looking at the first player or something.
				return dict;
			}, <{ [endGameBonus: number]: { winningAmount: number, winners: number[] } }>{});
		} else {
			endGameInfo.endGameBonuses = {};
		}

		this.players.forEach((player: Player) => {
			let endGamePlayerInfo: IEndGamePlayerInfo = { endGamePointsForMoney: 0, endGamePointsForCards: 0, endGamePointsForGems: 0, playerData: player.playerData };
			this.populatePointsForCurrentRound(player, this.round.roundData);
			let selectionData = this.round.roundData.selectionResults.playerSelectionData[player.playerData.index];

			// No need to show which attacks were given to you on the second to last round.
			this.removeRoundEndCards(player);

			// If there is a card that does something at the end of the game, do it here.
			player.playerData.items.forEach(item => {
				if (item.effect == itemEffect.GrowingPoints) {
					endGamePlayerInfo.endGamePointsForCards += Math.min(4, item.amount);
				}
				if (item.effect == itemEffect.MoveAndPoint) {
					endGamePlayerInfo.endGamePointsForCards += item.amount; // Always one, but I'll allow it.
				}
			});
			player.playerData.totalScore += endGamePlayerInfo.endGamePointsForCards;
			Object.keys(endGameInfo.endGameBonuses).forEach((bonusStr: string) => {
				const bonus = Number(bonusStr);
				this.checkEndGameBonus(player.playerData, <endGameBonus>bonus, endGameInfo.endGameBonuses[bonus]);
			});

			if (!selectionData.didBust)
				endGamePlayerInfo.endGamePointsForMoney = Math.floor(selectionData.moneyGains / this.options.endGameMoneyForPoints);
			endGamePlayerInfo.endGamePointsForGems = Math.floor(player.playerData.gemTotal / this.options.endGameGemsForPoints);
			player.playerData.totalScore += endGamePlayerInfo.endGamePointsForMoney + endGamePlayerInfo.endGamePointsForGems;
			endGameInfo.players.push(endGamePlayerInfo);
		});

		Object.keys(endGameInfo.endGameBonuses).forEach((bonusStr: string) => {
			const bonus = Number(bonusStr);
			if (bonus == endGameBonus.CrownsLeast || bonus == endGameBonus.CrownsMost) {
				let bonusScore: { winningAmount: number, winners: number[] } = endGameInfo.endGameBonuses[bonus];
				bonusScore.winners = []; // Reset Crown Winners.
				const isLowest = bonus == endGameBonus.CrownsLeast;
				let crownWinners = this.completedRounds.concat(this.round.roundData).reduce((ps, round) => {
					round.selectionResults.winnerIndexes.forEach(ndx => ps[ndx] = Number((ps[ndx] || 0)) + 1);
					return ps;
				}, <{ [pNdx: number]: number }>{});
				Object.keys(crownWinners).forEach(pNdxStr => {
					const pNdx = Number(pNdxStr);
					const wins = crownWinners[pNdx];
					if (bonusScore.winners.length == 0) {
						bonusScore.winners = [pNdx];
						bonusScore.winningAmount = wins;
					} else if (wins == bonusScore.winningAmount) {
						bonusScore.winners.push(pNdx);
					} else if (isLowest) {
						if (wins < bonusScore.winningAmount) {
							bonusScore.winners = [pNdx];
							bonusScore.winningAmount = wins;
						}
					}
					else { // is highest
						if (wins > bonusScore.winningAmount) {
							bonusScore.winners = [pNdx];
							bonusScore.winningAmount = wins;
						}
					}
				});
			}
			endGameInfo.endGameBonuses[bonus].winners.forEach(playerIndex => {
				this.players.find(p => p.playerData.index == playerIndex).playerData.totalScore += this.options.pointsPerEndGameBonus;
			});
		});

		// Sort the players from highest score to lowest score.
		endGameInfo.players.sort((a, b) => b.playerData.totalScore - a.playerData.totalScore);
		return endGameInfo;
	}
	private checkEndGameBonus(playerData: IPlayerClientData, bonus: endGameBonus, counter: { winningAmount: number, winners: number[] }) {
		let compareNumber: number;
		if (bonus == endGameBonus.GemsMost) {
			compareNumber = playerData.totalGameGemCount;
		} else if (bonus == endGameBonus.GemsLeast) {
			compareNumber = -playerData.totalGameGemCount;
		} else if (bonus == endGameBonus.SpacesMost) {
			compareNumber = playerData.totalMovedSquares;
		} else if (bonus == endGameBonus.SpacesLeast) {
			compareNumber = -playerData.totalMovedSquares;
			// Will have to do this separately.
			//} else if (bonus == endGameBonus.CrownsMost) {
			//	compareNumber = player.playerData.totalGameGemCount;
			//} else if (bonus == endGameBonus.CrownsLeast) {
			//	compareNumber = -player.playerData.totalGameGemCount;
		} else if (bonus == endGameBonus.CardsMost) {
			compareNumber = playerData.totalCardsPlayed;
		} else if (bonus == endGameBonus.CardsLeast) {
			compareNumber = -playerData.totalCardsPlayed;
		} else if (bonus == endGameBonus.BustedMost) {
			compareNumber = playerData.totalBustedCount;
		} else if (bonus == endGameBonus.BustedLeast) {
			compareNumber = -playerData.totalBustedCount;
		} else if (bonus == endGameBonus.BuysMost) {
			compareNumber = playerData.totalCardsBought;
		} else if (bonus == endGameBonus.BuysLeast) {
			compareNumber = -playerData.totalCardsBought;
		} else if (bonus == endGameBonus.BanesMost || bonus == endGameBonus.BanesLeast) {
			compareNumber = this.completedRounds.concat(this.round.roundData).reduce((count, r) => {
				count += r.selectionResults.playerSelectionData[playerData.index].playedItems.reduce((baneCount, item) => {
					if (item.effect == itemEffect.Bane)
						baneCount += item.amount;
					return baneCount;
				}, 0);
				return count;
			}, 0);
			if (bonus == endGameBonus.BanesLeast)
				compareNumber = -compareNumber;
		}
		if (counter.winners.length == 0 || compareNumber > counter.winningAmount) {
			counter.winningAmount = compareNumber;
			counter.winners = [playerData.index];
		} else if (compareNumber == counter.winningAmount) {
			counter.winners.push(playerData.index);
		}
	}

	private populatePointsForCurrentRound(player: Player, roundData: IRoundData) {
		player.playerData.totalScore += roundData.selectionResults.playerSelectionData[player.playerData.index].pointGains;
	}
	public setOptionMode(modeIndex: number) {
		if (modeIndex == 0)
			this.options = gameModes.getDefaultGameOptions();
		else if (modeIndex == 1)
			this.options = gameModes.getLearnToPlayGameOptions();
		else if (modeIndex == 2)
			this.options = gameModes.getFightAgainstBaneOptions();
		else if (modeIndex == 3)
			this.options = gameModes.getAttackGameOptions();
		else if (modeIndex == 4)
			this.options = gameModes.getDefault2GameOptions();
		this.options.gameMode = modeIndex;
	}
}


// This is copied from client/main.ts...
export enum itemEffect {
	JustMove,
	SpecialNoEffect,
	GemsForKeys,
	MovesForSpecial,
	SpecialAdjacentMover,
	BonusForKeys,
	AddToHand,
	FarMoving,
	GemLandingExtra,
	ShuffleHand,
	GrowingMover,
	GrowingPoints,
	CopyMover,
	RemovePreviousBane,
	CopyOfPreviousCard,
	CardsCostLess,
	LastCardGem,
	TrashItem,
	DiscardItem,
	PointInvestment,
	GainExtraBuy,
	MoveTo5,
	GainPoints5X,
	BaneCountRemoval,
	GainExtraMoney,
	Bane1Moves2,
	MovesForGems,
	EmptyHandGems,
	EmptyHandMoves,
	JustDrewEmptyMover,
	JustDrewEmptyBonus,
	IncreaseHandSize,
	GainPointPerBuy,
	FutureGemsUp,
	FuturePassingGemsUp,
	PlayedMostReward,
	DrawLowestNonBane,
	MoveAndPoint,
	MoveNextGem,
	GemsForMoney,
	PointsForPassingGems,
	MoneyForPassingGems,
	PlayCardMovement,


	TaxCollector,
	PoisonBrewer,
	BaneBriber,
	BaneGiver,
	Tax,
	Poison,
	BaneDrawer,
	Virus,
	Bane,

	DrawNoPenalty,
}
export enum purchaseEnhancement {
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


	CanBuyADuplicate,
}

export enum noHandPerk {
	DrawNoPenalty,
	GainExtraMoneyDuringBuyPhase,


}

export enum endGameBonus {
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
	BanesLeast
}

const allGames: { [id: string]: Game } = {};

export function startNewGame(id: string = undefined): Game {
	while (typeof id === "undefined" || typeof getGame(id) !== "undefined")
		id = getRandomId();

	const game: Game = new Game();
	game.gameId = id;
	allGames[id] = game;
	return game;
}

export function getGame(id: string): Game {
	return allGames[id];
}

export function removeGame(gameId: string) {
	console.log("deleting: " + gameId);
	delete allGames[gameId];
}
export function getGameCount() { return Object.keys(allGames).length; }
export function getPlayerCount() { return Object.keys(allGames).reduce((acc, cur) => allGames[cur].getPlayerCount() + acc, 0); }