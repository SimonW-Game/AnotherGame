import { itemEffect, purchaseEnhancement } from "./Game";
export function getItem(effect: itemEffect, points: number = 1): IItem {
	points = Math.min(Math.max(1, points), 4);
	let item: IItem = { amount: points, effect: effect, points: points, cost: points };
	/*
	 * Approximate cost:
	 * $4 to move one space (8, 12, 16 for 2-4).
	 * $1.5 for 1 gem generator.
	 * Point is worth about $4, I haven't balanced it yet. (I forget 1 movement is roughly 1/3.3 points)
	 * Effects should take into consideration if they providing any additional value.
	 */

	if (effect == itemEffect.JustMove) {
		item.cost = item.points * 4;
		if (item.points >= 3)
			item.cost++;
	} else if (effect == itemEffect.SpecialNoEffect) {
		item.amount = 1;
		item.points = 1;
		item.cost = 5;
	} else if (effect == itemEffect.AddToHand) {
		if (points == 1)
			item.cost = 6;
		else if (points == 2)
			item.cost = 11;
		else if (points == 3)
			item.cost = 16;
		else if (points == 4)
			item.cost = 21;
	} else if (effect == itemEffect.GemsForKeys) {
		item.amount = 1;
		item.points = 1;
		item.cost = 7;
	} else if (effect == itemEffect.MovesForSpecial) {
		item.amount = 1;
		item.cost = ((2 + points) * 4); // 12,16,18,23
		if (item.cost == 4)
			item.cost++;
	} else if (effect == itemEffect.BonusForKeys) {
		// You have to have keys in your deck which means you'd be spending turns buying cards that do nothing.
		item.amount = 0;
		item.points = 0;
		item.cost = 9;
	} else if (effect == itemEffect.FarMoving) {
		item.amount = 1;
		item.points = 6;
		item.cost = 26; // vanilla $$ to movement (4*6) + $2 because holy jeeze.
	} else if (effect == itemEffect.GemLandingExtra) {
		points = Math.min(3, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 5; // Almost guarenteed to get the bonus, 4+1.5 = 5.5, but don't always get the gem
		else if (points == 2)
			item.cost = 9;
		else if (points == 3)
			item.cost = 14;
	} else if (effect == itemEffect.ShuffleHand) {
		// Good for games with larger hand sizes.  Not so great for small hand sizes. Hard to balance off of that.
		// In a lot of cases, you're looking at shuffling in a bane or two for the chance to draw cards you weren't lucky enough to draw initially.
		// In cases with small hand sizes, you might get rid of a bane for one draw.  Not so great.
		item.amount = 1;
		item.points = 1;
		item.cost = 13;
	} else if (effect == itemEffect.DrawLowestNonBane) {
		// Guarentees to draw a non-bane card.  Pretty good.  Moves one so you don't accidentally draw another one of these.  It also doesn't draw your far moving cards.
		// This is meant to be drawn as a second buy, usually at the cost of a buying a higher tier card.
		item.amount = 1;
		item.points = 1;
		item.cost = 9;
	} else if (effect == itemEffect.GrowingMover) {
		// Horrible buy late in the game. You're paying 2 spaces worth for 0 space.
		// Over the next 5 rounds, you'll be getting $16/17 worth for $8.
		item.amount = 0;
		item.points = 0;
		item.cost = 8;
	} else if (effect == itemEffect.GrowingPoints) {
		// This sucks to have in your deck, but buying it 5 turns before the end will grant you 4 points.  Might be worth picking up.
		// Miss a buy phase and get 4 points.  Buy on last round for 0 point.  Cheap enough to maybe buy a sucky card as well.  Decent enough to play with "empty hand" cards.
		item.amount = 0;
		item.points = 0;
		item.cost = 6;
	} else if (effect == itemEffect.CopyMover) {
		// Vanilla stats, but both difficult to pull off and requires an entire strategy revolving around buying these.
		item.amount = 1;
		item.points = 2;
		item.cost = 8;
	} else if (effect == itemEffect.SpecialAdjacentMover) {
		// If you bought keys, this can be a budget way of moving 2 places ($8) for the price of 1.5 places. 
		item.amount = 1;
		item.points = 1;
		item.cost = 7;
	} else if (effect == itemEffect.RemovePreviousBane) {
		// Very good effect, but limited power.
		// -Must have just played a bane and drawn this.
		// Only removes a single bane counter, so removing more than a bane 1 will not help significantly.
		// In that case, we are saying it is $2 more than vanilla moves.
		item.amount = 1;
		if (points == 1)
			item.cost = 6;
		else if (points == 2)
			item.cost = 10;
		else if (points == 3)
			item.cost = 15;
		else if (points == 4)
			item.cost = 19;
	} else if (effect == itemEffect.CopyOfPreviousCard) {
		// This (now) shuffles the last card you played into your deck.
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 8;
		else
			item.cost = 15;
	} else if (effect == itemEffect.CardsCostLess) {
		// Spend $5 to get $1n discount for every future round (or $10 for $2n every future round)
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 9;
		else
			item.cost = 18;
	} else if (effect == itemEffect.LastCardGem) {
		// If you play this last, you get $6 worth of gems making it worth $10 total.
		// But you only get one of these and it can be tough to achieve in later rounds.
		item.amount = 1;
		item.points = 1;
		item.cost = 5;
	} else if (effect == itemEffect.Virus) {
		item.amount = 1;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.Poison) {
		item.amount = 0;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.Tax) {
		item.amount = 0;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.PoisonBrewer) {
		// Paying $3 for making people more prone to bust for the rest of the game.
		item.amount = 1;
		item.points = 1;
		item.cost = 7;
	} else if (effect == itemEffect.BaneBriber) {
		// Paying $6 for making people more prone to bust for the rest of the game.
		item.amount = 1;
		item.points = 1;
		item.cost = 10;
	} else if (effect == itemEffect.TaxCollector) {
		// Paying $4 for making people have a smaller hand size or less money.
		item.amount = 1;
		item.points = 2;
		item.cost = 12;
	} else if (effect == itemEffect.BaneGiver) {
		// Paying $12 for making people suffer, you dirty dog, you.
		item.amount = 1;
		item.points = 1;
		item.cost = 16;
	} else if (effect == itemEffect.TrashItem) {
		// This card is OP (was definitely OP at a lower price).
		// Removes a threat in your deck forever.  Potential to ruin the risk of the game... only allow you to trash the card left of it.
		// Thought was to make it so you always have a potential to bust (bane sum - 1 is the bane threshold), but meh.
		// Making it a $14 effect.  Unsure if perfect, but it has potential to break the game which isn't neat.

		// Might want to change to "non bane" for attacks and possibly other combo cards?
		item.amount = 1;
		item.points = 1;
		item.cost = 18;
	} else if (effect == itemEffect.DiscardItem) {
		// Remove a threat, allowing you to draw more confidently.
		// Also helps remove attack cards.
		item.amount = 1;
		item.points = 1;
		item.cost = 12;
	} else if (effect == itemEffect.PointInvestment) {
		// This gives you back $4.  $8 - $4 for the refund is $4 for a point, not bad. Aside from being able to buy something big tt round.
		// added second level, $14 for 2 points getting back $7 for next round.
		points = Math.min(2, points);
		item.amount = points;
		item.points = 0;
		item.cost = 2 + (6 * points);
	} else if (effect == itemEffect.GainExtraBuy) {
		// Good with the correct deck.  Balance off the correct deck.
		// $4/$8 for movement.  $2 for each buy, $1 more on the second buy.
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 5;
		else
			item.cost = 11;
	} else if (effect == itemEffect.MoveTo5) {
		// This will move you at most 4 spaces.  If randomly played, it would move you 2 spaces ($8).
		// If you try to move more than that, you will on average.  It isn't hard to get the full affect making it a very budget 4 moving card.
		item.points = 0;
		item.amount = 0;
		item.cost = 12 // 12
	} else if (effect == itemEffect.BaneCountRemoval) {
		// Can only have one.  The question is when to buy it I think.
		// Chaining these together is really good... So don't let them chain it!
		// $7 to remove a bane counter.
		item.points = 0;
		item.amount = 1;
		item.cost = 7;
	} else if (effect == itemEffect.GainExtraMoney) {
		item.points = 1;
		item.amount = Math.min(4, points);
		item.cost = 3 + (item.amount * 3); // 6,9,12,15
	} else if (effect == itemEffect.GainPoints5X) {
		// We'll say that the likelihood of landing on a 5n space is decent. $4 a point, 40% to get it, ~5 rounds = $10 for the effect with a $4 discount?  What a bargain!
		item.points += 1;
		item.amount = item.points;
		item.cost = 4 + (item.points * 4); // 12, 16.
	} else if (effect == itemEffect.Bane1Moves2) {
		// Could effectively get 4 extra moves out of this if played early.  So assume 50% of getting it early (as effect does not stack, so buying many is not worth it).
		// $4 * 4 = 16 / 2 = $8 for this effect.  We'll give it the benefit of the doubt and subtract $1 for $7.  This always moves 2 spaces, so 8 + 7 = $15
		item.points = 2;
		item.amount = 2;
		item.cost = 15;
	} else if (effect == itemEffect.MovesForGems) {
		// If your goal is to earn a bunch of gems, then getting 12 gems should be doable around round 6 making a gem move 2 move you 5 spaces or consistently 4 spaces.  That's a lot.
		item.cost = 6 + (item.points * 4); //10,14,18
	} else if (effect == itemEffect.EmptyHandGems) {
		// 3 gems is worth around 4-5, so if you can hit this, you'll have 4+4.5=8.5 worth of a card.
		item.points = 1;
		item.amount = 1;
		item.cost = 6;
	} else if (effect == itemEffect.EmptyHandMoves) {
		item.points = Math.min(2, points);
		item.amount = item.points;
		item.cost = 2 + (4 * item.points);
	} else if (effect == itemEffect.IncreaseHandSize) {
		// This is decent, but this has to be drawn first.
		// 16 gems is the cost to get this effect forever.  Assuming you get this halfway through the selection phase, that is an 8 gem cost.
		// 8 gems is about $12, plus the $4 movement.
		item.points = 0;
		item.amount = 0;
		item.cost = 15;
	} else if (effect == itemEffect.GainPointPerBuy) {
		// Super good effect.  Able to accrue 2+ points per round (or 1 point per round to get a presumably better deck).
		// Gaining 2 points per round is roughly $10 effect.
		item.points = 0;
		item.amount = 0;
		item.cost = 10;
	} else if (effect == itemEffect.FutureGemsUp) {
		// Maybe 4-8 gems gotten each round, pick this up 50% of the way through the round and you get 2-4 extra gems.
		item.points = 0;
		item.amount = 0;
		item.cost = 5;
	} else if (effect == itemEffect.FuturePassingGemsUp) {
		// Maybe 4-8 gems gotten each round, pick this up 50% of the way through the round and you get 2-4 extra gems.
		item.points = 0;
		item.amount = 0;
		item.cost = 5;
	} else if (effect == itemEffect.PlayedMostReward) {
		// These are point generators and starting location advancers.  Very good.
		// But if others are buying more than you, then you won't get anything from it.
		// Also this doesn't move you and it's expensive, so make sure it's worth the investment!
		item.points = 1;
		item.amount = 1;
		item.cost = 11;
	} else if (effect == itemEffect.MoveAndPoint) {
		// Just gives you a single point, but also moves you.
		// Making 1 or 2 cost card be cheap presents problems (where people would always just buy 2+ on the last buy phase).  Bumping up the price a bit to deinsentivise that strategy somewhat.
		// Budget 3-4 moving card.  Gains you a point moves you far.  Life is good, but don't you think there are better things to spend money on?
		item.amount = 1;
		if (item.points == 1)
			item.cost = 8;
		else if (item.points == 2)
			item.cost = 10;
		else if (item.points == 3)
			item.cost = 14;
		else if (item.points == 4)
			item.cost = 18;
	} else if (effect == itemEffect.MoveNextGem) {
		// Typically this will be used for 2 spaces forward, but could occasionally be used for 3 spaces.
		// Could easily be missed to only move a single space open.
		item.cost = 7;
	} else if (effect == itemEffect.GemsForMoney) {
		// This is an approximately "fair" tradeoff.  Presumably your goal will either be not getting gems (except the minimum for this effect),
		//  or getting a lot of gems and using this as a money gemerator.
		item.points = Math.min(3, item.points);
		item.amount = item.points;
		item.cost = (item.points * 4) + 1;
		if (item.points == 3)
			item.cost++;
	} else if (effect == itemEffect.PointsForPassingGems) {
		// Could earn up to 4 points per round.  Especially combined with gems for money or when not moving very far on purpose.
		item.points = 0;
		item.amount = 1;
		item.cost = 10;
	} else if (effect == itemEffect.MoneyForPassingGems) {
		item.points = 1;
		item.amount = Math.min(2, points);
		item.cost = 3 + (item.amount * 7); // 10, 17
	} else if (effect == itemEffect.JustDrewEmptyMover) {
		// Encourages poor plays for big payoff.
		// Easy to pull off, not usually good to do, and cannot do late in selection phase.
		item.points = 0; // Doesn't move you if you don't get the effect.
		item.amount = 0;
		item.cost = 6; // the average moves in a vacuum I suppose.
	} else if (effect == itemEffect.JustDrewEmptyBonus) {
		// Encourages poor plays for big payoff.
		// Easy to pull off, not usually good to do, and cannot do late in selection phase.
		item.points = Math.min(2, points);
		item.amount = item.points;
		if (item.points == 1)
			item.cost = 8;
		else if (item.points == 2)
			item.cost = 17;
	} else if (effect == itemEffect.PlayCardMovement) {
		// Encourages poor plays for big payoff.
		// Can't stack in deck (as they nullify each other).
		// Must have many cards in deck to frequently pull off.
		item.amount = 0;
		if (item.points == 1)
			item.cost = 7;
		else if (item.points == 2)
			item.cost = 11;
		else if (item.points == 3)
			item.cost = 16;
		else if (item.points == 4)
			item.cost = 20;
	}

	return item;
}

export function getAllItemsOfEffect(effect: itemEffect) {
	let maxSize = 0;
	switch (effect) {
		case itemEffect.Virus:
		case itemEffect.Tax:
		case itemEffect.Poison:
		case itemEffect.BaneDrawer:
			maxSize = 0;
			break;
		case itemEffect.SpecialNoEffect:
		case itemEffect.GemsForKeys:
		case itemEffect.FarMoving:
		case itemEffect.ShuffleHand:
		case itemEffect.GrowingMover:
		case itemEffect.GrowingPoints:
		case itemEffect.CopyMover:
		case itemEffect.SpecialAdjacentMover:
		case itemEffect.LastCardGem:
		case itemEffect.PoisonBrewer:
		case itemEffect.BaneBriber:
		case itemEffect.TaxCollector:
		case itemEffect.BaneGiver:
		case itemEffect.TrashItem:
		case itemEffect.DiscardItem:
		case itemEffect.BonusForKeys:
		case itemEffect.Bane1Moves2:
		case itemEffect.EmptyHandGems:
		case itemEffect.IncreaseHandSize:
		case itemEffect.GainPointPerBuy:
		case itemEffect.FutureGemsUp:
		case itemEffect.FuturePassingGemsUp:
		case itemEffect.PlayedMostReward:
		case itemEffect.DrawLowestNonBane:
		case itemEffect.MoveNextGem:
		case itemEffect.PointsForPassingGems:
		case itemEffect.MoveTo5:
		case itemEffect.BaneCountRemoval:
		case itemEffect.JustDrewEmptyMover:
			maxSize = 1;
			break;

		case itemEffect.CopyOfPreviousCard:
		case itemEffect.CardsCostLess:
		case itemEffect.GainExtraBuy:
		case itemEffect.GainPoints5X:
		case itemEffect.EmptyHandMoves:
		case itemEffect.MoneyForPassingGems:
		case itemEffect.PointInvestment:
		case itemEffect.JustDrewEmptyBonus:
			maxSize = 2;
			break;

		case itemEffect.GemLandingExtra:
		case itemEffect.MovesForGems:
		case itemEffect.GemsForMoney:
			maxSize = 3;
			break;

		case itemEffect.MovesForSpecial:
		case itemEffect.AddToHand:
		case itemEffect.RemovePreviousBane:
		case itemEffect.GainExtraMoney:
		case itemEffect.MoveAndPoint:
		case itemEffect.JustMove:
		case itemEffect.PlayCardMovement:
			maxSize = 4;
			break;
	}
	return new Array(maxSize).fill(undefined).map((_, ndx) => getItem(effect, ndx + 1));
}

export function getEnhancementCost(enhancement: purchaseEnhancement, options: IGameOptions) {
	if (enhancement == purchaseEnhancement.IncreaseStartingSquare)
		return 8;
	else if (enhancement == purchaseEnhancement.IncreaseHandSize)
		return 16;
	else if (enhancement == purchaseEnhancement.CanBuyADuplicate)
		return 5;
	else if (enhancement == purchaseEnhancement.GainPoint)
		return Math.max(1, Math.min(8, options.endGameGemsForPoints - 2));
	else if (enhancement == purchaseEnhancement.GainTwoPoints)
		return Math.max(2, Math.min(16, (options.endGameGemsForPoints - 2) * 2));
	else if (enhancement == purchaseEnhancement.GainThreePoints)
		return Math.max(3, Math.min(24, (options.endGameGemsForPoints - 2) * 3));
	else if (enhancement == purchaseEnhancement.IncreaseBaneThreshold)
		return 5;
	else if (enhancement == purchaseEnhancement.VirusSpreader)
		return 13;
	else if (enhancement == purchaseEnhancement.ExtraMoney)
		return 12;
	else if (enhancement == purchaseEnhancement.RefreshPerk)
		return 5;
	else if (enhancement == purchaseEnhancement.NextRoundGemsUp)
		return 4;
	else if (enhancement == purchaseEnhancement.UpgradeFirstCard)
		return 7;
	else if (enhancement == purchaseEnhancement.BuyExtraMoves)
		return 14;
	return 20; // In case I missed something I guess /shrug
}