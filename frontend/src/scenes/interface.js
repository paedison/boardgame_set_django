/** @type {import('../types/phaser')} */

import {settings} from '../constants.js';

function getCardConstants(index, card) {
  const cardWidth = settings.card.WIDTH;
  const cardHeight = settings.card.HEIGHT;
  const cardPadding = settings.card.MARGIN;
  const x_margin = settings.window.MARGIN_X + settings.button.WIDTH + cardPadding;
  
  return {
    cardWidth: cardWidth,
    cardHeight: cardHeight,
    borderColor: settings.card.BORDER_COLOR_DEFAULT,
    borderWidth: settings.card.BORDER_WIDTH,
    
    x: x_margin + (index % 4) * (cardWidth + cardPadding),
    y: settings.window.MARGIN_Y + Math.floor(index / 4) * (cardHeight + cardPadding),
    frameKey: settings.card.FRAME_KEY(card),
  };
}

export class CardSprite extends Phaser.GameObjects.Image {
  constructor(scene, index, card) {
    const {
      cardWidth, cardHeight, borderColor,
      x, y, frameKey,
    } = getCardConstants(index, card);
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
      setDisplaySize(this.cardWidth - 4, this.cardHeight - 4);
    this.input.cursor = 'pointer';
    this.border = this.drawBorder(this.borderColor);
    return this;
  }
  
  toggleSelect() {
    this.selected = !this.selected;
    this.selected
      ? this.updateBorder(settings.card.BORDER_COLOR_SELECTED)
      : this.updateBorder(settings.card.BORDER_COLOR_DEFAULT);
  }
  
  drawBorder(color) {
    if (this.border) this.border.destroy(); // Clean up old border
    
    const border = this.scene.add.graphics();
    border.lineStyle(settings.card.BORDER_WIDTH, color);
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
      ? this.drawBorder(settings.card.BORDER_COLOR_SELECTED)
      : this.drawBorder(settings.card.BORDER_COLOR_DEFAULT);
  }
  
  deselect() {
    this.selected = false;
    this.updateBorder(settings.card.BORDER_COLOR_DEFAULT);
  }
  
  changeCard(newCard) {
    const frameKey = settings.card.FRAME_KEY(newCard);
    this.setTexture('cards', frameKey);
    this.cardData = newCard;
  }
}

function getThumbnailConstants(index, card) {
  const cardWidth = 50;
  const cardHeight = 73;
  const cardPadding = 10;
  
  return {
    cardWidth: cardWidth,
    cardHeight: cardHeight,
    borderColor: settings.card.BORDER_COLOR_DEFAULT,
    borderWidth: 2,
    
    x: settings.window.MARGIN_X + index * (cardWidth + cardPadding),
    y: settings.window.HEIGHT - settings.window.MARGIN_Y - cardHeight - 2 * settings.card.BORDER_WIDTH,
    // frameKey: 'green_diamond_1_open',
    frameKey: settings.card.FRAME_KEY(card),
  };
}

export class CardThumbnailSprite extends Phaser.GameObjects.Image {
  constructor(scene, index, card) {
    const {
      cardWidth, cardHeight, borderColor, borderWidth,
      x, y, frameKey,
    } = getThumbnailConstants(index, card);
    super(scene, x, y, 'cards_small', frameKey);
    
    this.index = index;
    this.cardData = card;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.borderColor = borderColor;
    this.borderWidth = borderWidth;
    this.selected = false;
    
    scene.add.existing(this);
  }
  
  setup() {
    this.setOrigin(0, 0).
      setPosition(this.x + 1, this.y + 1).
      setDisplaySize(this.cardWidth - 2, this.cardHeight - 2);
    this.border = this.drawBorder(this.borderColor);
    return this;
  }
  
  drawBorder(color) {
    if (this.border) {
      this.border.destroy(); // Clean up old border
    }
    const border = this.scene.add.graphics();
    border.lineStyle(this.borderWidth, color);
    border.strokeRect(this.x, this.y, this.cardWidth, this.cardHeight);
    return border;
  }
  
