import {settings} from '../constants.js';
import {RestartGameButton} from './buttonHandler.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({key: 'GameOverScene'});
  }
  
  create(data) {
    const width = settings.window.WIDTH;
    const height = settings.window.HEIGHT;
    
    const {score} = data;
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    
    const container = this.add.container(width / 2, height / 2);
    const bg = this.add.graphics().
      fillStyle(settings.window.BACKGROUND).
      fillRoundedRect(-width / 4, -height / 4, width / 2, height / 2, 10);
    
    // 텍스트 표시
    const titleText = this.add.text(0, -height / 8, '게임이 종료됐습니다.', {
      fontSize: '32px',
      fontFamily: 'Noto Sans KR',
      fontStyle: 'bold',
      color: '#000000',
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(0, 0, `점수: ${score}`, {
      fontSize: '24px',
      fontFamily: 'Noto Sans KR',
      color: '#000000',
    }).setOrigin(0.5);
    
    const x = width / 4 - settings.button.WIDTH - 25;
    const y = height / 4 - settings.button.HEIGHT - 25;
    const restartButton = new RestartGameButton(this, y, {x: x, text: '다시 시작(R)'});
    
    container.add([bg, titleText, scoreText, restartButton]);
  }
}
