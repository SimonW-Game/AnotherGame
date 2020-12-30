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
	} else if (effect == itemEffect.MoneyForSpecial) {
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
		item.amount = 1;
		item.points = 0;
		item.cost = 9;
	} else if (effect == itemEffect.FarMoving) {
		item.amount = 1;
		item.points = 6;
		item.cost = 26; // vanilla $$ to movement (4*6) + $2 because holy jeeze.
	} else if (effect == itemEffect.GemLandingExtra) {
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 5; // Almost guarenteed to get the bonus, 4+1.5 = 5.5, but don't always get the gem
		if (points == 2)
			item.cost = 9;
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
		item.cost = 8;
	} else if (effect == itemEffect.GrowingMover) {
		// Horrible buy late in the game. You're paying almost 2 spaces worth for 0 space.
		// Over the next 5 rounds, you'll be getting $16 worth for $7.
		item.amount = 1;
		item.points = 1;
		item.cost = 8;
	} else if (effect == itemEffect.GrowingPoints) {
		// This sucks to have in your deck, but buying it 5 turns before the end will grant you 4 points.  Might be worth picking up.
		// Miss a buy phase and get 4 points.  Buy on last round for 1 point.  Cheap enough to maybe buy a sucky card as well.  Decent enough to play with "empty hand" cards.
		item.amount = 0;
		item.points = 0;
		item.cost = 7;
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
		// This card is overpowered.
		// In almost every scenario, this card removes a larger bane effectively gaining you 2+ extra spaces.
		// I'm pricing the movement 1 at $11 over vanilla value as you will use it on a Bane 2+ most of the time.
		// Which gives you at least 3 movement (or $12).  But also gives you the ability to reach further in your deck.
		// Changed to "if you just drew this card" meaning you don't have control over what you copy.
		// Balance with just drew, $8 for effect as you can unreliably hit this, but is very good when you do.  It's mostly good on higher hands or lots of banes.
		item.amount = 1;
		if (points == 1)
			item.cost = 12;
		else if (points == 2)
			item.cost = 16;
		else if (points == 3)
			item.cost = 19;
		else if (points == 4)
			item.cost = 23;
	} else if (effect == itemEffect.CopyOfPreviousCardToHand) {
		// This card is overpowered.
		// The scenario to balance over would be copying a movement 4 card (or one worth a lot of money).
		// As hand size makes it rather easy to copy the card you want to copy, it would have to be priced high.
		// OR we would have to limit the ability... which I will do.
		// Changed to "if you just drew this card" meaning you don't have control over what you copy.
		// A lot of the time you'd be using it as a single move ($4), but when you get a hit (even on just a key),
		//  you'd be gaining at least $4 worth, and a lot of the time more.
		// Strategies would include playing your whole hand (best card last) in hopes to copy the good card.  With larger hand sizes, this may be more OP
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 10;
		else
			item.cost = 18;
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
		// But you only get one of these and it cna be tough to achieve in later rounds.
		item.amount = 1;
		item.points = 1;
		item.cost = 5;
	} else if (effect == itemEffect.Virus) {
		item.amount = 1;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.Poison) {
		item.amount = 1;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.Tax) {
		item.amount = 1;
		item.points = 0;
		item.cost = 0;
	} else if (effect == itemEffect.PoisonBrewer) {
		// Paying $5 for making people more prone to bust for the rest of the game.
		item.amount = 1;
		item.points = 1;
		item.cost = 9;
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
		item.amount = 1;
		item.points = 0;
		item.cost = 8;
	} else if (effect == itemEffect.GainExtraBuy) {
		// Really good with the correct deck.  Balance off the correct deck.
		// $4/$8 for movement.  $2 for each buy, discount $1 on the second buy.
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 6;
		else
			item.cost = 13;
	} else if (effect == itemEffect.Move5X) {
		// As it is fairly easy to hold on to a card,
		// Make the base movement cost $4 per space and $3 for the extra space.
		item.amount = 1;
		item.cost = 2 + (item.points * 4); // 6,10,14,19
		if (item.points == 4)
			item.cost++;
	} else if (effect == itemEffect.BaneCountRemoval) {
		// Chaining these together is really good.
		// Extra movement with this effect is really good as well (less tradeoff to get a good effect without movement penalty).
		// $10 to remove a bane counter. $4 to move one, $6 to move a second time.
		points = Math.min(2, points);
		item.points = points;
		item.amount = points;
		if (points == 1)
			item.cost = 14;
		else
			item.cost = 20;
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
		item.amount = 1;
		item.cost = 15;
	} else if (effect == itemEffect.GainPointPerBuy) {
		// Super good effect.  Able to accrue 2+ points per round (or 1 point per round to get a presumably better deck).
		// Gaining 2 points per round is roughly $10 effect.
		item.points = 0;
		item.amount = 0;
		item.cost = 10;
	} else if (effect == itemEffect.GainExtraGemFromHere) {
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
		//Typically this will be used for 2 spaces forward, but could occasionally be used for 3 spaces.
		// Could easily be missed to only move a single space open.
		item.cost = 8;
	} else if (effect == itemEffect.GemsForMoney) {
		// This is an approximately "fair" tradeoff.  Presumably your goal will either be not getting gems (except the minimum for this effect),
		//  or getting a lot of gems and using this as a money gemerator.
		item.points = Math.min(3, item.points);
		item.amount = item.points;
		item.cost = (item.points * 4) + 1;
		if (item.points == 3)
			item.cost++;
	} else if (effect == itemEffect.PointsForNoGems) {
		// Could earn up to 4 points per round.  Especially combined with gems for money or when not moving very far on purpose.
		item.points = 0;
		item.amount = 1;
		item.cost = 7;
	} else if (effect == itemEffect.MoneyForPassingGems) {
		item.points = 1;
		item.amount = Math.min(2, points);
		item.cost = 3 + (item.amount * 7); // 10, 17
	}

	return item;
}

