class RoundWrapper {
	private gameWrapper: IGameWrapper;
	private globalSettings: IGlobalSettings;
	public timerHelper: TimerHelper;
	public currentHand: IItem[];
	public justDrawnCards: IItem[];
	public remainingItems: IItem[];
	public boardItems: IItem[]; // This is all spaces on the board.  Item will be placed on index it ends on.
	public selection: ISelection;
	public buySelection: IBuySelection;
	private $rootscope: ng.IRootScopeService;
	private waitingOnServer: boolean;
	public extraCardsInHand: IItem[];
	private forceShowTurnOptions: boolean;
	private enhancementExtraCost: number;
	public availableMoney: number;
	public availableGems: number;
	public cardDiscount: number;
	public handSize: number;
	public gemGainedOnLanding: number;
	public gemGainedOnPassing: number;
	public totalAvailableBuys: number;
	public canBuyDuplicate: boolean;
	public constructor($rootscope: ng.IRootScopeService, gameWrapper: IGameWrapper, globalSettings: IGlobalSettings, $timeout: ng.ITimeoutService) {
		this.remainingItems = [];
		this.currentHand = [];
		this.justDrawnCards = [];
		this.selection = { playedItems: [], gemGains: 0, moneyGains: 0, pointGains: 0, currentLocation: 0, baneCount: 0, trashedCard: [], additionalBuys: 0, immediatePointGains: 0, hasPerkAvailable: false };
		this.buySelection = { items: [], buyingItems: false, gainingPoints: false, gemsSpent: 0, enhancements: [] };
		this.boardItems = new Array(100);
		this.extraCardsInHand = [];
		this.gameWrapper = gameWrapper;
		this.globalSettings = globalSettings;
		this.$rootscope = $rootscope;
		this.forceShowTurnOptions = false;
		this.availableMoney = 0;
		this.enhancementExtraCost = 0;
		this.availableGems = 0;
		this.cardDiscount = 0;
		this.handSize = 0;
		this.gemGainedOnLanding = 1;
		this.gemGainedOnPassing = 0;
		this.totalAvailableBuys = 0;
		this.canBuyDuplicate = false;
		this.timerHelper = new TimerHelper($timeout);
	}
	public startPlayPhase(playerIndex: number) {
		gameWrapper.game.roundPhaseStatus = RoundPhaseStatus.PlayPhase;
		const playerData = gameWrapper.game.getPlayerByIndex(playerIndex).playerData;
		this.startNewRound(playerData);
		this.drawHand(playerData);
		let helperPosition = this.getExtraStartingPoint(playerIndex);
		this.scrollToIndex(playerData.startingPosition + helperPosition);

		this.gemGainedOnLanding = 1;
		let previousRound = gameWrapper.game.completedRounds[gameWrapper.game.completedRounds.length - 1];
		if (previousRound) {
			previousRound.buySelectionData.playerBuySelectionData[playerIndex].enhancements.forEach(e => {
				if (e == purchaseEnhancement.NextRoundGemsUp)
					this.gemGainedOnLanding += 1;
				else if (e == purchaseEnhancement.IncreaseBaneThreshold)
					this.selection.baneCount -= 1;
			});
		}

		if (this.gameWrapper.game.options.enableTimeLimit)
			this.timerHelper.startPreRoundCountdown(() => this.endSelectionTurn(playerData, true, true), gameWrapper.game.options.secondsPerPhase);
	}
	public forceWaitingOnServer() { this.waitingOnServer = true; }
	public isWaitingOnOthers() { return this.waitingOnServer; }
	private startNewRound(player: IPlayerClientData) {
		this.remainingItems = [...player.items]; // Shallow copy as we aren't modifying the items.
		this.currentHand = []; // Start with an empty hand.
		this.justDrawnCards = [];
		this.handSize = player.handSize;

		this.gemGainedOnPassing = 0;

		this.gameWrapper.game.players.forEach(p => p.isWaitingOnOthers = false);

		this.resetSelection(player);
		this.shuffleItems();
		this.boardItems = new Array(100);
		this.waitingOnServer = false;
	}
	private resetSelection(player: IPlayerClientData) {
		this.selection.playedItems = [];
		this.selection.trashedCard = [];
		this.selection.gemGains = 0;
		this.selection.moneyGains = 0;
		this.selection.additionalBuys = 0;
		this.selection.immediatePointGains = 0;
		this.selection.hasPerkAvailable = player.hasPerkAvailable;
		let helperPosition = this.getExtraStartingPoint(player.index);
		this.selection.currentLocation = player.startingPosition + helperPosition;
		this.selection.baneCount = 0;
	}
	public getExtraStartingPoint(playerIndex: number) {
		let helperPosition = 0
		let previousRound = gameWrapper.game.completedRounds[gameWrapper.game.completedRounds.length - 1];
		if (previousRound)
			helperPosition = previousRound.buySelectionData.additionalStartingPoints[playerIndex];
		return helperPosition;
	}
	public startBuyRound(player: IPlayerClientData) {
		this.gameWrapper.game.players.forEach(p => p.isWaitingOnOthers = false);

		this.waitingOnServer = false;
		this.buySelection.items = [];
		this.buySelection.enhancements = [];
		this.buySelection.gemsSpent = 0;

		const playerSelectionResults = this.gameWrapper.game.currentRound.selectionResults.playerSelectionData[player.index];
		this.totalAvailableBuys = playerSelectionResults.totalAvailableBuys;
		this.cardDiscount = playerSelectionResults.cardDiscount;
		if (playerSelectionResults.didBust) {
			this.buySelection.buyingItems = false;
			this.buySelection.gainingPoints = false;
		}
		else {
			this.buySelection.buyingItems = true;
			this.buySelection.gainingPoints = true;
		}
		this.canBuyDuplicate = false;
		this.enhancementExtraCost = 0;
		this.availableMoney = this.gameWrapper.game.currentRound.selectionResults.playerSelectionData[player.index].moneyGains;
		this.availableGems = player.gemTotal;

		if (this.gameWrapper.game.options.enableTimeLimit)
			this.timerHelper.startPreRoundCountdown(() => this.endBuyTurn(true), gameWrapper.game.options.secondsPerPhase);
	}
	public getSelection() {
		return this.selection;
	}
	public isExtraCard(item: IItem) {
		return this.extraCardsInHand.indexOf(item) >= 0;
	}

