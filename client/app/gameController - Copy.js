"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorebarComponent = void 0;
const SCOREBAR_COMPONENT = "scorebar";
angular.module('mainApp').component(SCOREBAR_COMPONENT, exports.scorebarComponent);
exports.scorebarComponent = {
    templateUrl: '../views/scorebar.html',
    bindings: {},
    controller: function (gameWrapper) {
        var $ctrl = this;
        $ctrl.getPlayers = function () {
            if (gameWrapper.game)
                return gameWrapper.game.players.map(p => p.playerData).sort((a, b) => b.totalScore - a.totalScore);
            return [];
        };
    }
};
//# sourceMappingURL=gameController - Copy.js.map