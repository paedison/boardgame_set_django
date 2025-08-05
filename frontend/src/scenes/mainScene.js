import { constants } from "../constants.js";

class CardSprite extends Phaser.GameObjects.Image {
    constructor(scene, index, card) {
        const cardWidth = constants.CARD_WIDTH;
        const cardHeight = constants.CARD_HEIGHT;
        const cardPadding = constants.CARD_PADDING;

        const x = cardWidth + (index % 4) * (cardWidth + cardPadding);
        const y = cardHeight + Math.floor(index / 4) * (cardHeight + cardPadding);
        const frameKey = `${card.color}_${card.shape}_${card.count}_${card.fill}`

        super(scene, x, y, "cards", frameKey);

        this.x = x;
        this.y = y;
        this.cardWidth = cardWidth
        this.cardHeight = cardHeight;
        this.cardData = card;
        this.selected = false;

        this.setInteractive();
        this.setDisplaySize(this.cardWidth, this.cardHeight);
        this.getDefaultBorder();
        this.on("pointerdown", () => this.toggleSelect());

        scene.add.existing(this);
    }

    toggleSelect() {
        this.selected = !this.selected;
        this.updateBorder();
        this.scene.handleCardSelection(this);
    }

    drawCardBorder(lineWidth, color) {
        this.border = this.scene.add.graphics();
        this.border.lineStyle(lineWidth, color);
        this.border.strokeRect(
            this.x - this.cardWidth / 2 - 5,
            this.y - this.cardHeight / 2 - 5,
            this.cardWidth + 10,
            this.cardHeight + 10,
        );
    }

    getDefaultBorder() {
        this.drawCardBorder(4, 0xeeeeee);
    }

    updateBorder() {
        if (this.border) {
            this.border.destroy();
            this.getDefaultBorder();
        }

        if (this.selected) {
            this.drawCardBorder(4, 0x008800);
        }
    }

    deselect() {
        this.selected = false;
        if (this.border) this.border.destroy();
    }
}

