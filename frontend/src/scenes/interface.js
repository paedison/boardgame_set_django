/** @type {import('../types/phaser')} */

import {constants} from '../constants.js';

export class CardSprite extends Phaser.GameObjects.Image {
  constructor(scene, index, card) {
    const windowWidth = constants.WINDOW_WIDTH;
    const cardWidth = constants.CARD_WIDTH;
    const cardHeight = constants.CARD_HEIGHT;
    const cardPadding = constants.CARD_PADDING;
    const borderColor = constants.DEFAULT_BORDER_COLOR;
    
    const x_margin = (windowWidth - cardWidth * 3 - cardPadding * 3) / 2;
    const x = x_margin + (index % 4) * (cardWidth + cardPadding);
    const y = cardHeight + Math.floor(index / 4) * (cardHeight + cardPadding);
    const frameKey = constants.CARD_FRAME(card);
    
    super(scene, x, y, 'cards', frameKey);
    
    this.index = index;
    this.cardData = card;
    this.x = x;
    this.y = y;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.selected = false;
    
    this.borderColor = borderColor;
    this.border = this.drawCardBorder(borderColor);
    
    this.setInteractive();
    this.setDisplaySize(this.cardWidth, this.cardHeight);
    this.on('pointerdown', () => this.toggleSelect());
    
    scene.add.existing(this);
  }
  
  toggleSelect() {
    this.selected = !this.selected;
    const finalColor = this.selected ? constants.SELECTED_BORDER_COLOR : constants.DEFAULT_BORDER_COLOR;
    this.updateBorder(finalColor);
    this.scene.handleCardSelection(this).then(() => {});
  }
  
  drawCardBorder(color) {
    const border = this.scene.add.graphics();
    border.lineStyle(constants.BORDER_WIDTH, color);
    border.strokeRect(
      this.x - this.cardWidth / 2 - 5,
      this.y - this.cardHeight / 2 - 5,
      this.cardWidth + 10,
      this.cardHeight + 10,
    );
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
  
  deselect() {
    this.selected = false;
    this.updateBorder(constants.DEFAULT_BORDER_COLOR);
  }
}

export class GameButton extends Phaser.GameObjects.Text {
  constructor(scene, x, y, label, options = {}) {
    const fontSize = options.fontSize || '20px';
    const color = options.color || '#ffffff';
    const alpha = options.alpha || 0.8;
    const backgroundColor = options.backgroundColor || '#333333';
    const padding = options.padding || {x: 10, y: 5};
    
    super(scene, x, y, label, {
      fontFamily: 'Noto',
      fontSize: fontSize,
      color: color,
      padding: padding,
      backgroundColor: backgroundColor,
      align: 'center',
    });
    
    scene.add.existing(this);
    this.setAlpha(alpha);
    this.setInteractive({useHandCursor: true});
    
    // 호버 효과
    this.on('pointerover', () => this.alphaEffect(1));
    this.on('pointerout', () => this.alphaEffect(alpha));
  }
  
  alphaEffect(alpha) {
    this.scene.tweens.add({targets: this, alpha: alpha, duration: 500, ease: 'Power2'})
  }
}
