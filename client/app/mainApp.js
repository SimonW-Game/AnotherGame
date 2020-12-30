angular.module('mainApp', [])
    .factory("gameWrapper", () => gameWrapper)
    .factory("roundWrapper", ($rootScope, gameWrapper, globalSettings, $timeout) => new RoundWrapper($rootScope, gameWrapper, globalSettings, $timeout))
    .factory("styleHelper", () => new StyleHelper())
    .factory("userData", () => ({}))
    .factory("roundSummaryHelper", () => new RoundSummaryHelper(gameWrapper))
    .factory("cardInformationHelper", (styleHelper) => new CardInformationHelper(styleHelper))
    .factory("itemBuyHelper", () => new ItemBuyHelper())
    .factory("hoverKeyHelper", () => new HoverKeyHelper())
    .factory("effectChooserHelper", () => new EffectChooserHelper())
    .factory("globalSettings", () => ({ isShowing: false, scaleOption: 0 }))
    .directive('onLongPress', function ($timeout) {
    return {
        restrict: 'A',
        link: function ($scope, $elem, $attrs) {
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
//# sourceMappingURL=mainApp.js.map