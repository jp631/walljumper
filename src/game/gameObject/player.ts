import { AnimationState, SpineGameObject } from "@esotericsoftware/spine-phaser";
import { DataType } from "../../types/dataType";

class Player extends SpineGameObject {
  currentbody: Phaser.Physics.Arcade.Body;
  LEFT: Phaser.Input.Keyboard.Key | undefined;
  RIGHT: Phaser.Input.Keyboard.Key | undefined;
  UP: Phaser.Input.Keyboard.Key | undefined;
  DOWN: Phaser.Input.Keyboard.Key | undefined;

  // New properties for WASD controls
  W: Phaser.Input.Keyboard.Key | undefined;
  A: Phaser.Input.Keyboard.Key | undefined;
  S: Phaser.Input.Keyboard.Key | undefined;
  D: Phaser.Input.Keyboard.Key | undefined;

  cursorKey!: Phaser.Input.Keyboard.Key | any;

  walking_speed: number;
  running_speed: number; // Desired speed

  dragValue: number;

  isActionOn: boolean;
  canSlide: boolean;
  animationName: string;
  stateAnimation: string;

  animationEntry: any;
  scaleTo: number;
  touchingGround: boolean;
  countJump: 0 | 1 | 2;
  trackNumber: number;
  isLoop: boolean;
  animationSpeed: number;
  animationPlayTime: number;

  lastSlideTime: number; // New property to track last slide time

  constructor(scene: Phaser.Scene, x: number, y: number, spineData: DataType) {
    super(scene, scene.spine, x, y, spineData.skel, spineData.atlas);

    this.setOrigin(0.5, 0.5);
    this.scaleTo = 0.3;
    scene.add.existing(this);
    scene.physics.add.existing(this); // enable physics for this object
    this.setScale(this.scaleTo);
    this.currentbody = this.body as Phaser.Physics.Arcade.Body; // Accessing the body of the SpineGameObject

    if (this.currentbody) {
      this.currentbody.setCollideWorldBounds(true); // Allows the player to collide with the world bounds
      this.currentbody.setSize(250, 500);
      this.currentbody.setOffset(50, -220);
    }

    // Setting up cursor keys
    this.LEFT = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.RIGHT = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.UP = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.DOWN = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    // New WASD key bindings
    this.W = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.A = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.S = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.D = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.cursorKey = scene.input.keyboard?.createCursorKeys();

    this.currentbody.setGravity(0, 300);
    this.currentbody.setVelocityX(this.currentbody.velocity.x * 0.9); // This might be unnecessary
    this.isActionOn = false;
    this.trackNumber = 0;
    this.isLoop = true;
    this.animationName = 'Idle';
    this.canSlide = false;
    this.animationPlayTime = 0;
    this.lastSlideTime = 0; // Initialize the lastSlideTime

    this.walking_speed = 100;
    this.dragValue = 600;  // original value 200
    this.running_speed = 200;

    this.animationEntry = (index: number, animation: string, loop: boolean) => {
      this.animationState.setAnimation(index, animation, loop);
    };

    this.init();
    this.animationEntry(0, this.animationName, true);
  }

  init() {
    this.printAnimationName();
  }

  update(time: number, delta: number): void {
    if (this.currentbody.touching.down) {
      this.touchingGround = true;
      this.countJump = 0;
    } else {
      this.touchingGround = false;
    }

    this.movePlayer();
    this.movementAnimation(delta);
    this.animationEntry = this.changeAnimation(this.animationName);
  }

  movePlayer() {
    this.currentbody.setDrag(this.dragValue, 0);

    // Handle movement input
    if (this.RIGHT?.isDown || this.D?.isDown) { // Check for right movement
      this.isActionOn = true;
      this.currentbody.setVelocityX(this.running_speed);
      this.scaleX = this.scaleTo; // Face right
      this.currentbody.setOffset(50, -220);
    } else if (this.LEFT?.isDown || this.A?.isDown) { // Check for left movement
      this.isActionOn = true;
      this.currentbody.setVelocityX(-this.running_speed);
      this.scaleX = -this.scaleTo; // Face left
      this.currentbody.setOffset(320, -220);
    } else {
      this.isActionOn = false;
      this.currentbody.setVelocityX(0); // Stop when no keys are pressed
    }

    if (!this.touchingGround) {
      if (this.RIGHT?.isDown || this.D?.isDown) {
        this.currentbody.setVelocityX(300 * 0.5);
      } else if (this.LEFT?.isDown || this.A?.isDown) {
        this.currentbody.setVelocityX(-300 * 0.5);
      }
      this.currentbody.setDragX(this.dragValue);
    }

    if (this.UP?.isDown || this.W?.isDown) {
      if (this.touchingGround && this.countJump === 0) {
        this.isActionOn = true;
        this.currentbody.setVelocityY(-300); // Jump
        this.countJump = 1;
      } else {
        this.isActionOn = false;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursorKey.up) || (this.W && Phaser.Input.Keyboard.JustDown(this.W))) {
      if (!this.touchingGround && this.countJump === 1) {
        this.isActionOn = true;
        this.currentbody.setVelocityY(-300);
        this.countJump = 2;
      } else {
        this.isActionOn = false;
      }
    }
  }

