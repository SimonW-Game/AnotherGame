const ROUND_PREVIEW_COMPONENT = "roundPreview";
angular.module('mainApp').component(ROUND_PREVIEW_COMPONENT, roundPreviewFunc());

interface IBoardAreaController extends ng.IComponentController {
	previousRound: () => void;
	nextRound: () => void;
}

function roundPreviewFunc() {
	const controllerFunc = function (userData: IUserData, gameWrapper: IGameWrapper, roundWrapper: RoundWrapper, styleHelper: StyleHelper) {
		var $ctrl: IBoardAreaController = this;
		$ctrl.selection = roundWrapper.getSelection();

		$ctrl.getCardIconClass = styleHelper.getCardIconClass;
		$ctrl.getSpaceClasses = getSpaceClasses;
		$ctrl.getSpacePoints = (ndx) => roundWrapper.getSpacePoints(ndx);
		$ctrl.hasGem = roundWrapper.hasGem;

		function getSpaceClasses(item: IItem, index: number): string {
			if (typeof item === "undefined" || item == null) {
				// If there is no item here, but you're passed it, then show it's visited.
				if (roundWrapper.getSelection().currentLocation > index)
					return "visited-space";
			} else {
				return styleHelper.getCardClass(item.effect);
			}
			return "";
		}
	};

	const bindings = {

	};

	var buyActionComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/boardArea.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return buyActionComponent;
}