  changeCard(newCard) {
    const frameKey = settings.card.FRAME_KEY(newCard);
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 250,
      onComplete: () => {
        this.setTexture('cards_small', frameKey);
        this.cardData = newCard;
        this.scene.tweens.add({targets: this, alpha: 1, duration: 250});
      },
    });
  }
}

export class TextButton extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {x = settings.window.MARGIN_X} = options;
    super(scene, x, y);
    
    this.options = options;
    this.#draw();
    this.#hooverEffect();
    this.#add();
    
    scene.add.existing(this);
  }
  
  #draw() {
    const {
      text = '',
      width = settings.button.WIDTH,
      height = settings.button.HEIGHT,
      backgroundColor = settings.button.BACKGROUND_RESTART,
      alpha = 0.8,
      textColor = settings.button.TEXT_COLOR,
      fontFamily = settings.window.FONT_FAMILY,
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
      fontStyle: fontStyle,
      color: textColor,
    }).setOrigin(0.5);
  }
  
  #hooverEffect() {
    const {alpha = 0.8} = this.options;
    this.bg.input.cursor = 'pointer'; // 커서 손가락으로
    this.bg.on('pointerover', () => this.#alphaEffect(1));
    this.bg.on('pointerout', () => this.#alphaEffect(alpha));
    
    this.bg.on('pointerup', () => {
      this.bg.disableInteractive();
      this.scene.tweens.add({
        targets: this.bg, alpha: 0.5, duration: 250, yoyo: true,
        onComplete: () => this.bg.setInteractive(),
      });
      this.execute();
    });
  }
  
  #add() {
    this.add(this.bg);
    this.add(this.label);
    this.scene.add.existing(this);
  }
  
  #alphaEffect(alpha) {
    this.scene.tweens.add({targets: this.bg, alpha: alpha, duration: 500, ease: 'Power2'});
  }
  
  execute() {
    throw new Error('execute() must be implemented by subclass');
  }
}

export class TextBox extends Phaser.GameObjects.Container {
  constructor(scene, y, options = {}) {
    const {x = settings.window.MARGIN_X} = options;
    super(scene, x, y);
    
    this.options = options;
    this.#draw();
    this.#add();
    
    scene.add.existing(this);
  }
  
  #draw() {
    const {
      text = '',
      width = settings.textbox.WIDTH,
      height = settings.textbox.HEIGHT,
      backgroundColor = settings.window.BACKGROUND,
      alpha = 0,
      textColor = settings.textbox.TEXT_COLOR,
      fontFamily = settings.window.FONT_FAMILY,
      fontSize = '18px',
      radius = 8,
    } = this.options;
    
    this.bg = this.scene.add.graphics().
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRoundedRect(0, 0, width, height, radius);
    
    this.label = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: fontFamily,
      fontSize: fontSize,
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
    const {x = settings.window.MARGIN_X} = options;
    super(scene, x, y);
    
    this.options = options;
    this.#draw();
    this.#add();
    
    scene.add.existing(this);
  }
  
  #draw() {
    const {
      labelText = '',
      dataText = '',
      width = settings.textbox.WIDTH,
      height = settings.textbox.HEIGHT,
      lineWidth = settings.textbox.BORDER_WIDTH,
      backgroundColor = settings.textbox.BACKGROUND_COLOR,
      alpha = 1,
      textColorLabel = settings.textbox.TEXT_COLOR_LABEL,
      textColorData = settings.textbox.TEXT_COLOR_DATA,
      fontFamily = settings.window.FONT_FAMILY,
      fontStyle = 'bold',
      fontSize = '18px',
    } = this.options;
    
    this.labelBox = this.scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).
      fillStyle(backgroundColor).setAlpha(alpha).
      fillRect(0, 0, width / 2, height).
      strokeRect(0, 0, width / 2, height);
    
    this.dataBox = this.scene.add.graphics().
      lineStyle(lineWidth, backgroundColor).setAlpha(alpha).
      strokeRect(width / 2, 0, width / 2, height);
    
    this.label = this.scene.add.text(width / 4, height / 2, labelText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontStyle: fontStyle,
      color: textColorLabel,
    }).setOrigin(0.5);
    
    this.data = this.scene.add.text(width * 3 / 4, height / 2, dataText, {
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontStyle: 'normal',
      color: textColorData,
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