export class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
        this.resetProperties();
    }

    resetProperties() {
        this.cardSprites = [];
        this.selectedCardSprites = [];
        this.hintSets = [];
        this.hintIndex = 0;
        this.score = 0;
        this.logMessages = [];
    }

    preload() {
        this.load.atlas("cards", "assets/cardsheet.png", "assets/cardsheet.json");
    }

    create() {
        this.createInitialSprites();
        this.createRestartButton();
        this.createHintButton();

        this.hintText = this.add.text(1180, 110, '', {
            fontSize: '18px',
            fill: '#000000',
        });

        this.logText = this.add.text(700, 300, '', {
            fontSize: '18px',
            color: '#000000',
            lineSpacing: 18,
            wordwrap: {width: 400},
        });

        this.scoreText = this.add.text(
            1000, 20, "Score: 0", {fontSize: "24px", fill: "000"}
        );
    }

    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logMessages.push(`[${timestamp}] ${message}`);

        // 최근 5개만 표시
        if (this.logMessages.length > 5) this.logMessages.shift();
        this.logText.setText(this.logMessages.join('\n'));
    }

    createInitialSprites() {
        fetch(`${constants.BASE_URL}start/`)
            .then(res => res.json())
            .then(cards => this.createNewSprites(cards));
    }

    createNewSprites(cards) {
        cards.forEach((card, index) => {
            const sprite = new CardSprite(this, index, card);
            this.cardSprites.push(sprite);
        });
    }

    createRestartButton() {
        const restartButton = this.add.text(1000, 50, '🔄 다시 시작하기', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#007bff',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        restartButton.on('pointerdown', async () => {
            restartButton.disableInteractive();

            this.tweens.add({
                targets: restartButton,
                alpha: 0.5,
                duration: 300,
                yoyo: true,
            });

            this.resetProperties();
            this.logText.setText('');

            // 1. 기존 카드 fade out
            this.tweens.add({
                targets: this.cardSprites,
                alpha: 0,
                duration: 500,
                onComplete: async () => {
                    // 2. 기존 카드 제거
                    this.cardSprites.forEach(sprite => sprite.destroy());
                    this.cardSprites = [];

                    try {
                        // 3. 서버에서 새 카드 데이터 요청
                        const response = await fetch(`${constants.BASE_URL}start/`);
                        const cards = await response.json();

                        // 4. 새 카드 생성 (초기 alpha: 0)
                        cards.forEach((card, index) => {
                            const sprite = new CardSprite(this, index, card);
                            sprite.setAlpha(0).setInteractive();
                            this.cardSprites.push(sprite);

                            // 5. 카드 fade in 애니메이션
                            this.tweens.add({
                                targets: sprite,
                                alpha: 1,
                                duration: 500,
                                ease: 'Linear',
                            });
                        });

                        // 점수 등 다른 UI도 업데이트 가능
                        // playerScore.setText(`점수: ${data.score}`);
                    } catch (error) {
                        console.error('게임 시작 데이터 요청 실패:', error);
                    }
                    restartButton.setInteractive();
                }
            });
        });
    }

    createHintButton() {
        const hintButton = this.add.text(1000, 100, '💡 힌트 보기', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        hintButton.on('pointerdown', () => {
            this.hintSets.length === 0 ? this.requestHints() : this.showNextHint();
        });
    }

    requestHints() {
        fetch(`${constants.BASE_URL}hint/`)
            .then(res => res.json())
            .then(data => {
                const possibleSets = data.possible_sets;
                if (possibleSets.length === 0) {
                    this.addLog('❌ 세트가 없습니다. 카드를 교체합니다!');
                    this.replaceCards(data.newCards);
                } else {
                    this.hintSets = possibleSets; // [[id1, id2, id3], [id4, id5, id6], ...]
                    this.hintIndex = 0;
                    this.showNextHint();
                }
            });
    }

    showNextHint() {
        const hintIndex = this.hintIndex
        const currentHint = this.hintSets[hintIndex];
        const hintCount = this.hintSets.length

        this.hintText.setText(`힌트 ${hintIndex + 1}/${hintCount}`);
        this.highlightHint(currentHint);
        this.hintIndex = (hintIndex + 1) % hintCount; // 순환

        this.addLog('✅ 가능한 세트를 표시했습니다');
    }

    highlightHint(currentHint) {
        this.cardSprites.forEach(sprite => {
            if (currentHint.includes(sprite.cardData.id)) {
                sprite.drawCardBorder(4, 0xff0000);
            } else {
                sprite.border.destroy();
                sprite.getDefaultBorder();
            }
        });
    }

    replaceCards(newCards) {
        // Fade out 기존 카드
        this.tweens.add({
            targets: this.cardSprites,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.cardSprites.forEach(sprite => sprite.destroy());
                this.cardSprites = [];

                // 새 카드 생성
                newCards.forEach((card, index) => {
                    const sprite = new CardSprite(this, index, card);
                    sprite.setAlpha(0).setInteractive();
                    this.cardSprites.push(sprite);

                    this.tweens.add({
                        targets: sprite,
                        alpha: 1,
                        duration: 500
                    });
                });

                this.hintSets = [];
                this.hintIndex = 0;
                this.hintText.setText('');
            }
        });
    }

    async handleCardSelection(cardSprite) {
        let selected = this.selectedCardSprites;
        if (cardSprite.selected) {
            selected.push(cardSprite);
        } else {
            selected.pop(cardSprite);
        }

        if (selected.length === 3) {
            const cardIds = this.getCardIds(selected);

            try {
                const response = await fetch(`${constants.BASE_URL}validate/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': constants.CSRFToken,
                    },
                    body: JSON.stringify({ 'cardIds': cardIds })
                });

                const result = await response.json();
                const newCards = result.newCards;

                if (newCards.length === 3) {
                    this.score += 1;
                    this.scoreText.setText(`Score: ${this.score}`);

                    // 카드 교체
                    selected.forEach((cardSprite, i) => {
                        const newCard = newCards[i];
                        const frameKey = getCardFrame(newCard);
                        cardSprite.setTexture('cards', frameKey);
                        cardSprite.cardData = newCard;
                        cardSprite.deselect();
                    });
                    this.hintSets = [];
                    this.addLog('✅ 세트 성공!');
                } else {
                    selected.forEach(c => c.deselect());
                    this.addLog('❌ 세트 실패');
                }
                this.selectedCardSprites = [];
                this.hintIndex = 0;

            } catch (err) {
                console.error('서버 통신 오류:', err);
            }
        }
    }

    getCardIds(sprites) {
        return sprites.map(cs => cs.cardData.id);
    }
}

function getCardFrame(card) {
    return `${card.color}_${card.shape}_${card.count}_${card.fill}`;
}
