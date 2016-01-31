/* eslint-env browser */

'use strict';

module.exports = {
  preload() {

  },

  create() {
    const style = {
      font:     'monospace',
      fontSize: 36,

      fill:   '#fff',
      stroke: '#000',

      strokeThickness: 3,
    };

    const progressDisplay = this.add.text(0, 0, '', style);

    this.load.tilemap('map', 'assets/tilemaps/main.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.image('terrain-tiles', 'assets/tilemaps/tiles/terrain.png');
    this.load.image('collision-tiles', 'assets/tilemaps/tiles/collision.png');
    this.load.image('switches-tiles', 'assets/tilemaps/tiles/switches.png');
    this.load.image('player-tiles', 'assets/tilemaps/tiles/player.png');

    this.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    this.load.spritesheet('switch', 'assets/lever.png', 32, 32);

    // Background music
    this.load.audio('intro', 'assets/audio/soundtrack/title-or-intro.wav');

    // Sfx
    this.load.audio('leftFootstep', 'assets/audio/sfx/footsteps/left.wav');
    this.load.audio('rightFootstep', 'assets/audio/sfx/footsteps/right.wav');

    for (var x = 0; x < 7; x++){
      this.load.audio('switch' + x, 'assets/audio/sfx/switches/switch' + (x + 1) + '.wav');
    }

    for (var x = 0; x < 3; x++){
      this.load.audio('barrier' + x, 'assets/audio/sfx/antagonist-actions/barrier-placement/barrierplacement' + (x + 1) + '.wav');
    }

    this.load.audio('puzzleCompleteMinor', 'assets/audio/sfx/puzzlecomplete/minor.wav');

    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('snake', 'assets/snake.png');
    this.load.script('vignetteFilter', 'filters/Vignette.js');

    this.loadLevel('level1');

    this.load.onFileComplete.add(function handleProgress(progress) {
      progressDisplay.setText(`${progress}%`);
    }, this);

    this.load.onLoadComplete.add(function startMain() {
      this.state.start('main');
    }, this);

    this.load.start();
  },

  loadLevel(level) {
    this.load.json(level, `assets/levels/${level}.json`);
  }
};
