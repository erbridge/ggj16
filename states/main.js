/* eslint-env browser */

'use strict';

const config = require('../config');

const Player = require('../model/Player');
const Switch = require('../model/Switch');

module.exports = {
  init() {

  },

  preload() {

  },

  create() {
    this.bombsize = 40;
    this.isPlayerNextToSwitch = false;
    this.keys = {
      cursors:  this.input.keyboard.createCursorKeys(),
      spacebar: this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
    };

    this.score = 0;

    this.setupMap();
    this.setupObstacles();
    this.setupPlayer();
    this.switchJson = this.cache.getJSON('level1');
    this.order = this.switchJson.order;
    this.setupSwitches();

    this.addTimerText();
    this.addTimer((timer) => {
      this.updateTimerText(timer);
      // FIXME: instead of switchJson we need to change to this.currentLevelJson
      if (timer >= this.switchJson.timer) {
        this.stopTimer();
        // TODO: insert loosing condition here
      }
    });
    this.startTimer();
    this.showSolution();

    // Audio
    this.levelMusic =  this.add.audio('intro', 1, true);
    this.levelMusic.play();
    this.puzzleCompleteSound = this.add.audio('puzzleCompleteMinor');
    this.puzzleComplete = false;
    this.barrierPlacementSound = this.add.audio('barrierPlacement');
  },

  turnOnNearbySwitches() {
    const threshold = 40;
    const playerX = this.player.x;
    const playerY = this.player.y;

    this.switchGroup.forEach((s) => {
      const distance = Phaser.Math.distance(playerX, playerY, s.x, s.y);

      if (distance < threshold) {
        let switchId = s.flick();
        this.score = s.flick() === this.order[this.score] ? this.score + 1 : 0;

        if (this.score === 0) {
          this.showSolution();
        }
      }
    });
  },

  showSolution() {
    this.disableInput();

    this.tweenCameraToSwitch(0);
  },

  tweenCameraToSwitch(index) {
    const id = this.order[index];

    if (id === undefined) {
      this.tweenCameraToPlayer();

      return;
    }

    const _switch = this.getSwitch(id);

    if (!_switch) {
      return;
    }

    this.camera.unfollow();

    this.tweenCamera(_switch, Phaser.Timer.SECOND * 1.5)
      .onComplete.add(function onComplete() {
        this.pullSwitch(id);

        this.time.events.add(Phaser.Timer.SECOND / 2, function tweenToNext() {
          this.tweenCameraToSwitch(index + 1);
        }, this);
      }.bind(this));
  },

  tweenCameraToPlayer() {
    this.tweenCamera(this.player, 750).onComplete.add(function tweenToNext() {
      this.camera.follow(this.player);
      this.enableInput();
    }.bind(this));
  },

  tweenCamera(target, duration) {
    return this.add.tween(this.camera).to(
      {
        x: target.x - this.camera.width / 2,
        y: target.y - this.camera.height / 2,
      },
      duration,
      Phaser.Easing.Quadratic.InOut,
      true
    );
  },

  getSwitch(id) {
    return this.switchGroup.iterate('id', id, Phaser.Group.RETURN_CHILD);
  },

  pullSwitch(id) {
    this.switchGroup.forEach((s) => {
      if (id === s.getId()) {
        s.on();
        s.off();
      }
    });
  },

  update() {
    this.player.resetVelocity();

    this.physics.arcade.collide(this.player, this.collisionLayer);
    this.physics.arcade.collide(this.player, this.obstacleGroup);
    this.physics.arcade.collide(this.player, this.switchGroup);

    if (this.inputEnabled) {
      this.movePlayer();
    }

    if (this.score === this.order.length) {
      if (!this.puzzleComplete) {
        this.puzzleComplete = true;
        this.puzzleCompleteSound.play();
      }

      this.addFloatingText(100, 100, 'You have won!');
    }
  },

  render() {

  },

  movePlayer() {
    let hasMoved = false;

    if (this.keys.cursors.up.isDown) {
      this.player.walkUp();
      hasMoved = true;
    }

    if (this.keys.cursors.down.isDown) {
      this.player.walkDown();
      hasMoved = true;
    }

    if (this.keys.cursors.left.isDown) {
      this.player.walkLeft();
      hasMoved = true;
    }

    if (this.keys.cursors.right.isDown) {
      this.player.walkRight();
      hasMoved = true;
    }

    if (hasMoved) {
      this.player.normalizeVelocity();
    } else {
      this.player.stop();
    }
  },

  addTimer(callback) {
    this.timer = this.time.create(false).loop(Phaser.Timer.SECOND * 1, function () {
      callback(this.timer.count);

      this.timer.count++;
    }, this);

    this.timer.count = 0;
  },

  startTimer() {
    this.timer.timer.start();
  },

  stopTimer() {
    this.timer.timer.stop();
  },

  removeTimer() {
    this.time.events.remove(this.timer);
  },

  addTimerText() {
    this.timerText = this.addFloatingText(0, 0, 'Time left: 0');
  },

  removeTimerText() {
    this.timerText.destroy();
    this.timerText = null;
  },

  updateTimerText(time) {
    this.timerText.setText('Time left: ' + time);
  },

  addFloatingText(x, y, message) {
    const style = {
      font:     'monospace',
      fontSize: 16,

      fill: '#fff',

      stroke:          '#000',
      strokeThickness: 3,
    };

    const text = this.add.text(x, y, message, style);

    text.fixedToCamera = true;

    return text;
  },

  setupPlayer() {
    this.player = new Player(this.game, this.world.centerX, this.world.centerY);

    this.camera.follow(this.player);
    this.camera.update();
  },

  setupMap() {
    this.map = this.add.tilemap('map');

    this.map.addTilesetImage('terrain', 'terrain-tiles');
    this.map.addTilesetImage('collision', 'collision-tiles');
    this.map.addTilesetImage('switches', 'switches-tiles');
    this.map.setCollisionByExclusion([], true, 'collision');

    this.collisionLayer = this.map.createLayer('collision');
    this.collisionLayer.alpha = 0;

    this.switchesLayer = this.map.createLayer('switches');
    this.switchesLayer.alpha = 0;

    const layer = this.map.createLayer('terrain');

    layer.resizeWorld();
  },

  setupSwitches() {
    this.switchGroup = this.add.group();

    let switchId = 1;

    this.switchesLayer
      .getTiles(0, 0, this.world.width, this.world.height)
      .filter((tile) => { return tile.index > 0; })
      .forEach((tile) => {
        let newSwitch = new Switch(this.game, tile.x * tile.width, tile.y * tile.height, switchId++);
        this.switchGroup.add(newSwitch);
      });
  },

  setupObstacles() {
    this.obstacleGroup = this.add.group();
  },

  addObstacleFromPointer(pointer) {
    const tilePoint = new Phaser.Point();

    this.collisionLayer.getTileXY(pointer.worldX, pointer.worldY, tilePoint);

    const tile = this.map.getTile(tilePoint.x, tilePoint.y, 'switches', true);

    // FIXME: This should be a check against existing switches,
    //        not places they could go.
    if (tile.index > 0) {
      return;
    }

    const collides = this.collidesWithMap(
      tile.worldX, tile.worldY, tile.width, tile.height
    );

    if (collides) {
      return;
    }

    this.addObstacle(tile.worldX, tile.worldY);
  },

  addObstacle(x, y) {
    this.barrierPlacementSound.play();
    const obstacle = this.makePhysicsSprite(x, y, 'obstacle');
    obstacle.id = Math.round(+new Date()/1000);

    obstacle.body.moves = false;

    this.game.time.events.add(Phaser.Timer.SECOND * config.obstacles.timer, function () {
      this.removeObstacle(obstacle.id)
    }, this);

    this.obstacleGroup.add(obstacle);
  },

  removeObstacle(id) {
    this.obstacleGroup.forEach((item) => {
      if (item.id === id) {
        item.destroy();
      }
    });
  },

  makePhysicsSprite(x, y, asset) {
    const sprite = this.make.sprite(x, y, asset);

    this.physics.enable(sprite, Phaser.Physics.ARCADE);

    return sprite;
  },

  // Accepts values in world coordinates
  getAvailableSpot(width, height, areaX, areaY, areaWidth, areaHeight) {
    let x;
    let y;
    let available = false;
    while (!available) {
      x = this.rnd.integerInRange(areaX, areaX + areaWidth - width);
      y = this.rnd.integerInRange(areaY, areaY + areaHeight - height);
      if (!this.collidesWithMap(x, y, width, height)) {
        available = true;
      }
    }
    return { x, y };
  },

  // Accepts values in world coordinates
  collidesWithMap(x, y, width, height) {
    let tiles = this.collisionLayer.getTiles(x, y, width, height);

    tiles = tiles.map(tile => tile.index);

    let collide = false;

    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] > 0) {
        collide = true;
      }
    }

    return collide;
  },

  eatWall() {
    const playerX = this.player.x;
    const playerY = this.player.y;

    let cr = 0;

    const obstaclesToDestroy = this.obstacleGroup.filter(function(obstacle) {
      const threshold = 80;
      const distance = Phaser.Math.distance(
        playerX, playerY, obstacle.x, obstacle.y
      );

      if (distance < threshold * 4) {
        cr++;
        return true;
      }

      return false;
    });

    obstaclesToDestroy.removeAll(true);

    const k = 0.8;

    this.player.scale.set(
      this.player.scale.x + cr * k, this.player.scale.y + cr * k
    );
    this.game.time.events.add(Phaser.Timer.SECOND * config.obstacles.timer, function() {
      this.player.scale.set(
        this.player.scale.x - cr * k, this.player.scale.y - cr * k
      );
    }, this);
  },

  enableInput() {
    this.inputEnabled = true;

    this.input.onUp.add(this.addObstacleFromPointer, this);

    // FIXME: Fix this conflict!
    this.keys.spacebar.onDown.add(this.turnOnNearbySwitches, this);
    this.keys.spacebar.onDown.add(this.eatWall, this);

    this.player.enableInput(this.keys.cursors);
  },

  disableInput() {
    this.inputEnabled = false;

    this.input.onUp.removeAll();
    this.keys.spacebar.onDown.removeAll();
    this.player.disableInput(this.keys.cursors);
  },
};
