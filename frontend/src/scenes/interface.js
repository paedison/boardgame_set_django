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
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.borderColor = borderColor;
    this.selected = false;
    
    scene.add.existing(this);
  }
  
  setup() {
    this.setOrigin(0, 0).setInteractive().
      setPosition(this.x + 2, this.y + 2).
      setDisplaySize(this.cardWidth - 4, this.cardHeight - 4)
    this.input.cursor = 'pointer';
    this.border = this.drawBorder(this.borderColor);
    return this
  }
  
  toggleSelect() {
    this.selected = !this.selected;
    this.selected
      ? this.updateBorder(constants.SELECTED_BORDER_COLOR)
      : this.updateBorder(constants.DEFAULT_BORDER_COLOR)
  }
  
  drawBorder(color) {
    const border = this.scene.add.graphics();
    border.lineStyle(constants.CARD_BORDER_WIDTH, color);
    border.strokeRect(this.x, this.y, this.cardWidth, this.cardHeight);
    return border;
  }
  
  updateBorder(finalColor) {
    if (finalColor !== this.borderColor) {
      this.scene.tweens.add({
        targets: this.border, alpha: 0, duration: 250,
        oncomplete: () => {
          this.border.clear();
          this.border = this.drawBorder(finalColor).setAlpha(0);
          this.borderColor = finalColor;
          this.scene.tweens.add({targets: this.border, alpha: 1, duration: 250});
        },
      });
    }
  }
  
  checkBorder() {
    this.selected
      ? this.drawBorder(constants.SELECTED_BORDER_COLOR)
      : this.drawBorder(constants.DEFAULT_BORDER_COLOR)
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
    const {x = constants.X_MARGIN} = options;
    super(scene, x, y);

    this.options = options;
    this.#draw();
    this.#hooverEffect();
    this.#add();
  }

  #draw() {
    const {
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
    } = this.options;

    this.bg = this.scene.add.graphics().
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRoundedRect(0, 0, width, height, radius).
      setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height), // 히트 영역 정의
        Phaser.Geom.Rectangle.Contains,                 // 포인터가 영역 안에 있는지 판단하는 함수
      );

    // 텍스트
    this.label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      color: textColor,
    }).setOrigin(0.5);
  }
  
  #hooverEffect() {
    const {alpha = 0.8} = this.options;
    this.bg.input.cursor = 'pointer'; // 커서 손가락으로
    this.bg.on('pointerover', () => this.#alphaEffect(1));
    this.bg.on('pointerout', () => this.#alphaEffect(alpha));
  }
  
  #add() {
    this.add(this.bg);
    this.add(this.label);
    this.scene.add.existing(this);
  }
  
  #alphaEffect(alpha) {
    this.scene.tweens.add({targets: this.bg, alpha: alpha, duration: 500, ease: 'Power2'})
  }
}


export class TextBox extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {x = constants.X_MARGIN} = options;
    super(scene, x, y);

    this.options = options;
    this.#draw();
    this.#add();
  }
  
  #draw() {
    const {
      text = '',
      width = constants.TEXTBOX_WIDTH,
      height = constants.TEXTBOX_HEIGHT,
      backgroundColor = 0xffffff,
      alpha = 0,
      textColor = '#000000',
      fontFamily = '"Noto Sans KR"',
      fontWeight = '700',
      fontSize = '18px',
      radius = 8,
    } = this.options;

    this.bg = this.scene.add.graphics().
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRoundedRect(0, 0, width, height, radius)

    this.label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5);
  }
  
  #add() {
    this.add(this.bg);
    this.add(this.label);
    this.scene.add.existing(this);
  }
}


export class InformationBox extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {x = constants.X_MARGIN} = options;
    super(scene, x, y);

    this.options = options;
    this.#draw();
    this.#add();
  }
  
  #draw() {
      const {
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
    } = this.options;

  this.labelBox = this.scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRect(0, 0, width / 2, height).
      strokeRect(0, 0, width / 2, height)

    this.dataBox = this.scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).setAlpha(alpha).
      strokeRect(width / 2, 0, width / 2, height)

    this.label = this.scene.add.text(width / 4, height / 2, labelText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      color: textColor,
    }).setOrigin(0.5);
    
    this.data = this.scene.add.text(width * 3 / 4, height / 2, dataText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: 'normal',
      color: backgroundColor,
    }).setOrigin(0.5);
  }
  
  #add() {
    this.add(this.labelBox);
    this.add(this.dataBox);
    this.add(this.label);
    this.add(this.data);
    this.scene.add.existing(this);
  }
}
