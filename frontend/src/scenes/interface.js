/** @type {import('../types/phaser')} */

import {constants} from '../constants.js';


function getConstants(index, card) {
  const cardWidth = constants.CARD_WIDTH;
  const cardHeight = constants.CARD_HEIGHT;
  const cardPadding = constants.CARD_PADDING;
  const x_margin = constants.X_MARGIN + constants.BUTTON_WIDTH + cardPadding;

  return {
    cardWidth: cardWidth,
    cardHeight: cardHeight,
    borderColor: constants.DEFAULT_BORDER_COLOR,
    borderWidth: constants.CARD_BORDER_WIDTH,

    x: x_margin + (index % 4) * (cardWidth + cardPadding),
    y: constants.Y_MARGIN + Math.floor(index / 4) * (cardHeight + cardPadding),
    frameKey: constants.CARD_FRAME(card),
  }
}


export class CardSprite extends Phaser.GameObjects.Image {
  constructor(scene, index, card) {
    const {
      cardWidth, cardHeight, borderColor, borderWidth,
      x, y, frameKey} = getConstants(index, card);
    
    super(scene, x, y, 'cards', frameKey);
    
    this.index = index;
    this.cardData = card;
    this.x = x;
    this.y = y;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.selected = false;
    this.borderColor = borderColor;
    
    scene.add.existing(this);
  }
  
  setup() {
    this.setOrigin(0, 0).setInteractive().
      setPosition(this.x + 2, this.y + 2).
      setDisplaySize(this.cardWidth - 4, this.cardHeight - 4).
      drawCardBorder(this.borderColor);
    return this
  }
  
  toggleSelect() {
    this.selected = !this.selected;
    const finalColor = this.selected ? constants.SELECTED_BORDER_COLOR : constants.DEFAULT_BORDER_COLOR;
    this.updateBorder(finalColor);
  }
  
  drawCardBorder(color) {
    const border = this.scene.add.graphics();
    border.lineStyle(constants.CARD_BORDER_WIDTH, color);
    border.strokeRect(this.x, this.y, this.cardWidth, this.cardHeight);
    return border;
  }
  
  updateBorder(finalColor) {
    if (finalColor !== this.borderColor) {
      this.scene.tweens.add({
        targets: this.border,
        alpha: 0,
        duration: 500,
        oncomplete: () => {
          this.border.clear();
          this.border = this.drawCardBorder(finalColor);
          this.border.setAlpha(0);
          this.scene.tweens.add({
            targets: this.border, alpha: 1, duration: 500,
            onComplete: () => this.borderColor = finalColor,
          });
        },
      });
    }
  }
  
  checkBorder() {
    this.selected
      ? this.drawCardBorder(constants.SELECTED_BORDER_COLOR)
      : this.drawCardBorder(constants.DEFAULT_BORDER_COLOR)
  }
  
  deselect() {
    this.selected = false;
    this.updateBorder(constants.DEFAULT_BORDER_COLOR);
  }
  
  changeCard(newCard) {
    const frameKey = constants.CARD_FRAME(newCard);
    this.setTexture('cards', frameKey);
    this.cardData = newCard;
  }
}


export class TextButton extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {
      x = constants.X_MARGIN,
      text = '',
      width = constants.BUTTON_WIDTH,
      height = constants.BUTTON_HEIGHT,
      backgroundColor = 0x007bff,
      alpha = 0.8,
      textColor = '#ffffff',
      fontFamily = '"Noto Sans KR"',
      fontWeight = '700',
      fontStyle = 'bold',
      fontSize = '20px',
      radius = 8,
    } = options;
    
    super(scene, x, y);
    
    // 배경 Graphics
    this.bg = scene.add.graphics().
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRoundedRect(0, 0, width, height, radius).
      setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height), // 히트 영역 정의
        Phaser.Geom.Rectangle.Contains,                 // 포인터가 영역 안에 있는지 판단하는 함수
      );
    this.bg.input.cursor = 'pointer'; // 커서 손가락으로

    // 호버 효과
    this.bg.on('pointerover', () => this.#alphaEffect(1));
    this.bg.on('pointerout', () => this.#alphaEffect(alpha));

    // 텍스트
    this.label = scene.add.text(width / 2, height / 2, text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      color: textColor,
    }).setOrigin(0.5);
    
    // 컨테이너에 추가
    this.add(this.bg);
    this.add(this.label);
    scene.add.existing(this);
    
    // 크기 및 인터랙션 설정
    this.setSize(width, height);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height), // 히트 영역 정의
      Phaser.Geom.Rectangle.Contains ,                // 포인터가 영역 안에 있는지 판단하는 함수
    );
  }
  
  #alphaEffect(alpha) {
    this.scene.tweens.add({targets: this.bg, alpha: alpha, duration: 500, ease: 'Power2'})
  }
}


export class TextBox extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {
      x = constants.X_MARGIN,
      text = '',
      width = constants.TEXTBOX_WIDTH,
      height = constants.TEXTBOX_HEIGHT,
      backgroundColor = 0xffffff,
      alpha = 0,
      textColor = '#000000',
      fontFamily = '"Noto Sans KR"',
      fontWeight = '700',
      fontStyle = 'normal',
      fontSize = '18px',
      radius = 8,
    } = options;
    
    super(scene, x, y);
    
    // 배경 Graphics
    this.bg = scene.add.graphics().
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRoundedRect(0, 0, width, height, radius)

    // 텍스트
    this.label = scene.add.text(width / 2, height / 2, text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5);
    
    // 컨테이너에 추가
    this.add(this.bg);
    this.add(this.label);
    scene.add.existing(this);
  }
}


export class InformationBox extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {
      x = constants.X_MARGIN,
      labelText = '',
      dataText = '',
      width = constants.TEXTBOX_WIDTH,
      height = constants.TEXTBOX_HEIGHT,
      lineWidth = constants.TEXTBOX_BORDER_WIDTH,
      backgroundColor = 0x002060,
      alpha = 1,
      textColor = '#ffffff',
      fontFamily = '"Noto Sans KR"',
      fontWeight = '700',
      fontStyle = 'bold',
      fontSize = '18px',
    } = options;
    
    super(scene, x, y);
    
    // 배경 Graphics
    this.box1 = scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRect(0, 0, width / 2, height).
      strokeRect(0, 0, width / 2, height)
    this.box2 = scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).setAlpha(alpha).
      strokeRect(width / 2, 0, width / 2, height)

    // 텍스트
    this.label = scene.add.text(width / 4, height / 2, labelText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      color: textColor,
    }).setOrigin(0.5);
    
    this.data = scene.add.text(width * 3 / 4, height / 2, dataText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: 'normal',
      color: backgroundColor,
    }).setOrigin(0.5);
    
    // 컨테이너에 추가
    this.add(this.box1);
    this.add(this.box2);
    this.add(this.label);
    this.add(this.data);
    scene.add.existing(this);
  }
}
