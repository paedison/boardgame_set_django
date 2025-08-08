/** @type {import('../types/phaser')} */

import {constants} from '../constants.js';
import {CardSprite, TextButton, TextBox, InformationBox} from './interface.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.cardSprites = [];
    this.isSelecting = false;
    this.selectedCardSprites = new Set();
    this.hintSets = [];
    this.elapsedTime = 0;
    this.remainingCards = 69;
    this.hintUsedCount = 0;
    this.successCount = 0;
    this.failCount = 0;
    this.score = 0;
    this.logMessages = [];
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
    this.logText.label.setText(this.logMessages.join('\n')).setColor(color);
  }
  
  preload() {
    this.load.atlas('cards', 'assets/cardsheet.png', 'assets/cardsheet.json');
  }
  
  create() {
    this.handleHotKeys();
    this.createInitialSprites();
    this.createRestartButton();
    this.createCardChangeButton();
    this.createHintButton();
    this.createInformationBox();
    this.createFoundSetBox();
  }
  
  update(time, delta) {
    this.updateTimer(delta);
    this.updateUI();
    this.checkGameState();
  }

  handleHotKeys() {
    this.input.keyboard.on('keydown', event => {
      switch (event.code) {
        case 'KeyR':
          this.processRestartGame();
          break;
        case 'KeyC':
          this.processChangeCards();
          break;
        case 'KeyH':
          this.processRequestOrShowHint();
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
  
  createRestartButton() {
    const y = constants.Y_MARGIN;
    this.createActionButton(y, 0x007bff, '다시 시작(R)', this.processRestartGame);
  }
  
  createCardChangeButton() {
    const y = constants.Y_MARGIN + constants.BUTTON_HEIGHT + constants.BUTTON_MARGIN;
    this.createActionButton(y, 0xc45816, '카드 교체(C)', this.processChangeCards);
  }
  
  createHintButton() {
    let y = constants.Y_MARGIN + (constants.BUTTON_HEIGHT + constants.BUTTON_MARGIN) * 2;
    this.createActionButton(y, 0x28a745, '힌트 보기(H)', this.processRequestOrShowHint);
    
    y += constants.TEXTBOX_HEIGHT + constants.TEXTBOX_MARGIN;
    this.logText = new TextBox(this, y);
  }
  
  createActionButton(y, backgroundColor, text, callback) {
    const button = new TextButton(this, y, { backgroundColor, text });
    
    button.bg.on('pointerup', () => {
      button.bg.disableInteractive();
      this.tweens.add({
        targets: button.bg, alpha: 0.5, duration: 250, yoyo: true,
        onComplete: () => button.bg.setInteractive(),
      });
      callback.call(this);
    });
    
    return button;
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

  // 단축키 및 버튼 클릭시 동작 기능
  processRestartGame() {
    this.changeCards();
    
    this.isSelecting = false;
    this.selectedCardSprites.clear();
  
    this.hintSets = [];
    
    this.elapsedTime = 0;
    this.elapsedTimeBox.data.setText('0:00');
    
    this.remainingCards = 69;
    this.remainingCardsBox.data.setText(`${this.remainingCards} 장`);
    
    this.hintUsedCount = 0;
    this.hintUsedCountBox.data.setText(`${this.hintUsedCount} 번`)
    
    this.score = 0;
    this.currentScoreBox.data.setText(`${this.score} 점`);
    
    this.logMessages = [];
    this.logText.label.setText('');
  }
  
  processChangeCards() {
    this.changeCards();
    
    this.isSelecting = false;
    this.selectedCardSprites.clear();

    this.hintSets = [];
    this.logText.label.setText('');
  }
  
  changeCards() {
    let cardSprites = this.cardSprites;
    
    fetch(`${constants.BASE_URL}start/`).
      then(res => res.json()).
      then(data => {
        const {newCards} = data;
        this.tweens.add({
          targets: cardSprites, alpha: 0, duration: 500, ease: 'Power2',
          onComplete: () => {
            cardSprites.forEach((cardSprite, index) => cardSprite.changeCard(newCards[index]));
            this.tweens.add({targets: cardSprites, alpha: 1, duration: 500, ease: 'Power2'})
          },
        });
      }).
      catch(error => console.error('게임 시작 데이터 요청 실패:', error));

    this.cardSprites.forEach(cardSprite => cardSprite.deselect());
  }
  
  processRequestOrShowHint() {
    this.hintSets.length === 0 ? this.requestHint() : this.showHint();
  }
  
  requestHint() {
    let cardSprites = this.cardSprites;
    
    fetch(`${constants.BASE_URL}hint/`).
      then(res => res.json()).
      then(data => {
        const {possibleSets, newCards} = data;
        
        if (possibleSets.length === 0) {
          if (newCards.length === 0) {
            this.addLog('남은 카드가 없습니다.', 'fail');
          } else {
            this.addLog('세트가 없습니다.', 'fail');
            this.tweens.add({
              targets: cardSprites, alpha: 0, duration: 500, ease: 'Power2',
              onComplete: () => {
                cardSprites.forEach((cardSprite, index) => cardSprite.changeCard(newCards[index]));
                this.tweens.add({targets: cardSprites, alpha: 1, duration: 500, ease: 'Power2'})
                },
            });
          }
        } else {
          this.hintSets = possibleSets; // [[id1, id2, id3], [id4, id5, id6], ...]
          this.showHint();
        }
      });
  }
  
  showHint() {
    this.hintUsedCount += 1;
    this.addLog(`세트가 ${this.hintSets.length}개 있습니다.`, 'success');
    this.hintUsedCountBox.data.setText(`${this.hintUsedCount} 번`);
    this.showHintSprites();
  }
  
  showHintSprites() {
    let hintSprites = [];
    this.hintSets.forEach(hintSet => {
      let spriteIds = [];
      hintSet.forEach(cardId => {
        this.cardSprites.forEach(cardSprite => {
          if (cardSprite.cardData.id === cardId) spriteIds.push(cardSprite.index)
        })
      })
      hintSprites.push(spriteIds);
    });
    console.log(hintSprites);
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
