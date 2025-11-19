import { MainScene } from "./scene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 720,
  height: 480,
  backgroundColor: "#071018",
  scene: [MainScene],
};

// Phaser is provided globally by the CDN script in index.html
const game = new Phaser.Game(config);

// prevent unused var lint warning in some environments
void game;
