angular.module('mainApp', [])
	.factory("gameWrapper", () => gameWrapper)
	.factory("roundWrapper", ($rootScope: ng.IRootScopeService, gameWrapper: IGameWrapper, globalSettings: IGlobalSettings, $timeout: ng.ITimeoutService) => new RoundWrapper($rootScope, gameWrapper, globalSettings, $timeout))
	.factory("styleHelper", () => new StyleHelper())
	.factory("userData", () => ({} as IUserData))
	.factory("roundSummaryHelper", () => new RoundSummaryHelper(gameWrapper))
	.factory("cardInformationHelper", (styleHelper: StyleHelper) => new CardInformationHelper(styleHelper))
	.factory("itemBuyHelper", () => new ItemBuyHelper())
	.factory("hoverKeyHelper", () => new HoverKeyHelper())
	.factory("effectChooserHelper", () => new EffectChooserHelper())
	.factory("globalSettings", () => <IGlobalSettings>{ isShowing: false, scaleOption: 0 })
	.directive('onLongPress', function ($timeout: ng.ITimeoutService) {
		// Original directive from:
		// https://gist.github.com/BobNisco/9885852
		interface longPressScope extends ng.IScope {
			longPress: boolean;
		}
		return {
			restrict: 'A',
			link: function ($scope: longPressScope, $elem, $attrs) {
				$scope.longPress = false;
				$elem.bind('touchstart mousedown', function (evt) {
					// Locally scoped variable that will keep track of the long press
					$scope.longPress = true;

					$timeout(function () {
						if ($scope.longPress) {
							// If the touchend event hasn't fired,
							// apply the function given in on the element's on-long-press attribute
							$scope.$apply(function () {
								$scope.$eval($attrs.onLongPress);
							});
						}
					}, 200);
				});

				$elem.bind('touchend mouseup mouseout', function (evt) {
					// Prevent the onLongPress event from firing
					// If there is an on-long-touch-end function attached to this element, apply it
					if ($scope.longPress && $attrs.onLongTouchEnd) {
						$scope.$apply(function () {
							$scope.$eval($attrs.onLongTouchEnd);
						});
					}

					$scope.longPress = false;
				});
			}
		};
	});
