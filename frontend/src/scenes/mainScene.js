/** @type {import('../types/phaser')} */

import {settings} from '../constants.js';
import {CardSprite, CardThumbnailSprite, TextBox, InformationBox} from './interface.js';
import {RestartButton, CardChangeButton, HintButton} from './buttonHandler.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }
  
  preload() {
    this.load.atlas(
      'cards', 'assets/cardsheet.png', 'assets/cardsheet.json');
    this.load.atlas(
      'cards_small', 'assets/cardsheet_small.png', 'assets/cardsheet_small.json');
  }
  
  create() {
    this.initiateAllFields();
    
    this.cameras.main.fadeIn(250, 255, 255, 255);
    this.handleHotKeys();
    this.createInitialSprites();
    this.createButtons();
    this.createInformationBoxes();
    this.createThumbnail();
  }
  
  initiateAllFields() {
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
    this.formattedTime = '';
    this.elapsedTimeBox = null;
    
    this.remainingCards = 69;
    this.remainingCardsBox = null;
    
    this.hintUsedCount = 0;
    this.hintUsedCountBox = null;
    
    this.failCount = 0;
    this.successCount = 0;
    this.failSuccessBox = null;
    
    this.score = 0;
    this.currentScoreBox = null;
    
    this.thumbnailTextBox = null;
    this.thumbnailSprites = [];
  }
  
  initiateAllRecords() {
    this.initiateSelectRecords();
    this.logMessages = [];
    
    this.elapsedTime = 0;
    this.formattedTime = '';
    this.elapsedTimeBox.data.setText('0:00');
    
    this.remainingCards = 69;
    this.remainingCardsBox.data.setText(`${this.remainingCards}`);
    
    this.hintUsedCount = 0;
    this.hintUsedCountBox.data.setText(`${this.hintUsedCount}`);
    
    this.failCount = 0;
    this.successCount = 0;
    this.failSuccessBox.data.setText(`${this.failCount} / ${this.successCount}`);
    
    this.score = 0;
    this.currentScoreBox.data.setText(`${this.score}`);
  }
  
  initiateSelectRecords() {
    this.isSelecting = false;
    this.selectedCardSprites.clear();
    
    this.hintSets = [];
    this.messageTextBox.label.setText('');
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
    fetch(`${settings.BASE_URL}draw/?game_start=true`).
      then(res => res.json()).
      then(data => {
        const {newCards, remainingCards} = data;
        this.remainingCards = remainingCards;
        newCards.forEach((newCard, index) => {
          const cardSprite = new CardSprite(this, index, newCard).setup().
            on('pointerup', () => this.handleCardSelection(cardSprite));
          this.cardSprites.push(cardSprite);
        });
      });
  }
  
  createButtons() {
    let y = settings.window.MARGIN_Y;
    this.restartButton = new RestartButton(
      this, y, {backgroundColor: settings.button.BACKGROUND_RESTART, text: '다시 시작(R)'});
    
    y += settings.button.HEIGHT + settings.button.MARGIN;
    this.cardChangeButton = new CardChangeButton(
      this, y, {backgroundColor: settings.button.BACKGROUND_CHANGE, text: '카드 교체(C)'});
    
    y += settings.button.HEIGHT + settings.button.MARGIN;
    this.hintButton = new HintButton(
      this, y, {backgroundColor: settings.button.BACKGROUND_HINT, text: '힌트 보기(H)'});
    
    y += settings.textbox.HEIGHT + settings.textbox.MARGIN;
    this.messageTextBox = new TextBox(this, y);
  }
  
  createInformationBoxes() {
    let y = settings.window.MARGIN_Y + settings.card.HEIGHT + settings.card.MARGIN;
    this.elapsedTimeBox = new InformationBox(
      this, y, {labelText: '게임 시간', dataText: this.formatElapsedTime(this.elapsedTime)});
    
    y += settings.textbox.HEIGHT;
    this.remainingCardsBox = new InformationBox(
      this, y, {labelText: '남은 카드', dataText: `${this.remainingCards}`});
    
    y += settings.textbox.HEIGHT;
    this.hintUsedCountBox = new InformationBox(
      this, y, {labelText: '힌트 확인', dataText: `${this.hintUsedCount}`});
    
    y += settings.textbox.HEIGHT;
    this.failSuccessBox = new InformationBox(
      this, y, {labelText: '실패/성공', dataText: `${this.failCount} / ${this.successCount}`});
    
    y += settings.textbox.HEIGHT;
    this.currentScoreBox = new InformationBox(
      this, y, {labelText: '현재 점수', dataText: `${this.score}`});
  }
  
  createThumbnail() {
    const width = settings.textbox.WIDTH;
    const height = settings.textbox.HEIGHT;
    
    const bg = this.add.graphics().
      lineStyle(settings.textbox.BORDER_WIDTH, 0x002060).fillStyle(0x002060).setAlpha(1).
      fillRect(0, 0, width, height).strokeRect(0, 0, width, height);
    
    const label = this.add.text(width / 2, height / 2, '찾은 세트', {
      fontFamily: '"Noto Sans KR"',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.thumbnailTextBox = this.add.container(settings.window.MARGIN_X, 440, [bg, label]).setSize(width, height);
    
    for (let i = 0; i < 3; i++) {
      const cardThumbnailSprite = new CardThumbnailSprite(this, i, null).setup();
      this.thumbnailSprites.push(cardThumbnailSprite);
    }
  }
  
  update(time, delta) {
    this.updateTimer(delta);
    this.updateUI();
    // this.checkGameState();
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
        const res = await fetch(`${settings.BASE_URL}validate/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': settings.CSRFToken,
          },
          body: JSON.stringify({selectedCardIds}),
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
    const {isValidSet, newCards, remainingCards} = data;
    
    if (!isValidSet) {
      this.addLog('세트가 아닙니다.', 'fail');
      this.failCount += 1;
      this.failSuccessBox.data.setText(`${this.failCount} / ${this.successCount}`);
      this.selectedCardSprites.forEach(c => c.deselect());
    } else {
      this.addLog('세트 성공!', 'success');
      this.successCount += 1;
      this.failSuccessBox.data.setText(`${this.failCount} / ${this.successCount}`);
      
      this.remainingCards = remainingCards;
      this.remainingCardsBox.data.setText(`${this.remainingCards}`);
      
      this.score += 3;
      this.currentScoreBox.data.setText(`${this.score}`);
      
      this.hintSets = [];
      
      [...this.selectedCardSprites].forEach((cardSprite, i) => {
        this.thumbnailSprites[i].changeCard(cardSprite.cardData);
      });
      
      newCards.length === 3 ? this.replaceCards(newCards) : this.removeCards();
    }
    this.selectedCardSprites.clear();
  }
  
  replaceCards(newCards) {
    [...this.selectedCardSprites].forEach((cardSprite, i) => {
      const newCard = newCards[i];
      const frameKey = settings.card.FRAME_KEY(newCard);
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
  
  addLog(message, logType = 'normal') {
    const logColor = {
      'normal': '#000000',
      'fail': '#ff0000',
      'success': '#008800',
    };
    const color = logColor[logType];
    
    this.logMessages.push(message);
    if (this.logMessages.length > 1) this.logMessages.shift(); // 최근 1개만 표시
    this.messageTextBox.label.setText(this.logMessages.join('\n')).setColor(color);
  }
}
