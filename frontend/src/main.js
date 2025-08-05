import {MainScene} from "./scenes/mainScene.js";
import {constants} from "./constants.js";

const config = {
    type: Phaser.AUTO,
    title: "Boardgame SET",
    description: "",
    parent: "game-container",
    width: constants.WINDOW_WIDTH,
    height: constants.WINDOW_HEIGHT,
    backgroundColor: constants.BACKGROUND_COLOR,
    pixelArt: false,
    scene: [
        MainScene,
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