	public drawHand(player: IPlayerClientData, handSize: number = undefined) {
		if (this.waitingOnServer) return;

		handSize = handSize || this.handSize;

		if (this.extraCardsInHand.length > 0) {
			this.clearExtraCards();
		} else if (this.currentHand.length >= handSize) {
			// If you already have a full hand, just return.
			return;
		} else {
			this.clearExtraCards();
			const handSizeBeforeDrawing = this.currentHand.length;
			this.forceShowTurnOptions = false;
			let didDrawVirus = false;
			this.justDrawnCards = [];
			while (this.currentHand.length < handSize && this.remainingItems.length > 0) {
				let newCard = this.remainingItems.splice(0, 1)[0]
				this.currentHand.push(newCard);
				this.justDrawnCards.push(newCard);
				if (newCard.effect == itemEffect.Virus)
					didDrawVirus = true; // Take it outside (of this loop as it's functionality is larger and relies on the entire hand).
				else if (newCard.effect == itemEffect.JustDrewEmptyMover)
					newCard.wasEffective = true;
				else if (newCard.effect == itemEffect.JustDrewEmptyBonus)
					newCard.wasEffective = true;
			}

			// Check effects with functions when drawn (just virus right now)
			if (didDrawVirus && this.currentHand.length > 1) {
				let nonVirusIndex = this.currentHand.findIndex(i => i.effect != itemEffect.Virus);
				if (nonVirusIndex >= 0) {
					let removedCard = this.currentHand.splice(nonVirusIndex, 1)[0];
					this.remainingItems.push(removedCard);
					this.shuffleItems();
					this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
				}
			}
		}

		this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
	}

