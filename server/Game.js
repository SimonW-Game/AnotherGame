"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeGame = exports.getGame = exports.startNewGame = exports.endGameBonus = exports.noHandPerk = exports.purchaseEnhancement = exports.itemEffect = exports.Player = exports.BANE_START = void 0;
const CardItems_1 = require("./CardItems");
const gameModes = require("./gameModes");
const AIndex = 'A'.charCodeAt();
exports.BANE_START = 7;
const HAND_START = 2;
function getCharacterFromIndex(index) {
    if (index >= 26)
        return (index - 26).toString();
    else
        return String.fromCharCode(AIndex + index);
}
function getRandomId() {
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
    constructor() {
        this.roundData = {
            selectionResults: undefined,
            buySelectionData: undefined,
            thingsToBuy: undefined
        };
        this.playerSelections = {};
        this.playerBuySelections = {};
    }
    addSelection(player, selection) {
        this.playerSelections[player.playerData.index] = selection;
    }
    addBuySelection(player, buySelection) {
        this.playerBuySelections[player.playerData.index] = buySelection;
    }
    getRoundData() {
        return this.roundData;
    }
    allPlayersSelected(playerCount) {
        return playerCount == Object.keys(this.playerSelections).length;
    }
    allPlayersBoughtAndScored(playerCount) {
        return playerCount == Object.keys(this.playerBuySelections).length;
    }
}
class Player {
    constructor(username, socket, index) {
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
            baneThreshold: exports.BANE_START,
            handSize: HAND_START,
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
exports.Player = Player;
class Game {
    constructor() {
        this.round = undefined;
        this.players = [];
        this.removedPlayers = [];
        this.completedRounds = [];
        this.playerIndex = 0;
        this.hostIndex = -1;
        this.options = gameModes.getDefaultGameOptions();
    }
    hasGameNotStarted() {
        return typeof this.round === "undefined"
            && this.completedRounds.length == 0;
    }
    getPlayerCount() { return this.players.length + this.removedPlayers.length; }
    addPlayer(username, socket) {
        const player = new Player(username, socket, this.playerIndex++);
        if (this.hostIndex == -1)
            this.hostIndex = player.playerData.index;
        this.players.push(player);
        return player;
    }
    removePlayer(socket) {
        const index = this.players.findIndex(p => p.socket === socket);
        const removedPlayer = this.players.splice(index, 1)[0];
        if (removedPlayer) {
            if (!this.hasGameNotStarted())
                this.removedPlayers.push(removedPlayer); // Add to removed players in case they rejoin.
            console.log(this.removedPlayers.map(p => p.playerData.username));
        }
        return removedPlayer;
    }
    hasDisconnectedPlayers() {
        return this.removedPlayers.length > 0;
    }
    reconnected(username, socket) {
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
    getConnectedPlayer() {
        return this.players[0];
    }
    getPlayers() {
        return this.players.map(p => p.playerData);
    }
    getPlayer(socket) {
        return this.players.find(p => p.socket === socket);
    }
    startGame() {
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
    startRound() {
        this.round = new Round();
        this.setRoundBuyItems(this.round.roundData);
    }
    hasPlayers() {
        return this.players.length > 0;
    }
    getStartingHand() {
        return this.options.startingHand.map(baseItem => CardItems_1.getItem(baseItem.effect, baseItem.points));
    }
    playerCompletedSelecting(player, selection) {
        this.round.addSelection(player, selection);
    }
    allPlayersSelected() {
        return this.round.allPlayersSelected(this.getPlayerCount());
    }
    // Complete the round and see who gets what and how and such.
    calculateSelectionResults() {
        let selectionResults = { playerSelectionData: {} };
        const playerSelections = this.round.playerSelections;
        let winningPlayerScore = -1;
        selectionResults.winnerIndexes = [];
        let playedMostCounter = [];
        this.players.forEach((player) => {
            const playerSelection = playerSelections[player.playerData.index];
            let playerPlayedMostCount = { player: player, count: 0 };
            let playerSelectionData = {};
            playerSelectionData.trashedItems = [];
            playerSelectionData.gemsEarned = playerSelection.gemGains;
            playerSelectionData.totalAvailableBuys = player.playerData.availableBuys + playerSelection.additionalBuys;
            player.playerData.hasPerkAvailable = playerSelection.hasPerkAvailable;
            playerSelectionData.movement = playerSelection.currentLocation;
            playerSelectionData.moneyGains = playerSelection.currentLocation + playerSelection.moneyGains;
            let previousHeadStart = 0;
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
                }
                else if (item.effect == itemEffect.Tax) {
                    // Gotta do this here as we need to know how far we've moved.
                    playerSelectionData.moneyGains -= Math.max(1, Math.floor(playerSelectionData.moneyGains * .1));
                }
                else if (item.effect == itemEffect.BonusForKeys) {
                    if (keysPlayed > 0)
                        playerSelectionData.moneyGains += 1;
                    if (keysPlayed > 1)
                        player.playerData.totalScore += 1;
                }
                else if (item.effect == itemEffect.PlayedMostReward) {
                    playerPlayedMostCount.count++;
                }
                else if (item.effect == itemEffect.GrowingMover) {
                    let growItem = player.playerData.items.find(i => i.effect == item.effect && i.points == item.points && i.amount == item.amount);
                    growItem.points = Math.min(4, growItem.points + 1);
                }
                else if (item.effect == itemEffect.GrowingPoints) {
                    let growItem = player.playerData.items.find(i => i.effect == item.effect && i.points == item.points && i.amount == item.amount);
                    growItem.amount += 1;
                }
                else if (item.effect == itemEffect.PointsForNoGems) {
                    // Could perhaps change if there was a way to gain gems from cards after the round ended?
                    if (playerSelectionData.gemsEarned < 4)
                        player.playerData.totalScore += 4 - playerSelectionData.gemsEarned;
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
            }
            else {
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
            let randomBonus;
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
            }
            else if (randomBonus < (2 / maxBonuses)) {
                const winners = selectionResults.winnerIndexes.map(ndx => this.players.find(p => p.playerData.index == ndx));
                winners.forEach(p => p.playerData.gemTotal += 2);
                selectionResults.bonus = "2 Gems";
            }
            else if (randomBonus < (3 / maxBonuses)) {
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
                }
                else {
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
    setRoundBuyItems(roundData) {
        const roundNumber = 1 + this.completedRounds.length;
        let thingsToBuy = { items: {}, enhancments: [] };
        thingsToBuy.items = new Array(roundNumber).fill(undefined).reduce((effs, _, ndx) => {
            this.options.effectsAvailable[ndx].forEach(e => {
                const allItems = CardItems_1.getAllItemsOfEffect(e);
                if (allItems.length > 0)
                    effs[e] = allItems;
            });
            return effs;
        }, {});
        thingsToBuy.enhancments = new Array(roundNumber).fill(undefined).reduce((enhs, _, ndx) => {
            this.options.enhancementsAvailable[ndx].forEach(e => {
                if (enhs.findIndex(ec => ec.enhancement == e) == -1)
                    enhs.push({ enhancement: e, cost: CardItems_1.getEnhancementCost(e, this.options) });
            });
            return enhs;
        }, []);
        roundData.thingsToBuy = thingsToBuy;
    }
    playerCompletedBuyingAndScoring(player, selection) {
        this.round.addBuySelection(player, selection);
    }
    allPlayersBoughtAndScored() {
        return this.round.allPlayersBoughtAndScored(this.getPlayerCount());
    }
    calculateRoundResults() {
        const roundData = this.round.roundData;
        roundData.buySelectionData = {
            playerBuySelectionData: {},
            additionalStartingPoints: {}
        };
        let winningScore = 0;
        const roundNumber = this.completedRounds.length;
        // update players' money, items, and score, then update the round's roundData.
        const playerBuySelections = this.round.playerBuySelections;
        // People who bought "superspreader"
        let virusInfectingPlayers = []; // duplicates allowed!
        let poisonInfectingPlayers = []; // duplicates allowed!
        let taxCollectingPlayers = []; // duplicates allowed!
        let bane1InfectingPlayers = []; // duplicates not allowed!
        this.players.forEach((player) => {
            const buySelection = playerBuySelections[player.playerData.index];
            if (buySelection.gainingPoints) {
                this.populatePointsForCurrentRound(player, this.round.roundData);
            }
            // Remove poisons and taxes.
            player.playerData.items = player.playerData.items.filter(i => i.effect != itemEffect.Poison && i.effect != itemEffect.Tax);
            // Could have evolving cards, moved previous evolving cards to after selection if they were played.
            // Evolve cards before adding bought items.
            //player.playerData.items.forEach(item => {
            //});
            let totalBoughtCards = 0;
            if (buySelection.buyingItems) {
                totalBoughtCards = buySelection.items.length;
                player.playerData.totalCardsBought = totalBoughtCards;
                // Add bought cards to player deck
                player.playerData.items.push(...buySelection.items);
                // Do enhancements.
                buySelection.enhancements.forEach(enhancement => {
                    if (enhancement == purchaseEnhancement.IncreaseHandSize)
                        player.playerData.handSize++;
                    else if (enhancement == purchaseEnhancement.IncreaseStartingSquare)
                        player.playerData.startingPosition++;
                    else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold)
                        player.playerData.baneThreshold++;
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
                    player.playerData.totalEnhancements.push(enhancement);
                });
                player.playerData.gemTotal -= buySelection.gemsSpent;
            }
            this.options.forceBuys[roundNumber].forEach(it => {
                const newCard = CardItems_1.getItem(it.effect, it.points);
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
        this.players.forEach((player) => {
            let extraPoints = Math.floor((winningScore - player.playerData.totalScore) / 2.5);
            roundData.buySelectionData.additionalStartingPoints[player.playerData.index] = extraPoints;
            if (virusInfectingPlayers.length > 0) {
                const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
                const newViruses = new Array(virusInfectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(CardItems_1.getItem(itemEffect.Virus));
                if (newViruses.length > 0) {
                    player.playerData.items.push(...newViruses);
                    buySelection.items.push(...newViruses);
                }
            }
            if (poisonInfectingPlayers.length > 0) {
                const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
                const newPoisons = new Array(poisonInfectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(CardItems_1.getItem(itemEffect.Poison));
                if (newPoisons.length > 0) {
                    player.playerData.items.push(...newPoisons);
                    buySelection.items.push(...newPoisons);
                }
            }
            if (taxCollectingPlayers.length > 0) {
                const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
                const newTaxes = new Array(taxCollectingPlayers.reduce((amt, playerIndex) => playerIndex == player.playerData.index ? amt : amt + 1, 0)).fill(CardItems_1.getItem(itemEffect.Tax));
                if (newTaxes.length > 0) {
                    player.playerData.items.push(...newTaxes);
                    buySelection.items.push(...newTaxes);
                }
            }
            if (bane1InfectingPlayers.length > 0) {
                const buySelection = roundData.buySelectionData.playerBuySelectionData[player.playerData.index];
                // If this player did not play a bane giver, then they get one.
                if (bane1InfectingPlayers.every(pIndex => player.playerData.index != pIndex)) {
                    const newBane = CardItems_1.getItem(itemEffect.Bane, 1);
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
    calculateGameResults() {
        let endGameInfo = { players: [] };
        // Calculate end game bonuses here.
        if (this.options.enableEndGameBonus) {
            endGameInfo.endGameBonuses = this.options.endGameBonuses.reduce((dict, bonus) => {
                dict[bonus] = { winners: [], winningAmount: 0 }; // Will have to assume zero winners means we are looking at the first player or something.
                return dict;
            }, {});
        }
        else {
            endGameInfo.endGameBonuses = {};
        }
        this.players.forEach((player) => {
            let endGamePlayerInfo = { endGamePointsForMoney: 0, endGamePointsForCards: 0, endGamePointsForGems: 0, playerData: player.playerData };
            this.populatePointsForCurrentRound(player, this.round.roundData);
            let selectionData = this.round.roundData.selectionResults.playerSelectionData[player.playerData.index];
            // If there is a card that does something at the end of the game, do it here.
            player.playerData.items.forEach(item => {
                if (item.effect == itemEffect.GrowingPoints) {
                    endGamePlayerInfo.endGamePointsForCards += item.amount;
                }
                if (item.effect == itemEffect.MoveAndPoint) {
                    endGamePlayerInfo.endGamePointsForCards += item.amount; // Always one, but I'll allow it.
                }
            });
            player.playerData.totalScore += endGamePlayerInfo.endGamePointsForCards;
            Object.keys(endGameInfo.endGameBonuses).forEach((bonusStr) => {
                const bonus = Number(bonusStr);
                this.checkEndGameBonus(player.playerData, bonus, endGameInfo.endGameBonuses[bonus]);
            });
            if (!selectionData.didBust)
                endGamePlayerInfo.endGamePointsForMoney = Math.floor(selectionData.moneyGains / this.options.endGameMoneyForPoints);
            endGamePlayerInfo.endGamePointsForGems = Math.floor(player.playerData.gemTotal / this.options.endGameGemsForPoints);
            player.playerData.totalScore += endGamePlayerInfo.endGamePointsForMoney + endGamePlayerInfo.endGamePointsForGems;
            endGameInfo.players.push(endGamePlayerInfo);
        });
        Object.keys(endGameInfo.endGameBonuses).forEach((bonusStr) => {
            const bonus = Number(bonusStr);
            if (bonus == endGameBonus.CrownsLeast || bonus == endGameBonus.CrownsMost) {
                let bonusScore = endGameInfo.endGameBonuses[bonus];
                bonusScore.winners = []; // Reset Crown Winners.
                const isLowest = bonus == endGameBonus.CrownsLeast;
                let crownWinners = this.completedRounds.concat(this.round.roundData).reduce((ps, round) => {
                    round.selectionResults.winnerIndexes.forEach(ndx => ps[ndx] = Number((ps[ndx] || 0)) + 1);
                    return ps;
                }, {});
                Object.keys(crownWinners).forEach(pNdxStr => {
                    const pNdx = Number(pNdxStr);
                    const wins = crownWinners[pNdx];
                    if (bonusScore.winners.length == 0) {
                        bonusScore.winners = [pNdx];
                        bonusScore.winningAmount = wins;
                    }
                    else if (wins == bonusScore.winningAmount) {
                        bonusScore.winners.push(pNdx);
                    }
                    else if (isLowest) {
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
    checkEndGameBonus(playerData, bonus, counter) {
        let compareNumber;
        if (bonus == endGameBonus.GemsMost) {
            compareNumber = playerData.totalGameGemCount;
        }
        else if (bonus == endGameBonus.GemsLeast) {
            compareNumber = -playerData.totalGameGemCount;
        }
        else if (bonus == endGameBonus.SpacesMost) {
            compareNumber = playerData.totalMovedSquares;
        }
        else if (bonus == endGameBonus.SpacesLeast) {
            compareNumber = -playerData.totalMovedSquares;
            // Will have to do this separately.
            //} else if (bonus == endGameBonus.CrownsMost) {
            //	compareNumber = player.playerData.totalGameGemCount;
            //} else if (bonus == endGameBonus.CrownsLeast) {
            //	compareNumber = -player.playerData.totalGameGemCount;
        }
        else if (bonus == endGameBonus.CardsMost) {
            compareNumber = playerData.totalCardsPlayed;
        }
        else if (bonus == endGameBonus.CardsLeast) {
            compareNumber = -playerData.totalCardsPlayed;
        }
        else if (bonus == endGameBonus.BustedMost) {
            compareNumber = playerData.totalBustedCount;
        }
        else if (bonus == endGameBonus.BustedLeast) {
            compareNumber = -playerData.totalBustedCount;
        }
        else if (bonus == endGameBonus.BuysMost) {
            compareNumber = playerData.totalCardsBought;
        }
        else if (bonus == endGameBonus.BuysLeast) {
            compareNumber = -playerData.totalCardsBought;
        }
        else if (bonus == endGameBonus.BanesMost || bonus == endGameBonus.BanesLeast) {
            compareNumber = this.completedRounds.concat(this.round.roundData).reduce((count, r) => {
                count += r.selectionResults.playerSelectionData[playerData.index].playedItems.reduce((baneCount, item) => {
                    if (item.effect == itemEffect.Bane)
                        baneCount += item.points;
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
        }
        else if (compareNumber == counter.winningAmount) {
            counter.winners.push(playerData.index);
        }
    }
    populatePointsForCurrentRound(player, roundData) {
        player.playerData.totalScore += roundData.selectionResults.playerSelectionData[player.playerData.index].pointGains;
    }
    setOptionMode(modeIndex) {
        if (modeIndex == 0)
            this.options = gameModes.getDefaultGameOptions();
        else if (modeIndex == 1)
            this.options = gameModes.getLearnToPlayGameOptions();
        else if (modeIndex == 2)
            this.options = gameModes.getFightAgainstBaneOptions();
        else if (modeIndex == 3)
            this.options = gameModes.getAttackGameOptions();
        this.options.gameMode = modeIndex;
    }
}
// This is copied from client/main.ts...
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
    itemEffect[itemEffect["Tax"] = 39] = "Tax";
    itemEffect[itemEffect["Virus"] = 40] = "Virus";
    itemEffect[itemEffect["BaneDrawer"] = 41] = "BaneDrawer";
    itemEffect[itemEffect["BaneBriber"] = 42] = "BaneBriber";
    itemEffect[itemEffect["Poison"] = 43] = "Poison";
    itemEffect[itemEffect["PoisonBrewer"] = 44] = "PoisonBrewer";
    itemEffect[itemEffect["TaxCollector"] = 45] = "TaxCollector";
    itemEffect[itemEffect["BaneGiver"] = 46] = "BaneGiver";
    itemEffect[itemEffect["Bane"] = 47] = "Bane";
    itemEffect[itemEffect["DrawNoPenalty"] = 48] = "DrawNoPenalty";
})(itemEffect = exports.itemEffect || (exports.itemEffect = {}));
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
})(purchaseEnhancement = exports.purchaseEnhancement || (exports.purchaseEnhancement = {}));
var noHandPerk;
(function (noHandPerk) {
    noHandPerk[noHandPerk["DrawNoPenalty"] = 0] = "DrawNoPenalty";
    noHandPerk[noHandPerk["GainExtraMoneyDuringBuyPhase"] = 1] = "GainExtraMoneyDuringBuyPhase";
})(noHandPerk = exports.noHandPerk || (exports.noHandPerk = {}));
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
    endGameBonus[endGameBonus["BanesLeast"] = 13] = "BanesLeast";
})(endGameBonus = exports.endGameBonus || (exports.endGameBonus = {}));
const allGames = {};
function startNewGame(id = undefined) {
    while (typeof id === "undefined" || typeof getGame(id) !== "undefined")
        id = getRandomId();
    const game = new Game();
    game.gameId = id;
    allGames[id] = game;
    return game;
}
exports.startNewGame = startNewGame;
function getGame(id) {
    return allGames[id];
}
exports.getGame = getGame;
function removeGame(gameId) {
    console.log("deleting: " + gameId);
    delete allGames[gameId];
}
exports.removeGame = removeGame;
//# sourceMappingURL=Game.js.map