"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttackGameOptions = exports.getFightAgainstBaneOptions = exports.getLearnToPlayGameOptions = exports.getDefaultGameOptions = void 0;
const Game_1 = require("./Game");
function getDefaultGameOptions() {
    let options = getBaseOptions(10, [Game_1.itemEffect.MoveAndPoint, Game_1.itemEffect.MoveAndPoint]);
    options.gameMode = 0;
    options.effectsAvailable[0] = [Game_1.itemEffect.GainExtraGemFromHere, Game_1.itemEffect.EmptyHandGems, Game_1.itemEffect.MovesForGems, Game_1.itemEffect.PointInvestment, Game_1.itemEffect.DrawLowestNonBane, Game_1.itemEffect.MoveAndPoint];
    options.effectsAvailable[1] = [Game_1.itemEffect.PlayedMostReward, Game_1.itemEffect.GainPointPerBuy, Game_1.itemEffect.GainPoints5X, Game_1.itemEffect.AddToHand];
    options.forceBuys[2] = [{ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
    options.forceBuys[5] = [{ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
    return options;
}
exports.getDefaultGameOptions = getDefaultGameOptions;
function getLearnToPlayGameOptions() {
    let options = getBaseOptions(7, [Game_1.itemEffect.SpecialNoEffect, Game_1.itemEffect.SpecialNoEffect, Game_1.itemEffect.LastCardGem]);
    options.startingGems = 10;
    options.startingHand = [
        ...new Array(5).fill({ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
        ...new Array(3).fill({ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
        ...new Array(2).fill({ effect: Game_1.itemEffect.SpecialNoEffect, points: 1, amount: 0, cost: 0 }),
        ...new Array(1).fill({ effect: Game_1.itemEffect.LastCardGem, points: 1, amount: 0, cost: 0 }),
    ];
    options.enhancementsAvailable[0] = [Game_1.purchaseEnhancement.IncreaseStartingSquare, Game_1.purchaseEnhancement.GainPoint, Game_1.purchaseEnhancement.GainTwoPoints, Game_1.purchaseEnhancement.GainThreePoints];
    options.effectsAvailable[0] = [Game_1.itemEffect.SpecialNoEffect, Game_1.itemEffect.MoneyForSpecial, Game_1.itemEffect.SpecialAdjacentMover, Game_1.itemEffect.LastCardGem, Game_1.itemEffect.IncreaseHandSize];
    options.effectsAvailable[1] = [Game_1.itemEffect.GrowingMover];
    options.effectsAvailable[2] = [Game_1.itemEffect.Bane1Moves2];
    options.forceBuys[3] = [{ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
    return options;
}
exports.getLearnToPlayGameOptions = getLearnToPlayGameOptions;
function getFightAgainstBaneOptions() {
    let options = getBaseOptions(10, [Game_1.itemEffect.GemLandingExtra, Game_1.itemEffect.GemLandingExtra]);
    options.startingBaneThreshold = 8;
    options.startingHand = [
        ...new Array(4).fill({ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
        ...new Array(2).fill({ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
        ...new Array(1).fill({ effect: Game_1.itemEffect.Bane, points: 3, amount: 0, cost: 0 }),
        ...new Array(2).fill({ effect: Game_1.itemEffect.GemLandingExtra, points: 1, amount: 0, cost: 0 }),
    ];
    options.enhancementsAvailable[0] = [Game_1.purchaseEnhancement.IncreaseHandSize, Game_1.purchaseEnhancement.IncreaseBaneThreshold, Game_1.purchaseEnhancement.CanBuyADuplicate];
    options.effectsAvailable[0] = [Game_1.itemEffect.AddToHand, Game_1.itemEffect.GemLandingExtra, Game_1.itemEffect.RemovePreviousBane, Game_1.itemEffect.ShuffleHand, Game_1.itemEffect.GrowingMover];
    options.effectsAvailable[2] = [Game_1.itemEffect.DiscardItem, Game_1.itemEffect.CopyOfPreviousCardToHand];
    options.forceBuys[1] = [{ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
    options.forceBuys[3] = [{ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
    options.forceBuys[5] = [{ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
    options.forceBuys[7] = [{ effect: Game_1.itemEffect.Bane, points: 3, amount: 0, cost: 0 }];
    options.forceBuys[8] = [{ effect: Game_1.itemEffect.Bane, points: 4, amount: 0, cost: 0 }];
    return options;
}
exports.getFightAgainstBaneOptions = getFightAgainstBaneOptions;
function getAttackGameOptions() {
    let options = getBaseOptions(10, [Game_1.itemEffect.GemLandingExtra, Game_1.itemEffect.GemLandingExtra]);
    options.startingBaneThreshold = 8;
    options.startingHand = [
        ...new Array(4).fill({ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
        ...new Array(2).fill({ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
        ...new Array(1).fill({ effect: Game_1.itemEffect.Bane, points: 3, amount: 0, cost: 0 }),
        ...new Array(2).fill({ effect: Game_1.itemEffect.GemLandingExtra, points: 1, amount: 0, cost: 0 }),
    ];
    options.enhancementsAvailable[0] = [Game_1.purchaseEnhancement.IncreaseStartingSquare, Game_1.purchaseEnhancement.ExtraMoney, Game_1.purchaseEnhancement.GainTwoPoints];
    options.effectsAvailable[0] = [Game_1.itemEffect.DiscardItem, Game_1.itemEffect.GemLandingExtra, Game_1.itemEffect.GemLandingExtra, Game_1.itemEffect.ShuffleHand, Game_1.itemEffect.GainPoints5X, Game_1.itemEffect.TaxCollector, Game_1.itemEffect.BaneGiver];
    options.effectsAvailable[2] = [Game_1.itemEffect.PointInvestment, Game_1.itemEffect.Move5X];
    options.forceBuys[2] = [{ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }];
    options.forceBuys[6] = [{ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }];
    return options;
}
exports.getAttackGameOptions = getAttackGameOptions;
function getBaseOptions(rounds = 9, startingEffects = [Game_1.itemEffect.SpecialNoEffect, Game_1.itemEffect.GainExtraMoney]) {
    let enhancementsAvailable = new Array(rounds).fill(undefined).map(_ => []);
    enhancementsAvailable[0] = [Game_1.purchaseEnhancement.IncreaseStartingSquare, Game_1.purchaseEnhancement.CanBuyADuplicate, Game_1.purchaseEnhancement.GainTwoPoints, Game_1.purchaseEnhancement.ExtraMoney];
    let effectsAvailable = new Array(rounds).fill(undefined).map(_ => []);
    effectsAvailable[0].push(...startingEffects.filter((v, i, s) => s.indexOf(v) == i)); // Just make sure there's something in there.
    let forceBuys = new Array(rounds).fill(undefined).map(_ => []);
    let options = {
        giveRoundBonuses: true,
        disableAssistMode: false,
        enableTimeLimit: false,
        enableEndGameBonus: false,
        pointsPerEndGameBonus: 2,
        secondsPerPhase: 30,
        startingPlayerHandSize: 2,
        startingBaneThreshold: Game_1.BANE_START,
        startingGems: 5,
        startingBuys: 2,
        totalRounds: rounds,
        endGameBonuses: [],
        perks: [],
        endGameGemsForPoints: 8,
        endGameMoneyForPoints: 8,
        startingHand: [
            ...new Array(4).fill({ effect: Game_1.itemEffect.Bane, points: 1, amount: 0, cost: 0 }),
            ...new Array(2).fill({ effect: Game_1.itemEffect.Bane, points: 2, amount: 0, cost: 0 }),
            ...new Array(1).fill({ effect: Game_1.itemEffect.Bane, points: 3, amount: 0, cost: 0 }),
            ...startingEffects.map(e => { return { effect: e, points: 1, amount: 0, cost: 0 }; }),
        ],
        effectsAvailable: effectsAvailable,
        forceBuys: forceBuys,
        enhancementsAvailable: enhancementsAvailable
    };
    return options;
}
//# sourceMappingURL=gameModes.js.map