	private shuffleItems() {
		for (let i = this.remainingItems.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.remainingItems[i], this.remainingItems[j]] = [this.remainingItems[j], this.remainingItems[i]];
		}
	}

	private clearExtraCards(item: IItem = undefined) {
		// If there were extra cards in your hand, clear them and allow the user to end their turn
		if (this.extraCardsInHand.length > 0) {
			if (item) {
				const extraCardIndex = this.extraCardsInHand.findIndex(i => i == item);
				if (extraCardIndex >= 0)
					this.extraCardsInHand.splice(extraCardIndex, 1);
			}
			this.extraCardsInHand.forEach(extraItem => {
				const indexOfItem = this.currentHand.findIndex(i => i == extraItem);
				if (indexOfItem >= 0)
					this.currentHand.splice(indexOfItem, 1);
				this.remainingItems.push(extraItem);
			});
			this.extraCardsInHand = [];
			this.shuffleItems();
			this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
		}
	}
	public playCard(player: IPlayerClientData, card: IItem) {
		if (this.waitingOnServer) return;
		if (this.selection.playedItems.length == 0 && this.gameWrapper.game.options.enableTimeLimit) {
			// If we have a timer, make sure to start it now if it hadn't already.
			this.timerHelper.startRoundTimer(() => this.endSelectionTurn(player, true, true), gameWrapper.game.options.secondsPerPhase);
		}

		// Reset after each played card.
		if (this.forceShowTurnOptions) {
			// At this point, the played card wasn't added to the played cards,
			// so for the effect of DrawNoPenalty to last for 2 turns,
			// it just has to last for the next card played(aka this one).
			if (!this.wasPreviousCardOfType(itemEffect.DrawNoPenalty))
				this.forceShowTurnOptions = false;
		}

		let itemIndex = this.currentHand.findIndex(i => i == card);

		// Before removing from hand, check it's location.  Do these effects first.
		if (card.effect == itemEffect.TrashItem) {
			// if you have a card in your hand to the left of this, trash it!
			if (itemIndex > 0) {
				card.wasEffective = true;
				let removedItem = this.currentHand.splice(itemIndex - 1, 1)[0]; // Same as trash, but don't put it in the trashed card's list
				this.selection.trashedCard.push(removedItem);
				const extraCardIndex = this.extraCardsInHand.findIndex(i => i == removedItem);
				if (extraCardIndex >= 0)
					this.extraCardsInHand.splice(extraCardIndex, 1);
				itemIndex = this.currentHand.findIndex(i => i == card);
			}
		}
		else if (card.effect == itemEffect.DiscardItem) {
			// if you have a card in your hand, discard it!
			if (itemIndex > 0) {
				card.wasEffective = true;
				let removedItem = this.currentHand.splice(itemIndex - 1, 1)[0]; // Same as trash, but don't put it in the trashed card's list
				const extraCardIndex = this.extraCardsInHand.findIndex(i => i == removedItem);
				if (extraCardIndex >= 0)
					this.extraCardsInHand.splice(extraCardIndex, 1);
				itemIndex = this.currentHand.findIndex(i => i == card);
			}
		}

		// Before removing the card from your hand, check how many extra moves we get
		// Have to do this prior to removing the card as it needs to be consistent with card text.
		const extraMoves = this.getExtraMoves(card, player);
		let movedSpaces = card.points + extraMoves;

		// Remove the card from your hand.
		if (itemIndex >= 0)
			this.currentHand.splice(itemIndex, 1);

		// After removing the card, check the remaining cards to see if any of them have special effects when held
		this.currentHand.forEach(c => {
			if (c.effect == itemEffect.PlayCardMovement)
				c.amount += 1;
		});

		this.clearExtraCards(card);

		let previousLocation = this.selection.currentLocation;

		// Don't play the card if it's passed the limit.
		if (this.selection.currentLocation + card.points < 100) {
			// play the item on the board.
			this.selection.currentLocation += movedSpaces;
			if (extraMoves > 0)
				card.wasEffective = true;

			// Check each item effect for something that needs to be done:
			if (card.effect == itemEffect.RemovePreviousBane) {
				if (this.didJustDraw(card)) {
					let previousItem = this.selection.playedItems[this.selection.playedItems.length - 1];
					if (this.selection.playedItems.length > 0
						&& previousItem.effect == itemEffect.Bane) {
						card.wasEffective = true;
						// Remove it from the board, then add it back to the deck (still appears as a played item).
						this.boardItems.splice(previousLocation, 1);
						this.selection.baneCount -= 1; // previousItem.amount; // Attempting to make it less OP?
						this.remainingItems.push(previousItem);
						this.shuffleItems();
						this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
					}
				}
			}
			else if (card.effect == itemEffect.CopyOfPreviousCard) {
				if (this.selection.playedItems.length > 0 && this.didJustDraw(card)) {
					card.wasEffective = true;
					this.forceShowTurnOptions = true;
					let lastItem = this.selection.playedItems.splice(this.selection.playedItems.length - 1, 1)[0];
					for (let i = 0; i < card.amount; i++)
						this.remainingItems.push(lastItem);
					this.shuffleItems();
					this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
				}
			}
			else if (card.effect == itemEffect.Virus) {
				this.remainingItems.push(card);
				this.shuffleItems();
				this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
			}
			else if (card.effect == itemEffect.GainExtraBuy) {
				this.selection.additionalBuys += card.amount;
			}
			else if (card.effect == itemEffect.BaneCountRemoval) {
				this.selection.baneCount = Math.max(0, this.selection.baneCount - 1);
			}
			else if (card.effect == itemEffect.GainPoints5X) {
				if ((this.selection.currentLocation) % 5 == 0) {
					this.selection.immediatePointGains += 2;
					card.wasEffective = true;
				}
			} else if (card.effect == itemEffect.AddToHand) {
				this.forceShowTurnOptions = true;
				this.extraCardsInHand = [];
				let amount = card.amount;
				while (amount > 0 && this.remainingItems.length > 0) {
					this.extraCardsInHand.push(this.remainingItems.splice(0, 1)[0])
					amount--;
				}
				this.currentHand.push(...this.extraCardsInHand);
				this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
			}
			else if (card.effect == itemEffect.GemsForKeys) {
				const additionalGems = Math.min(3, this.selection.playedItems.reduce((count, curItem) => curItem.effect == itemEffect.SpecialNoEffect ? (count + 1) : count, 0));
				this.selection.gemGains += additionalGems;
				if (additionalGems > 0)
					card.wasEffective = true;
			}
			else if (card.effect == itemEffect.ShuffleHand) {
				if (this.currentHand.length > 0)
					card.wasEffective = true;
				this.remainingItems.push(...this.currentHand);
				this.currentHand = [];
				this.shuffleItems();
				this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
			}
			else if (card.effect == itemEffect.DrawLowestNonBane) {
				let lowestIndex = -1;
				let lowestPoints = 2; // must be lower than 2.
				this.remainingItems.forEach((i, ndx) => {
					if (i.effect != itemEffect.Bane) {
						if (i.points < lowestPoints) {
							lowestIndex = ndx;
							lowestPoints = i.points;
						}
					}
				});
				if (lowestIndex >= 0) {
					card.wasEffective = true;
					this.currentHand.push(this.remainingItems.splice(lowestIndex, 1)[0]);
					this.shuffleItems();
					this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
				}
			}
			else if (card.effect == itemEffect.BaneDrawer) {
				// Find the first bane and draw it.
				// Because this is rude, we'll give the option of ending your turn.
				this.forceShowTurnOptions = true;
				let lowestIndex = -1;
				this.remainingItems.some((i, ndx) => {
					if (i.effect == itemEffect.Bane) {
						lowestIndex = ndx;
						return true;
					}
					return false;
				});
				if (lowestIndex >= 0) {
					this.currentHand.push(this.remainingItems.splice(lowestIndex, 1)[0]);
					this.shuffleItems();
					this.$rootscope.$broadcast(CHANGE_DECK_EVENT);
				}
			}
			else if (card.effect == itemEffect.Poison) {
				this.drawHand(player, this.handSize + 1);
			}
			else if (card.effect == itemEffect.DrawNoPenalty) {
				this.drawHand(player, this.handSize + 1);
				this.forceShowTurnOptions = true;
			}
			else if (card.effect == itemEffect.EmptyHandGems) {
				if (this.currentHand.length == 0) {
					card.wasEffective = true;
					this.selection.gemGains += 3;
				}
			}
			else if (card.effect == itemEffect.IncreaseHandSize) {
				this.handSize++;
			}
			else if (card.effect == itemEffect.FutureGemsUp) {
				this.gemGainedOnLanding++;
			}
			else if (card.effect == itemEffect.FuturePassingGemsUp) {
				this.gemGainedOnPassing += 2; // Much harder to pass gems than land on them.
			}
			else if (card.effect == itemEffect.PointInvestment) {
				this.selection.immediatePointGains += card.amount;
				this.selection.moneyGains += Math.floor(card.cost / 2);
				this.selection.trashedCard.push(card);
			}
			else if (card.effect == itemEffect.GainExtraMoney) {
				this.selection.moneyGains += Math.floor(card.amount);
			}
			else if (card.effect == itemEffect.GemsForMoney) {
				let gemsNeeded = (card.amount * 3);
				if (this.selection.gemGains - gemsNeeded >= 0) {
					card.wasEffective = true;
					this.selection.gemGains -= gemsNeeded;
					this.selection.moneyGains += card.amount;
				}
			}
			else if (card.effect == itemEffect.MoneyForPassingGems) {
				let moneyGains = 0;
				let helperPosition = this.getExtraStartingPoint(player.index);
				for (let i = player.startingPosition + helperPosition + 1; i < this.selection.currentLocation; i++)
					if (this.hasGem(i, player) && !this.boardItems[i])
						moneyGains++;
				this.selection.moneyGains += (moneyGains * card.amount);
				if (moneyGains > 0)
					card.wasEffective = true;
			}
			else if (card.effect == itemEffect.BonusForKeys) {
				const playedKeysCount = Math.min(3, this.selection.playedItems.reduce((count, curItem) => curItem.effect == itemEffect.SpecialNoEffect ? (count + 1) : count, 0));
				if (playedKeysCount > 0) {
					card.wasEffective = true;
					if (playedKeysCount > 1) {
						this.selection.immediatePointGains += 1;
						if (playedKeysCount > 2) {
							this.selection.moneyGains += 1;
							this.selection.gemGains += 1;
						}
					} else {
						this.selection.moneyGains += 1;
					}
				}
			}
			else if (card.effect == itemEffect.JustDrewEmptyBonus) {
				if (card.wasEffective) {
					this.selection.moneyGains += card.amount;
					this.selection.gemGains += card.amount;
					this.selection.immediatePointGains += card.amount;
				}
			}

			// Add the item to a cached list for easier lookup than boardItems.
			this.selection.playedItems.push(card);

			if (movedSpaces > 0) {
				this.boardItems[this.selection.currentLocation] = card;

				if (this.hasGem(this.selection.currentLocation, player)) {
					this.selection.gemGains += this.gemGainedOnLanding;
					if (card.effect == itemEffect.GemLandingExtra) {
						this.selection.gemGains += card.amount;
						card.wasEffective = true;
					}
				}

				if (this.gemGainedOnPassing > 0) {
					if (movedSpaces > 1) { // Can't pass when only moving one space.
						for (let passedSpaceNdx = this.selection.currentLocation - 1; passedSpaceNdx > this.selection.currentLocation - movedSpaces; passedSpaceNdx--) {
							if (this.hasGem(passedSpaceNdx, player)) {
								this.selection.gemGains += this.gemGainedOnPassing;
							}
						}
					}
				}
				this.scrollToIndex(this.selection.currentLocation + 1); // center the next position
			}

			if (card.effect == itemEffect.Bane) {
				this.selection.baneCount += card.amount;
				if (this.selection.baneCount > player.baneThreshold)
					this.endSelectionTurn(player, false);
			}

			this.justDrawnCards = []; // If you played a card, you no longer "just drew" one.
			this.$rootscope.$broadcast(PLAY_CARD_EVENT, card);
		}
	}

	public didJustDraw(item: IItem) {
		return this.justDrawnCards.indexOf(item) >= 0;
	}
	public willLandOnGem(item: IItem, playerData: IPlayerClientData) {
		let movement = item.points + this.getExtraMoves(item, playerData);
		return movement > 0 && this.hasGem(this.selection.currentLocation + movement, playerData);
	}
	public getExtraMoves(item: IItem, playerData: IPlayerClientData): number {
		let extraMoves = 0;
		if (item.effect == itemEffect.MovesForSpecial) {
			const additionalMoves = Math.min(3, this.selection.playedItems.reduce((count, curItem) => curItem.effect == itemEffect.SpecialNoEffect ? (count + 1) : count, 0));
			extraMoves = additionalMoves;
		} else if (item.effect == itemEffect.SpecialAdjacentMover) {
			extraMoves = this.wasPreviousCardOfType(itemEffect.SpecialNoEffect) ? 1 : 0;
		} else if (item.effect == itemEffect.CopyMover) {
			let adjacentCopiers = 0;
			for (let i = this.selection.playedItems.length - 1; i >= 0; i--) {
				if (this.selection.playedItems[i].effect == itemEffect.CopyMover)
					adjacentCopiers++;
				else
					break; // if it wasn't just played, break out of here.
			}
			extraMoves = (item.points * Math.pow(2, Math.min(2, adjacentCopiers))) - item.points;
		} else if (item.effect == itemEffect.Bane) {
			// If this is a bane one and you've played a Bane1Moves2, then it moves an extra space.
			if (item.amount == 1 // purposefully looking at amount, not points.
				&& this.selection.playedItems.findIndex(i => i.effect == itemEffect.Bane1Moves2) >= 0) {
				extraMoves = 1;
			}
		} else if (item.effect == itemEffect.MovesForGems) {
			// one space for every 4 gems, up to 3.
			extraMoves = Math.min(3, Math.floor(this.selection.gemGains / 5));
		} else if (item.effect == itemEffect.EmptyHandMoves) {
			// one space if your hand will be empty by playing this.
			extraMoves = this.currentHand.length == 1 ? 1 : 0;
		}
		else if (item.effect == itemEffect.MoveTo5) {
			// If you are not landing on a multiple of 5 already.
			if ((item.points + this.selection.currentLocation) % 5 != 0)
				extraMoves = (Math.ceil((this.selection.currentLocation + item.points) / 5) * 5) - item.points - this.selection.currentLocation;
		}
		else if (item.effect == itemEffect.MoveNextGem) {
			let extraSpaces = 0;
			// put in a fail-safe of three extra spaces.
			while (!this.hasGem(this.selection.currentLocation + item.points + extraSpaces, playerData) && extraSpaces < 4)
				extraSpaces++;
			extraMoves = extraSpaces;
		}
		else if (item.effect == itemEffect.JustDrewEmptyMover) {
			if (item.wasEffective)
				extraMoves = 3;
		}
		else if (item.effect == itemEffect.PlayCardMovement) {
			extraMoves = Math.min(3, Math.floor(item.amount / 2));
		}

		// Check your hand to see if holding a card increases movement.

		return extraMoves; // If not one of the above, then it doesn't move extra
	}

	public wasPreviousCardOfType(effect: itemEffect, spacesBack: number = 1): boolean {
		if (this.selection.playedItems.length >= spacesBack)
			return this.selection.playedItems[this.selection.playedItems.length - spacesBack].effect == effect;
		return false;
	}

	public showSelectionTurnOptions(playerData: IPlayerClientData) {
		// If you have a poison in your hand, you cannot draw.
		if (this.currentHand.findIndex(i => i.effect == itemEffect.Poison) >= 0)
			return false;
		return this.forceShowTurnOptions || this.currentHand.length <= this.handSize - 1;
	}
	public endSelectionTurn(playerData: IPlayerClientData, didNotBust: boolean, ranOutOfTime: boolean = false) {
		if (this.waitingOnServer) return;
		// Populate the points (so we only have one function for this as opposed to client and server).

		this.selection.playedItems.forEach(item => {
			if (item.effect == itemEffect.PointsForPassingGems) {
				let gemBalance = 0;
				let helperPosition = this.getExtraStartingPoint(playerData.index);
				for (let i = playerData.startingPosition + helperPosition + 1; i < this.selection.currentLocation; i++) {
					if (this.hasGem(i, playerData)) {
						// If the spot has a gem, balance goes up if you played a card and down if not.
						if (!this.boardItems[i])
							gemBalance--;
						else if (this.boardItems[i])
							gemBalance++;
					}
				}
				if (gemBalance < 0) {
					// If you passed more gems than landing on, gain points.
					item.wasEffective = true;
					this.selection.immediatePointGains += Math.min(4, -gemBalance); // inverse the gem balance as you gain points for being below the balance.
				}
			}
		});

		this.selection.pointGains = this.getSpacePoints(this.selection.currentLocation);
		socket.emit("finishSelecting", this.gameWrapper.game.gameId, this.selection);
		this.waitingOnServer = true;
		if (!didNotBust) // Now that I've changed the name of this, it seems like a horrible name... Not not
			alert("Busted! (too many banes)");
	}

	public getSpacePoints(index: number) {
		return Math.floor(index / 3.3) + 1;
	}

	public endBuyTurn(ranOutOfTime: boolean = false) {
		if (this.waitingOnServer) return;
		let dupeNdx = this.buySelection.enhancements.findIndex(e => e == purchaseEnhancement.CanBuyADuplicate);
		if (dupeNdx >= 0
			&& (!this.buySelection.items.some((val, ndx, arr) => arr.indexOf(val) != ndx))
			|| (!this.buySelection.enhancements.some((val, ndx, arr) => arr.indexOf(val) != ndx))) {
			this.refundEnhancement(dupeNdx, purchaseEnhancement.CanBuyADuplicate);
		}

		// If you bought more money and then didn't spend it.
		let moreMoneyNdx = this.buySelection.enhancements.findIndex(e => e == purchaseEnhancement.ExtraMoney);
		if (moreMoneyNdx >= 0 && this.availableMoney > 4)
			this.refundEnhancement(moreMoneyNdx, purchaseEnhancement.ExtraMoney);

		socket.emit("finishBuying", this.gameWrapper.game.gameId, this.buySelection);
		this.waitingOnServer = true;
	}

	public scrollToIndex(index: number) {
		const boardAreaElem = document.getElementById("sw-boardArea");
		if (boardAreaElem) {
			const itemElem: HTMLDivElement = <HTMLDivElement>document.getElementsByClassName("sw-boardSpace")[index]; // hopefully this is it...
			const newLeftLocation = itemElem.offsetLeft + (itemElem.offsetWidth * .2) - window.innerWidth / 2;
			$(boardAreaElem).animate({ scrollLeft: newLeftLocation }, Math.max(400, Math.abs(newLeftLocation - boardAreaElem.offsetLeft) / 2), 'linear');
		}
	}
	public hasGem(index: number, playerData: IPlayerClientData) {
		if (index <= playerData.startingPosition + this.getExtraStartingPoint(playerData.index))
			return false;

		for (let i = 1; i < 45; i++)
			if (Math.floor(2.1999 * i) == index)
				return true;
		return false;
	}
	public buyItem(playerData: IPlayerClientData, item: IItem) {
		if (this.gameWrapper.game.options.enableTimeLimit)
			this.timerHelper.startRoundTimer(() => this.endBuyTurn(true), gameWrapper.game.options.secondsPerPhase);

		if (this.canBuyItem(playerData, item)) {
			if (this.canBuyDuplicate && this.haveBoughtItemEffect(item))
				this.canBuyDuplicate = false;
			else // Don't count a dupe as a buy.
				this.totalAvailableBuys--;
			this.availableMoney = this.availableMoney - (item.cost - this.cardDiscount);
			this.buySelection.items.push(item);
		} else {
			this.refundItem(item);
		}
	}
	public refundItem(item: IItem) {
		// If you can't buy the item, attempt to refund if possible.
		let boughtItemIndex = this.buySelection.items.findIndex(i => i.effect == item.effect && i.cost == item.cost && i.points == item.points && i.amount == item.amount);
		if (boughtItemIndex >= 0) {
			// refund the money and remove the item.
			this.availableMoney = this.availableMoney + (item.cost - this.cardDiscount);
			this.buySelection.items.splice(boughtItemIndex, 1);
			// Now we must refund the available buy or toggle the duplicate buy if necessary.
			// If you still have this effect, it means you had the duplicate buy enhancement bought, so toggle that.
			if (this.haveBoughtItemEffect(item))
				this.canBuyDuplicate = true;
			else // Otherwise give them their buy back.
				this.totalAvailableBuys++;
		}
	}
	public canBuyItem(playerData: IPlayerClientData, item: IItem) {
		const deckLimit = this.getDeckLimit(item.effect);
		if (deckLimit < Number.MAX_VALUE) {
			let deckCount = playerData.items.reduce((num, val) => val.effect == item.effect ? num + 1 : num, 0)
				+ this.buySelection.items.reduce((num, val) => val.effect == item.effect ? num + 1 : num, 0);
			if (deckCount >= deckLimit)
				return false;
		}

		if (this.canBuyDuplicate) {
			// If you can buy a dupe, but are chosing not to,
			// then make sure you have an avilable buy
			if (!this.haveBoughtItemEffect(item) && this.totalAvailableBuys <= 0)
				return false;
		} else {
			// If you can't buy a dupe, then don't allow dupes nor extra buys
			if (this.haveBoughtItemEffect(item))
				return false;
			if (this.totalAvailableBuys <= 0)
				return false;
		}

		return (item.cost - this.cardDiscount <= this.availableMoney);
	}
	public haveBoughtItemEffect(item: IItem) {
		return this.buySelection.items.findIndex(i => i.effect == item.effect) >= 0;
	}
	public haveBoughtItem(item: IItem) {
		return this.buySelection.items.findIndex(i => i.effect == item.effect && item.points == i.points && item.amount == i.amount) >= 0;
	}
	public haveBoughtEnhancement(enhancement: purchaseEnhancement) {
		return this.buySelection.enhancements.findIndex(e => e == enhancement) >= 0;
	}

	public refundEnhancement(enhancementDupeNdx: number, enhancement: purchaseEnhancement) {
		if (typeof enhancement !== "undefined") {
			let canRefund = true;
			if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
				// If you bought a dupe item, you can't refund.
				if (this.canBuyDuplicate == false) {
					canRefund = false;
				}
				else {
					this.canBuyDuplicate = false;
				}
			} else if (enhancement == purchaseEnhancement.ExtraMoney) {
				// if you already spent your money, you can't refund.
				if (this.availableMoney < 4) {
					canRefund = false;
				}
				else {
					this.availableMoney -= 4;
				}
			}
			if (canRefund) {
				this.buySelection.enhancements.splice(enhancementDupeNdx, 1)[0];
				const dupeCost = gameWrapper.game.currentRound.thingsToBuy.enhancments.find(en => en.enhancement == enhancement).cost;
				this.buySelection.gemsSpent -= dupeCost;
				this.availableGems = this.availableGems + dupeCost;

				if (enhancement < purchaseEnhancement.ExtraMoney) {
					this.enhancementExtraCost -= 2;
					this.availableGems += this.enhancementExtraCost;
					this.buySelection.gemsSpent -= this.enhancementExtraCost;
				}
			}
		}
	}
	public buyEnhancement(enhancement: purchaseEnhancement, cost: number, player: IPlayer) {
		const enhancementNdx = this.buySelection.enhancements.findIndex(e => e == enhancement);
		if (this.canBuyEnhancement(enhancement, cost, player)) {
			this.availableGems = this.availableGems - cost;
			this.buySelection.gemsSpent += cost;
			this.buySelection.enhancements.push(enhancement);
			if (enhancement < purchaseEnhancement.ExtraMoney)
				this.enhancementExtraCost += 2;

			if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
				this.canBuyDuplicate = true;
			}
			else if (enhancement == purchaseEnhancement.ExtraMoney) {
				this.availableMoney += 4;
			}
		} else if (enhancementNdx >= 0) {
			// If you can't buy this, but already bought one, then refund your money.
			this.refundEnhancement(enhancementNdx, enhancement);
		}
	}
	public canBuyEnhancement(enhancement: purchaseEnhancement, cost: number, player: IPlayer) {
		if (enhancement == purchaseEnhancement.CanBuyADuplicate) {
			const hasBoughtDupe = this.buySelection.enhancements.findIndex(e => e == purchaseEnhancement.CanBuyADuplicate) >= 0;
			if (hasBoughtDupe)
				return false; // Can never buy a second dupe
		} else if (enhancement == purchaseEnhancement.RefreshPerk) {
			// If the player has the perk still, don't allow them to refresh it.
			if (player.playerData.hasPerkAvailable)
				return false;
			const hasBoughtRefresh = this.buySelection.enhancements.findIndex(e => e == purchaseEnhancement.RefreshPerk) >= 0;
			if (hasBoughtRefresh)
				return false; // Can't refresh a second time.
		}
		return cost <= this.availableGems;
	}
	public getAdditionalEnhancementCost(enhancement: purchaseEnhancement) {
		// These don't cost extra to buy.
		if (enhancement >= purchaseEnhancement.ExtraMoney)
			return 0;
		return this.enhancementExtraCost;
	}

	public getDeckLimit(effect: itemEffect) {
		if (effect == itemEffect.BaneCountRemoval)
			return 1;

		return Number.MAX_VALUE;
	}

	public getPercentageToBust(player: IPlayer): number {
		let baneCount = Math.max(0, player.playerData.baneThreshold - this.selection.baneCount);
		// if you have a playable card in your hand, there's no chance you will bust.
		if (this.currentHand.some(item => item.effect != itemEffect.Bane || item.amount <= baneCount))
			return 0;
		if (this.remainingItems.length == 0)
			return 0;

		let cardsToBust = this.remainingItems.reduce((amt, item) => amt += item.effect == itemEffect.Bane && item.amount > baneCount ? 1 : 0, 0);
		let cardsToDraw = this.handSize - this.currentHand.length;
		let percentageToBust: number;
		if (cardsToDraw == 1)
			percentageToBust = cardsToBust / this.remainingItems.length;
		else { // All possible ways to bust divided by all possible ways to draw your deck.
			if (cardsToBust < cardsToDraw)
				percentageToBust = 0;
			else
				percentageToBust = this.combinations(cardsToBust, cardsToDraw) / this.combinations(this.remainingItems.length, cardsToDraw);
		}
		return Math.round(1000 * percentageToBust) / 10;
	}
	public getPercentageForOneCard(player: IPlayer): number {
		if (this.remainingItems.length == 0)
			return 0;
		let cardsToDraw = this.handSize - this.currentHand.length;
		let percentage: number;
		if (cardsToDraw == 1)
			percentage = 1 / this.remainingItems.length;
		else  // All possible ways to bust divided by all possible ways to draw your deck.
			percentage = (this.combinations(this.remainingItems.length - 1, cardsToDraw - 1)) / this.combinations(this.remainingItems.length, cardsToDraw);
		return Math.round(1000 * percentage) / 10;
	}
	private factorialRange(num: number, end: number = 1) {
		var product = end, i = end;
		while (i++ < num) product *= i;
		return product;
	}

	private combinations(n, k) {
		if (n == k) {
			return 1;
		} else {
			k = Math.max(k, n - k);
			return this.factorialRange(n, k + 1) / this.factorialRange(n - k, 1);
		}
	}
}

