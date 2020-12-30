const SETTINGS_COMPONENT = "globalSettingsPopup";
angular.module('mainApp').component(SETTINGS_COMPONENT, settingsComponentFunc());

interface ISettingsComponent extends ng.IComponentController {
	globalSettings: IGlobalSettings;

	setScale: (scaleNumber: number) => void;
	setAssistMode: (flag: boolean) => void;
}

function settingsComponentFunc() {
	const controllerFunc = function (userData: IUserData, globalSettings: IGlobalSettings) {
		var $ctrl: ISettingsComponent = this;
		$ctrl.globalSettings = globalSettings;
		$ctrl.setScale = setScale;
		$ctrl.setAssistMode = setAssistMode;

		function setScale(scaleNumber: number) {
			globalSettings.scaleOption = scaleNumber;
			localStorage.setItem(SCALE_SETTINGS, String(scaleNumber));
		}

		function setAssistMode(flag: boolean) {
			globalSettings.assistMode = flag;
			localStorage.setItem(ASSIST_SETTINGS, String(flag));
		}
	};

	const bindings = {

	};

	var scorebarComponent = <ng.IComponentOptions>{
		templateUrl: 'app/views/globalSettings.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}