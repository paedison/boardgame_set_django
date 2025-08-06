/** @type {import('../types/phaser')} */

import {constants} from '../constants.js';
import {CardSprite, GameButton} from './interface.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.cardSprites = [];
    this.selectedCardSprites = [];
    this.hintSets = [];
    this.hintIndex = 0;
    this.score = 0;
    this.logMessages = [];
  }
  
  preload() {
    this.load.atlas('cards', 'assets/cardsheet.png', 'assets/cardsheet.json');
  }
  
  create() {
    this.createInitialSprites();
    this.createRestartButton();
    this.createHintButton();
    this.handleHotKeys();
    
    this.logText = this.add.text(20, 620, '', {
      fontFamily: 'Noto',
      fontSize: '18px',
      color: '#000000',
      lineSpacing: 12,
      wordWrapWidth: 400,
      padding: {top: 5, bottom: 5, left: 5, right: 5},
    });
    
    this.scoreText = this.add.text(
      constants.WINDOW_WIDTH - 160,
      constants.WINDOW_HEIGHT - 180,
      'Score : 0',
      {fontFamily: 'Noto', fontSize: '18px', color: '#000000'});
  }
  
  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.logMessages.push(`[${timestamp}] ${message}`);
    
    // 최근 5개만 표시
    if (this.logMessages.length > 5) this.logMessages.shift();
    this.logText.setText(this.logMessages.join('\n'));
  }
  
  createInitialSprites() {
    fetch(`${constants.BASE_URL}start/`).
      then(res => res.json()).
      then(data => {
        const {newCards} = data;
        newCards.forEach((card, index) => {
          const sprite = new CardSprite(this, index, card);
          this.cardSprites.push(sprite);
        });
      });
  }
  
  createRestartButton() {
    const restartButton = new GameButton(
      this,
      constants.WINDOW_WIDTH - 160,
      constants.WINDOW_HEIGHT - 150,
      '다시 시작',
      {backgroundColor: '#007bff'},
    );
    
    restartButton.on('pointerdown', async () => {
      restartButton.disableInteractive();
      
      this.tweens.add({
        targets: restartButton,
        alpha: 0.5,
        duration: 250,
        yoyo: true,
        onComplete: () => restartButton.setInteractive(),
      });
      
      this.changeCards();
      this.resetProperties();
      this.logText.setText('');
    });
  }
  
  changeCards() {
    this.tweens.add({
      targets: this.cardSprites, alpha: 0, duration: 500, onComplete: () => {
        fetch(`${constants.BASE_URL}start/`).
          then(res => res.json()).
          then(data => {
            const {newCards} = data;
            this.createAllNewCardSprites(newCards);
          }).
          catch(error => console.error('게임 시작 데이터 요청 실패:', error));
      },
    });
  }
  
  resetProperties() {
    this.cardSprites = [];
    this.selectedCardSprites = [];
    this.hintSets = [];
    this.hintIndex = 0;
    this.hintText.setText('');
    this.score = 0;
    this.logMessages = [];
  }
  
  createHintButton() {
    this.hintText = this.add.text(
      constants.WINDOW_WIDTH - 160,
      constants.WINDOW_HEIGHT - 50,
      '', {
      fontFamily: 'Noto', fontSize: '18px', color: '#000000',
    });
    
    const hintButton = new GameButton(
      this,
      constants.WINDOW_WIDTH - 160,
      constants.WINDOW_HEIGHT - 100,
      '힌트 보기',
      {backgroundColor: '#28a745'},
    );
    
    hintButton.on('pointerdown', () => {
      hintButton.disableInteractive();
      
      this.tweens.add({
        targets: hintButton, alpha: 0.5,  duration: 250, yoyo: true,
        onComplete: () => hintButton.setInteractive(),
      });
      
      this.hintSets.length === 0 ? this.requestHints() : this.showNextHint();
    });
  }
  
  requestHints() {
    fetch(`${constants.BASE_URL}hint/`).
      then(res => res.json()).
      then(data => {
        const {possibleSets, newCards} = data;
        
        if (possibleSets.length === 0) {
          if (newCards.length === 0) {
            this.addLog('❌ 덱이 모두 소진되어 게임을 종료합니다!');
          } else {
            this.addLog('❌ 세트가 없습니다. 카드를 교체합니다!');
            this.tweens.add({
              targets: this.cardSprites, alpha: 0, duration: 500,
              onComplete: () => this.createAllNewCardSprites(newCards),
            });
          }
        } else {
          this.hintSets = possibleSets; // [[id1, id2, id3], [id4, id5, id6], ...]
          this.hintIndex = 0;
          this.showNextHint();
        }
      });
  }
  
  showNextHint() {
    const hintIndex = this.hintIndex;
    const currentHint = this.hintSets[hintIndex];
    const hintCount = this.hintSets.length;
    
    this.hintText.setText(`힌트 ${hintIndex + 1}/${hintCount}`);
    this.hintIndex = (hintIndex + 1) % hintCount; // 순환
    
    const hinted_color = constants.HINTED_BORDER_COLOR;
    const default_color = constants.DEFAULT_BORDER_COLOR;
    this.cardSprites.forEach(sprite => {
      currentHint.includes(sprite.cardData.id) ?
        sprite.updateBorder(hinted_color) :
        sprite.updateBorder(default_color);
    });
    
    this.addLog('✅ 가능한 세트를 표시했습니다');
  }
  
  handleHotKeys() {
    this.input.keyboard.on('keydown', event => {
      switch (event.code) {
        case 'KeyH':
          this.hintSets.length === 0 ? this.requestHints() : this.showNextHint();
          break;
        case 'KeyR':
          this.changeCards();
          this.resetProperties();
          this.logText.setText('');
          break;
      }
    });
  }
  
  createAllNewCardSprites(newCards) {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    
    newCards.forEach((card, index) => {
      const cardSprite = new CardSprite(this, index, card);
      cardSprite.setAlpha(0).setInteractive();
      this.cardSprites.push(cardSprite);
      this.tweens.add({targets: cardSprite, alpha: 1, duration: 500, ease: 'Linear'});
    });
  }
  
  async handleCardSelection(cardSprite) {
    let selected = this.selectedCardSprites;
    cardSprite.selected ? selected.push(cardSprite) : selected.filter(s => s !== cardSprite);
    
    if (selected.length === 3) {
      const selectedCardIds = selected.map(cs => cs.cardData.id);
      
      fetch(`${constants.BASE_URL}validate/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': constants.CSRFToken},
        body: JSON.stringify({'selectedCardIds': selectedCardIds}),
      }).
        then(res => res.json()).
        then(data => setTimeout(() => this.validateSet(data), 500)).
        catch(err => console.error('서버 통신 오류:', err));
    }
  }
  
  validateSet(data) {
    const {isValidSet, newCards} = data;
    
    if (!isValidSet) {
      this.addLog('❌ 세트 실패');
      this.selectedCardSprites.forEach(c => c.deselect());
    } else {
      this.addLog('✅ 세트 성공!');
      this.score += 3;
      this.scoreText.setText(`Score: ${this.score}`);
      this.hintSets = [];
      this.hintText.setText('');
      newCards.length === 3 ? this.changeToNewCards(newCards) : this.removeCards();
    }
    this.selectedCardSprites = [];
    this.hintIndex = 0;
  }
  
  changeToNewCards(newCards) {
    this.selectedCardSprites.forEach((cardSprite, i) => {
      const newCard = newCards[i];
      const frameKey = constants.CARD_FRAME(newCard);
      this.tweens.add({
        targets: cardSprite, alpha: 0, duration: 500,
        onComplete: () => {
          cardSprite.setTexture('cards', frameKey);
          cardSprite.cardData = newCard;
          this.tweens.add({targets: cardSprite, alpha: 1, duration: 300});
        },
      });
      cardSprite.deselect();
    });
  }
  
  removeCards() {
    this.selectedCardSprites.forEach(cardSprite => {
      this.tweens.add({
        targets: cardSprite, alpha: 0, duration: 500, ease: 'Linear',
        onComplete: () => cardSprite.setTexture('__WHITE'),
      });
      cardSprite.deselect();
      cardSprite.disableInteractive();
    });
  }
}
