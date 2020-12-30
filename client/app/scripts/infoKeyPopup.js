const INFO_KEY_POPUP_COMPONENT = "infoKeyPopup";
angular.module('mainApp').component(INFO_KEY_POPUP_COMPONENT, infoKeyPopupComponentFunc());
function infoKeyPopupComponentFunc() {
    const controllerFunc = function (hoverKeyHelper) {
        var $ctrl = this;
        $ctrl.hoverKeyHelper = hoverKeyHelper;
        $ctrl.getHeaderText = getHeaderText;
        function getHeaderText() {
            let title = "";
            if (hoverKeyHelper.infoKey == infoKeyType.boardSpace) {
                title = "Board Spaces";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.currencyBuy) {
                title = "Currency - Buy";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.currencySelection) {
                title = "Currency - Selection";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.roundResultSpoils) {
                title = "Round Spoils";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.scoreboard) {
                title = "Scoreboard";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.tapTutorial) {
                title = "Info Tutorial";
            }
            else if (hoverKeyHelper.infoKey == infoKeyType.endGame) {
                title = "End Game";
            }
            return title;
        }
    };
    const bindings = {};
    var infoKeyComponent = {
        templateUrl: 'app/views/infoKeyPopup.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return infoKeyComponent;
}
//# sourceMappingURL=infoKeyPopup.js.map