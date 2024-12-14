import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import Player from '../gameObject/player';
import { DataType } from '../../types/dataType';

const boyData: DataType = {
    skel: 'boy-data',
    atlas: 'boy-atlas'
}

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);
        const ground = this.physics.add.staticGroup()
        ground.create(500, 700, 'ground1').setScale(1).refreshBody();
     const boy = new Player(this, 200, 400, boyData);
     this.events.on('update', boy.update, boy);
     this.physics.add.collider(boy, ground);


        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
      //  this.scene.start('GameOver');
    }
}