export function getAllItemsOfEffect(effect: itemEffect) {
	let maxSize = 0;
	switch (effect) {
		case itemEffect.Virus:
		case itemEffect.Tax:
		case itemEffect.Poison:
			maxSize = 0;
			break;
		case itemEffect.SpecialNoEffect:
		case itemEffect.MoneyForSpecial:
		case itemEffect.FarMoving:
		case itemEffect.ShuffleHand:
		case itemEffect.GrowingMover:
		case itemEffect.GrowingPoints:
		case itemEffect.CopyMover:
		case itemEffect.SpecialAdjacentMover:
		case itemEffect.LastCardGem:
		case itemEffect.PoisonBrewer:
		case itemEffect.TaxCollector:
		case itemEffect.BaneGiver:
		case itemEffect.TrashItem:
		case itemEffect.DiscardItem:
		case itemEffect.PointInvestment:
		case itemEffect.BonusForKeys:
		case itemEffect.Bane1Moves2:
		case itemEffect.EmptyHandGems:
		case itemEffect.IncreaseHandSize:
		case itemEffect.GainPointPerBuy:
		case itemEffect.GainExtraGemFromHere:
		case itemEffect.PlayedMostReward:
		case itemEffect.DrawLowestNonBane:
		case itemEffect.MoveNextGem:
		case itemEffect.PointsForNoGems:
			maxSize = 1;
			break;

		case itemEffect.GemLandingExtra:
		case itemEffect.CopyOfPreviousCardToHand:
		case itemEffect.CardsCostLess:
		case itemEffect.GainExtraBuy:
		case itemEffect.BaneCountRemoval:
		case itemEffect.GainPoints5X:
		case itemEffect.EmptyHandMoves:
		case itemEffect.MoneyForPassingGems:
			maxSize = 2;
			break;

		case itemEffect.MovesForGems:
		case itemEffect.GemsForMoney:
			maxSize = 3;
			break;

		case itemEffect.MovesForSpecial:
		case itemEffect.AddToHand:
		case itemEffect.RemovePreviousBane:
		case itemEffect.Move5X:
		case itemEffect.GainExtraMoney:
		case itemEffect.MoveAndPoint:
		case itemEffect.JustMove:
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
		return 15;
	else if (enhancement == purchaseEnhancement.VirusSpreader)
		return 13;
	else if (enhancement == purchaseEnhancement.ExtraMoney)
		return 12;
	else if (enhancement == purchaseEnhancement.RefreshPerk)
		return 5;
	return 20; // In case I missed something I guess /shrug
}