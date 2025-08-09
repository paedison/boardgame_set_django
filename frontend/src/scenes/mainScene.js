/** @type {import('../types/phaser')} */

import {constants} from '../constants.js';
import {CardSprite, TextButton, TextBox, InformationBox} from './interface.js';
import {RestartButton, CardChangeButton, HintButton} from './buttonHandler.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.cardSprites = [];
    this.isSelecting = false;
    this.selectedCardSprites = new Set();
    
    this.restartButton = null;
    this.cardChangeButton = null;
    this.hintButton = null;
    
    this.hintSets = [];
    this.logMessages = [];
    this.messageTextBox = null;
    
    this.elapsedTime = 0;
    this.elapsedTimeBox = null;
    this.formattedTime = null;
    
    this.remainingCards = 69;
    this.remainingCardsBox = null;
    
    this.hintUsedCount = 0;
    this.hintUsedCountBox = null;
    
    this.successCount = 0;
    this.successCountBox = null;
    
    this.failCount = 0;
    this.failCountBox = null;
    
    this.score = 0;
    this.currentScoreBox = null;
  }
  
  addLog(message, logType = 'normal') {
    const logColor = {
      'normal': '#000000',
      'fail': '#ff0000',
      'success': '#008800',
    }
    const color = logColor[logType];
    
    this.logMessages.push(message);
    if (this.logMessages.length > 1) this.logMessages.shift(); // 최근 1개만 표시
    this.messageTextBox.label.setText(this.logMessages.join('\n')).setColor(color);
  }
  
  preload() {
    this.load.atlas('cards', 'assets/cardsheet.png', 'assets/cardsheet.json');
  }
  
  create() {
    this.handleHotKeys();
    this.createInitialSprites();
    this.createButtons();
    // this.createRestartButton();
    // this.createCardChangeButton();
    // this.createHintButton();
    this.createInformationBox();
    this.createFoundSetBox();
  }
  
  update(time, delta) {
    this.updateTimer(delta);
    this.updateUI();
    // this.checkGameState();
  }

  handleHotKeys() {
    this.input.keyboard.on('keydown', event => {
      switch (event.code) {
        case 'KeyR':
          this.restartButton.execute();
          break;
        case 'KeyC':
          this.cardChangeButton.execute();
          break;
        case 'KeyH':
          this.hintButton.execute();
          break;
      }
    });
  }
  
  createInitialSprites() {
    fetch(`${constants.BASE_URL}start/`).
      then(res => res.json()).
      then(data => {
        const {newCards} = data;
        newCards.forEach((newCard, index) => {
          const cardSprite = new CardSprite(this, index, newCard).setup().
            on('pointerup', () => this.handleCardSelection(cardSprite));
          this.cardSprites.push(cardSprite);
        });
      });
  }
  
  createButtons() {
    let y = constants.Y_MARGIN;
    this.restartButton = new RestartButton(this, y, 0x007bff, '다시 시작(R)');
    
    y += constants.BUTTON_HEIGHT + constants.BUTTON_MARGIN;
    this.cardChangeButton = new CardChangeButton(this, y, 0xc45816, '카드 교체(C)');

    y += constants.BUTTON_HEIGHT + constants.BUTTON_MARGIN;
    this.hintButton = new HintButton(this, y, 0x28a745, '힌트 보기(H)');
    
    y += constants.TEXTBOX_HEIGHT + constants.TEXTBOX_MARGIN;
    this.messageTextBox = new TextBox(this, y);
  }

  createInformationBox() {
    let y = constants.Y_MARGIN + constants.CARD_HEIGHT + constants.CARD_PADDING;
    this.elapsedTimeBox = new InformationBox(this, y, {labelText: '게임 시간', dataText: '0:00'});
    
    y += constants.TEXTBOX_HEIGHT;
    this.remainingCardsBox = new InformationBox(this, y, {labelText: '남은 카드', dataText: '69 장'});
    
    y += constants.TEXTBOX_HEIGHT;
    this.hintUsedCountBox = new InformationBox(this, y, {labelText: '힌트 확인', dataText: '0 번'});
    
    y += constants.TEXTBOX_HEIGHT;
    this.successCountBox = new InformationBox(this, y, {labelText: '성공 횟수', dataText: '0 번'});
    
    y += constants.TEXTBOX_HEIGHT;
    this.failCountBox = new InformationBox(this, y, {labelText: '실패 횟수', dataText: '0 번'});
    
    y += constants.TEXTBOX_HEIGHT;
    this.currentScoreBox = new InformationBox(this, y, {labelText: '현재 점수', dataText: '0 점'});
  }
  
  createFoundSetBox() {
    const width = constants.TEXTBOX_WIDTH;
    const height = constants.TEXTBOX_HEIGHT;
    
    const bg = this.add.graphics().
      lineStyle(constants.TEXTBOX_BORDER_WIDTH, 0x002060).fillStyle(0x002060).setAlpha(1).
      fillRect(0, 0, width, height).strokeRect(0, 0, width, height)
    
    const label = this.add.text(width / 2, height / 2, '찾은 세트', {
      fontFamily: '"Noto Sans KR"',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    const box = this.add.container(constants.X_MARGIN, 440, [bg, label]);
    box.setSize(width, height);
  }
  
  updateTimer(delta) {
    this.elapsedTime += delta;
    this.formattedTime = this.formatElapsedTime(this.elapsedTime);
  }
  
  formatElapsedTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateUI() {
    this.elapsedTimeBox.data.setText(this.formattedTime);
  }
  
  checkGameState() {
    this.cardSprites.forEach(cardSprite => cardSprite.checkBorder());
  }

  async handleCardSelection(cardSprite) {
    if (this.isSelecting) return;
    
    this.isSelecting = true;
    
    if (this.selectedCardSprites.size > 3) {
      this.selectedCardSprites.forEach(cs => {
        cs.selected = false;
        cs.checkBorder();
      });
      this.selectedCardSprites.clear();
      this.isSelecting = false;
      return;
    }
    
    await cardSprite.toggleSelect();
    
    cardSprite.selected
      ? this.selectedCardSprites.add(cardSprite)
      : this.selectedCardSprites.delete(cardSprite);
    
    if (this.selectedCardSprites.size === 3) {
      const selectedCardIds = [...this.selectedCardSprites].map(cs => cs.cardData.id);
      
      try {
        const res = await fetch(`${constants.BASE_URL}validate/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': constants.CSRFToken
          },
          body: JSON.stringify({ selectedCardIds })
        });
        
        const data = await res.json();
        setTimeout(() => this.validateSet(data), 500);
      } catch (err) {
        console.error('서버 통신 오류:', err);
      }
    }
    
    this.isSelecting = false;
  }
  
  validateSet(data) {
    const {isValidSet, newCards} = data;
    
    if (!isValidSet) {
      this.addLog('세트가 아닙니다.', 'fail');
      this.failCount += 1;
      this.failCountBox.data.setText(`${this.failCount} 번`);
      this.selectedCardSprites.forEach(c => c.deselect());
    } else {
      this.addLog('세트 성공!', 'success');
      this.successCount += 1;
      this.successCountBox.data.setText(`${this.successCount} 번`);
      
      this.remainingCards -= 3;
      if (this.remainingCards <= 0) this.remainingCards = 0;
      this.remainingCardsBox.data.setText(`${this.remainingCards} 장`);
      
      this.score += 3;
      this.currentScoreBox.data.setText(`${this.score} 점`);
      
      this.hintSets = [];
      
      newCards.length === 3 ? this.replaceCards(newCards) : this.removeCards();
    }
    this.selectedCardSprites.clear();
  }
  
  replaceCards(newCards) {
    [...this.selectedCardSprites].forEach((cardSprite, i) => {
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