class TimerHelper {
	private timer: ng.IPromise<void>;
	private $timeout: ng.ITimeoutService;
	public secondsLeft: number;
	public endTime: number; // This is the time when the round is over or whatnot.
	private startedCountdown: boolean;
	private static tickAmount: number = 100;

	constructor($timeout: ng.ITimeoutService) {
		this.$timeout = $timeout;
		this.startedCountdown = false;
		this.secondsLeft = 0;
	}
	public startPreRoundCountdown(callback: () => void, timeoutMax: number) {
		// 10 seconds to digest the results of the previous round before starting
		this.timer = this.$timeout(() => this.startRoundTimer(callback, timeoutMax), 10000);
		this.startedCountdown = false;
	}
	public startRoundTimer(callback: () => void, timeoutMax: number) {
		// If you haven't started the timer already, start it now.
		if (!this.startedCountdown) {
			this.endTimer();
			this.secondsLeft = timeoutMax;
			this.endTime = new Date().getTime() + (timeoutMax * 1000);
			this.startedCountdown = true;
			this.timer = this.$timeout(() => this.onTimeout(callback), TimerHelper.tickAmount);
		}
	}
	private onTimeout(callback: () => void) {
		// check this every quarter second until finished
		if (new Date().getTime() >= this.endTime) {
			// We are done.
			if (callback && this.startedCountdown) // Don't do the callback if we already stopped the timer...
				callback();
			this.endTimer();
		} else if (this.startedCountdown) {
			this.secondsLeft -= TimerHelper.tickAmount / 1000;
			this.timer = this.$timeout(() => this.onTimeout(callback), TimerHelper.tickAmount);
		} else {
			this.endTimer();
		}
	}
	public endTimer() {
		if (this.timer)
			this.$timeout.cancel(this.timer);
		this.startedCountdown = false;
		this.secondsLeft = 0;
	}
}