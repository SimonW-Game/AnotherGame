const SETTINGS_COMPONENT = "globalSettingsPopup";
angular.module('mainApp').component(SETTINGS_COMPONENT, settingsComponentFunc());
function settingsComponentFunc() {
    const controllerFunc = function (userData, globalSettings) {
        var $ctrl = this;
        $ctrl.globalSettings = globalSettings;
        $ctrl.setScale = setScale;
        $ctrl.setAssistMode = setAssistMode;
        function setScale(scaleNumber) {
            globalSettings.scaleOption = scaleNumber;
            localStorage.setItem(SCALE_SETTINGS, String(scaleNumber));
        }
        function setAssistMode(flag) {
            globalSettings.assistMode = flag;
            localStorage.setItem(ASSIST_SETTINGS, String(flag));
        }
    };
    const bindings = {};
    var scorebarComponent = {
        templateUrl: 'app/views/globalSettings.html',
        bindings: bindings,
        controller: controllerFunc
    };
    return scorebarComponent;
}
//# sourceMappingURL=globalSettings.js.map