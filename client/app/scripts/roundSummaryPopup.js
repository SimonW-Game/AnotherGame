const ROUND_POPUP_COMPONENT = "roundPopup";
angular.module('mainApp').component(ROUND_POPUP_COMPONENT, roundPopupComponentFunc());
function roundPopupComponentFunc() {
    const controllerFunc = function (userData, gameWrapper) {
        let player = gameWrapper.game.getPlayerByIndex(userData.index);
        var $ctrl = this;
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/roundPopup.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=roundSummaryPopup.js.map