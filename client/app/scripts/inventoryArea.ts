const INVENTORY_COMPONENT = "inventoryArea";
angular.module('mainApp').component(INVENTORY_COMPONENT, invectoryFunc());

interface IInventoryComponent extends ng.IComponentController {
	getCardClass: (itemEffect: itemEffect) => string;
	getCardIconClass: (itemEffect: itemEffect) => string;
	getCardName: (itemEffect: itemEffect) => string;
	getCardTypes: () => IItemGroup[];
	showEffectCount: (itemEffect: itemEffect) => boolean;
	clickOnCard: (itemEffect: itemEffect) => void;
	getEffectCount: (itemEffect: itemEffect) => number;
	getCardWidth: () => string;
	getDeckCount: () => number;
	getTimerWidth: () => string;
	getPercentageForCard: () => string;
	getPercentageToBust: () => string;
	isAssistMode: () => boolean;
	gameHasTimer: () => boolean;

	viewType: ViewType;
	timerCountDown: () => string;
}

enum ViewType {
	round,
	total
}

function invectoryFunc() {
	const controllerFunc = function ($scope: ng.IScope, userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, globalSettings: IGlobalSettings, styleHelper: StyleHelper, cardInformationHelper: CardInformationHelper) {
		let player: IPlayer = gameWrapper.game.getPlayerByIndex(userData.index);

		// Cache the current view.  If things change, make sure to clear and repopulate this cache.
		let itemGroups: IItemGroup[] = [];

		var $ctrl: IInventoryComponent = this;
		$ctrl.viewType = ViewType.round;

		$ctrl.getEffectCount = getEffectCount;
		$ctrl.getCardClass = styleHelper.getCardClass;
		$ctrl.getCardIconClass = styleHelper.getCardIconClass;
		$ctrl.getCardName = styleHelper.getCardName;
		$ctrl.getCardTypes = getCardTypes;
		$ctrl.clickOnCard = clickOnCard;
		$ctrl.showEffectCount = showEffectCount;
		$ctrl.getDeckCount = getDeckCount;
		$ctrl.getPercentageForCard = getPercentageForCard;
		$ctrl.getPercentageToBust = getPercentageToBust;
		$ctrl.getCardWidth = () => (100 / Math.ceil((itemGroups.length + 1) / 2)) + "%";
		$ctrl.isAssistMode = () => globalSettings.assistMode && !gameWrapper.game.options.disableAssistMode;
		$ctrl.gameHasTimer = () => gameWrapper.game.options.enableTimeLimit;
		$ctrl.timerCountDown = () => !roundWrapper.timerHelper.secondsLeft ? "-" : String(Math.ceil(roundWrapper.timerHelper.secondsLeft));
		$ctrl.getTimerWidth = () => !roundWrapper.timerHelper.secondsLeft ? "0px" : Math.round((roundWrapper.timerHelper.secondsLeft / gameWrapper.game.options.secondsPerPhase) * 100) + "%";

		function getEffectCount(effect: itemEffect): number {
			if (effect == itemEffect.Bane)
				return Math.max(0, player.playerData.baneThreshold - roundWrapper.getSelection().baneCount);
			else if (effect == itemEffect.SpecialNoEffect)
				return roundWrapper.selection.playedItems.reduce((count, i) => i.effect == effect ? count + 1 : count, 0);
			return 0;
		}

		function clickOnCard(effect: itemEffect) {
			cardInformationHelper.showItem(effect, styleHelper.getCardDescription({ amount: 0, effect: effect, points: 0, cost: 0 }, player, roundWrapper), 0);
		}

		function getCardTypes(): IItemGroup[] {
			if (itemGroups.length == 0) {
				let baseData: IItem[];
				if ($ctrl.viewType == ViewType.round)
					baseData = roundWrapper.remainingItems;
				else
					baseData = player.playerData.items; // If this throws, we got bigger issues.

				const groupedItems = baseData.reduce((acc, item) => {
					const key = Number(item.effect);
					(acc[key] = acc[key] || []).push(item);
					return acc;
				}, <{ [effect: number]: IItem[] }>getDefaultEffectMap());

				itemGroups = Object.keys(groupedItems).map((itemEffectKey: string) => {
					const itemEffect: itemEffect = <itemEffect>Number(itemEffectKey);
					let itemMap = groupedItems[itemEffectKey].reduce((acc: { [points: number]: number }, item: IItem) => {
						let pointsKey = item.points;
						if (item.points > 4) // For Far Moving.
							pointsKey = 1;
						if (item.amount > item.points)
							pointsKey = item.amount; // extra money uses this.  Unsure if others will, it seems safe.
						acc[pointsKey] = (acc[pointsKey] || 0) + 1;
						return acc;
					}, <{ [points: number]: number }>{ 1: 0, 2: 0, 3: 0, 4: 0 });

					return <IItemGroup>{
						effect: itemEffect,
						itemMap: itemMap
					};
				});
			}
			return itemGroups;
		}

		function getDefaultEffectMap() {
			let defaulteffectMap = {};
			defaulteffectMap[itemEffect.Bane] = [];
			return Object.keys(gameWrapper.game.currentRound.thingsToBuy.items).reduce((acc, type) => { acc[type] = []; return acc; }, defaulteffectMap);
		}

		function showEffectCount(effect: itemEffect): boolean {
			return effect == itemEffect.Bane || effect == itemEffect.SpecialNoEffect;
		}

		function getDeckCount(): number {
			return roundWrapper.remainingItems.length;
		}

		function getPercentageToBust(): string {
			if (roundWrapper.showSelectionTurnOptions(player.playerData))
				return roundWrapper.getPercentageToBust(player) + "%";
			return "-";
		}

		function getPercentageForCard(): string {
			if (roundWrapper.showSelectionTurnOptions(player.playerData))
				return roundWrapper.getPercentageForOneCard(player) + "%";
			return "-";
		}

		$scope.$on(CHANGE_DECK_EVENT, function (event) {
			if ($ctrl.viewType == ViewType.round)
				itemGroups = [];
		});
		$scope.$watch(_ => gameWrapper.game.roundPhaseStatus, function (newValue) {
			if (newValue == RoundPhaseStatus.BuyPhase) {
				$ctrl.viewType = ViewType.total;
			} else {
				$ctrl.viewType = ViewType.round;
			}
			itemGroups = [];
		});
	};

	const bindings = {

	};

	var buyActionComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/inventoryArea.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return buyActionComponent;
}