import { itemEffect, endGameBonus, purchaseEnhancement, BANE_START } from "./Game";

export function getDefaultGameOptions(): IGameOptions {
	let options: IGameOptions = getBaseOptions(10, [itemEffect.MoveAndPoint, itemEffect.MoveAndPoint]);
	options.gameMode = 0;

	options.effectsAvailable[0] = [itemEffect.FutureGemsUp, itemEffect.EmptyHandGems, itemEffect.MovesForGems, itemEffect.PointInvestment, itemEffect.DrawLowestNonBane, itemEffect.MoveAndPoint];
	options.effectsAvailable[1] = [itemEffect.PlayedMostReward, itemEffect.GainPointPerBuy, itemEffect.GainPoints5X, itemEffect.AddToHand];

	options.forceBuys[2] = [{ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
	options.forceBuys[5] = [{ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }];

	return options;
}

export function getLearnToPlayGameOptions(): IGameOptions {
	let options: IGameOptions = getBaseOptions(7, [itemEffect.SpecialNoEffect, itemEffect.SpecialNoEffect, itemEffect.LastCardGem]);
	options.startingGems = 10;
	options.startingHand = [
		...new Array(4).fill({ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
		...new Array(3).fill({ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
		...new Array(2).fill({ effect: itemEffect.SpecialNoEffect, points: 1, amount: 0, cost: 0 }),
		...new Array(1).fill({ effect: itemEffect.LastCardGem, points: 1, amount: 0, cost: 0 }),
	];

	options.enhancementsAvailable[0] = [purchaseEnhancement.IncreaseStartingSquare, purchaseEnhancement.GainPoint, purchaseEnhancement.GainTwoPoints, purchaseEnhancement.GainThreePoints];
	options.effectsAvailable[0] = [itemEffect.SpecialNoEffect, itemEffect.GemsForKeys, itemEffect.SpecialAdjacentMover, itemEffect.LastCardGem, itemEffect.IncreaseHandSize];
	options.effectsAvailable[1] = [itemEffect.GrowingMover];
	options.effectsAvailable[2] = [itemEffect.Bane1Moves2];

	options.forceBuys[3] = [{ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }];

	return options;
}

export function getFightAgainstBaneOptions(): IGameOptions {
	let options: IGameOptions = getBaseOptions(10, [itemEffect.GemLandingExtra, itemEffect.GemLandingExtra]);
	options.startingBaneThreshold = 8;
	options.startingHand = [
		...new Array(4).fill({ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
		...new Array(2).fill({ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
		...new Array(1).fill({ effect: itemEffect.Bane, points: 3, amount: 0, cost: 0 }),
		...new Array(2).fill({ effect: itemEffect.GemLandingExtra, points: 1, amount: 0, cost: 0 }),
	];

	options.enhancementsAvailable[0] = [purchaseEnhancement.IncreaseHandSize, purchaseEnhancement.IncreaseBaneThreshold, purchaseEnhancement.CanBuyADuplicate];
	options.effectsAvailable[0] = [itemEffect.AddToHand, itemEffect.GemLandingExtra, itemEffect.RemovePreviousBane, itemEffect.ShuffleHand, itemEffect.GrowingMover];
	options.effectsAvailable[2] = [itemEffect.DiscardItem, itemEffect.CopyOfPreviousCard];

	options.forceBuys[1] = [{ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
	options.forceBuys[3] = [{ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
	options.forceBuys[5] = [{ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
	options.forceBuys[7] = [{ effect: itemEffect.Bane, points: 3, amount: 0, cost: 0 }];
	options.forceBuys[8] = [{ effect: itemEffect.Bane, points: 4, amount: 0, cost: 0 }];

	return options;
}

export function getAttackGameOptions(): IGameOptions {
	let options: IGameOptions = getBaseOptions(10, [itemEffect.GemLandingExtra, itemEffect.GemLandingExtra]);

	options.enhancementsAvailable[0] = [purchaseEnhancement.IncreaseStartingSquare, purchaseEnhancement.ExtraMoney, purchaseEnhancement.GainTwoPoints];
	options.effectsAvailable[0] = [itemEffect.DiscardItem, itemEffect.GemLandingExtra, itemEffect.ShuffleHand, itemEffect.GainPoints5X, itemEffect.TaxCollector, itemEffect.BaneGiver];
	options.effectsAvailable[2] = [itemEffect.PointInvestment, itemEffect.MoveTo5];

	options.forceBuys[2] = [{ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
	options.forceBuys[5] = [{ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }];

	return options;
}

export function getDefault2GameOptions(): IGameOptions {
	let options: IGameOptions = getBaseOptions(10, [itemEffect.JustMove, itemEffect.JustMove]);

	options.enhancementsAvailable[0] = [purchaseEnhancement.IncreaseStartingSquare, purchaseEnhancement.ExtraMoney, purchaseEnhancement.GainTwoPoints, purchaseEnhancement.BuyExtraMoves, purchaseEnhancement.UpgradeFirstCard];
	options.effectsAvailable[0] = [itemEffect.JustMove, itemEffect.EmptyHandGems, itemEffect.EmptyHandMoves, itemEffect.JustDrewEmptyMover, itemEffect.MoneyForPassingGems, itemEffect.PointsForPassingGems, itemEffect.FuturePassingGemsUp];
	options.effectsAvailable[1] = [itemEffect.Bane1Moves2, itemEffect.PlayCardMovement, itemEffect.JustDrewEmptyBonus];

	options.forceBuys[2] = [{ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
	options.forceBuys[5] = [{ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }];

	return options;
}

function getBaseOptions(rounds: number = 9, startingEffects: itemEffect[] = [itemEffect.SpecialNoEffect, itemEffect.GainExtraMoney]) {
	let enhancementsAvailable: purchaseEnhancement[][] = new Array(rounds).fill(undefined).map(_ => []);
	enhancementsAvailable[0] = [purchaseEnhancement.IncreaseStartingSquare, purchaseEnhancement.CanBuyADuplicate, purchaseEnhancement.GainTwoPoints, purchaseEnhancement.ExtraMoney];

	let effectsAvailable: itemEffect[][] = new Array(rounds).fill(undefined).map(_ => []);
	effectsAvailable[0].push(...startingEffects.filter((v, i, s) => s.indexOf(v) == i)); // Just make sure there's something in there.

	let forceBuys: IItem[][] = new Array(rounds).fill(undefined).map(_ => []);

	let options: IGameOptions = {
		giveRoundBonuses: true,
		disableAssistMode: false,
		enableTimeLimit: false,
		enableEndGameBonus: false,
		pointsPerEndGameBonus: 2,
		secondsPerPhase: 30,
		startingPlayerHandSize: 2,
		startingBaneThreshold: BANE_START,
		startingGems: 5,
		startingBuys: 2,
		totalRounds: rounds,
		endGameBonuses: [],
		perks: [],
		endGameGemsForPoints: 8,
		endGameMoneyForPoints: 8,
		startingHand: [
			...new Array(4).fill({ effect: itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
			...new Array(3).fill({ effect: itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
			...startingEffects.map(e => { return { effect: e, points: 1, amount: 0, cost: 0 }; }),
		],
		effectsAvailable: effectsAvailable,
		forceBuys: forceBuys,
		enhancementsAvailable: enhancementsAvailable
	};

	return options;
}