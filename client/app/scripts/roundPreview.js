const ROUND_PREVIEW_COMPONENT = "roundPreview";
angular.module('mainApp').component(ROUND_PREVIEW_COMPONENT, roundPreviewFunc());
function roundPreviewFunc() {
    const controllerFunc = function (userData, gameWrapper, roundWrapper, styleHelper) {
        var $ctrl = this;
        $ctrl.selection = roundWrapper.getSelection();
        $ctrl.getCardIconClass = styleHelper.getCardIconClass;
        $ctrl.getSpaceClasses = getSpaceClasses;
        $ctrl.getSpacePoints = (ndx) => roundWrapper.getSpacePoints(ndx);
        $ctrl.hasGem = roundWrapper.hasGem;
        function getSpaceClasses(item, index) {
            if (typeof item === "undefined" || item == null) {
                // If there is no item here, but you're passed it, then show it's visited.
                if (roundWrapper.getSelection().currentLocation > index)
                    return "visited-space";
            }
            else {
                return styleHelper.getCardClass(item.effect);
            }
            return "";
        }
    };
    const bindings = {};
    var buyActionComponent = {
        templateUrl: 'app/views/boardArea.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return buyActionComponent;
}
//# sourceMappingURL=roundPreview.js.map