  movementAnimation(delta: number) {
    this.animationStateData.setMix("Run", "Idle", 0.3);
    this.animationStateData.setMix("Run", "Jump", 0.3);
    this.animationStateData.setMix("Fall", "Jump", 0.1);
    this.animationStateData.setMix("Jump", "Jump", 2);
    this.animationStateData.setMix("Fall", "Run", 0.1);
    this.animationStateData.setMix("Slide", "Run", 0.1);

    if (this.touchingGround && ((this.RIGHT?.isDown || this.A?.isDown)
      || (this.LEFT?.isDown || this.D?.isDown))) {
      this.animationName = 'Run';
      this.animationState.timeScale = 1.5;
      this.canSlide = true;
      this.isLoop = true;
    } else {
      this.animationName = 'Idle';
      this.isLoop = true;
      this.canSlide = false;
    }

    if (this.currentbody.velocity.y < 0) {
      this.animationName = 'Jump';
      this.isLoop = false;
    } else if (this.currentbody.velocity.y > 0) {
      this.animationName = 'Fall';
      this.isLoop = false;
    }

    // Slide animation logic
    if (this.touchingGround && this.canSlide) {
      const currentTime = this.scene.time.now; // Gets the current time in milliseconds

      if ((this.DOWN?.isDown || this.S?.isDown)
        && ((this.RIGHT?.isDown || this.A?.isDown)
          || (this.LEFT?.isDown || this.D?.isDown))) {
        if (currentTime - this.lastSlideTime >= 500) { // Check cooldown for starting a slide
          this.animationPlayTime += delta;

          if (this.animationPlayTime <= 500) {
            this.animationName = 'Slide';
            this.isLoop = false;

            // Set the current animation speed as needed to make it more visible
            this.animationState.timeScale = 1; // Keep animation speed normal during slide

          } else {
            // Slide animation duration exceeded, reset to normal state
            this.animationPlayTime = 0; // Reset time after exceeding maximum slide time
            this.lastSlideTime = currentTime; // Update last slide time
            this.canSlide = false; // Disable further sliding
          }
        }
      } else {
        // If the down key is released
        if (this.animationPlayTime > 0) {
          this.lastSlideTime = currentTime; // Update time of the last slide completed
        }
        this.animationPlayTime = 0; // Reset animation play time
        this.animationState.timeScale = 1; // Reset speed if not sliding
      }
    } else {
      this.animationState.timeScale = 1; // Reset speed if not sliding
    }
  }

  changeAnimation(newAnimationName: string) {
    if (this.stateAnimation !== newAnimationName) {
      console.log(this.stateAnimation, "state", newAnimationName, "new");
      this.stateAnimation = newAnimationName;
      return this.animationState.setAnimation(this.trackNumber, this.stateAnimation, this.isLoop);
    }
  }

  printAnimationName() {
    this.animationState.addListener({
      start: (entry) => console.log(`Started animation ${entry.animation.name}`),
      interrupt: (entry) => console.log(`Interrupted animation ${entry.animation.name}`),
      end: (entry) => console.log(`Ended animation ${entry.animation.name}`),
      dispose: (entry) => console.log(`Disposed animation ${entry.animation.name}`),
      complete: (entry) => console.log(`Completed animation ${entry.animation.name}`),
      event: (entry, event) => console.log(`Custom event for ${entry.animation.name}: ${event.data.name}`)
    });
  }
}

export default Player;

// this next thing i need to work on is to make possible to the player to create, build, destroy object and able to throw punches