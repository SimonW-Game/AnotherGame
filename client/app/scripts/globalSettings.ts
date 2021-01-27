const SETTINGS_COMPONENT = "globalSettingsPopup";
angular.module('mainApp').component(SETTINGS_COMPONENT, settingsComponentFunc());

interface ISettingsComponent extends ng.IComponentController {
	globalSettings: IGlobalSettings;

	setScale: (scaleNumber: number) => void;
	setAssistMode: (flag: boolean) => void;
	viewTutorialInfo: () => void;
	exitInfo: () => void;
}

function settingsComponentFunc() {
	const controllerFunc = function (userData: IUserData, globalSettings: IGlobalSettings, hoverKeyHelper: HoverKeyHelper) {
		var $ctrl: ISettingsComponent = this;
		$ctrl.globalSettings = globalSettings;
		$ctrl.setScale = setScale;
		$ctrl.setAssistMode = setAssistMode;
		$ctrl.viewTutorialInfo = () => hoverKeyHelper.show(infoKeyType.tapTutorial);
		$ctrl.exitInfo = () => hoverKeyHelper.close();

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
		templateUrl: '/app/views/globalSettings.html',
		bindings: bindings,
		controller: controllerFunc
	}
	return scorebarComponent;
}