import { generateDeck } from "./deck.js";
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
        this.selectedCards = [];
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
        console.log(this.logMessages);
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
            this.hintSets.length === 0 ? this.requestHints() : this.showNextHint()
        });
    }

    requestHints() {
        fetch(`${constants.BASE_URL}hint/`)
            .then(res => res.json())
            .then(data => {
                const possibleSets = data.possible_sets;
                if (possibleSets.length === 0) {
                    this.addLog('❌ 세트가 없습니다. 카드를 교체합니다!');
                    // this.messageText.setText('❌ 세트가 없습니다. 카드를 교체합니다!');
                    this.replaceCards(data.new_cards);
                } else {
                    this.hintSets = possibleSets; // [[id1, id2, id3], [id4, id5, id6], ...]
                    this.hintIndex = 0;
                    this.showNextHint();
                }
            });
    }

    showNextHint() {
        const hintSets = this.hintSets
        const hintIndex = this.hintIndex
        const currentHint = hintSets[hintIndex];

        this.hintText.setText(`힌트 ${hintIndex + 1}/${hintSets.length}`);
        this.addLog('✅ 가능한 세트를 표시했습니다');

        this.highlightHint(currentHint);
        this.hintIndex = (hintIndex + 1) % hintSets.length; // 순환
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

                    // const x = 100 + (index % 4) * 150;
                    // const y = 100 + Math.floor(index / 4) * 200;
                    //
                    // const sprite = this.add.sprite(x, y, 'cards', card.frame_name)
                    //     .setAlpha(0)
                    //     .setInteractive();
                    // sprite.cardData = card;
                    // cardSprites.push(sprite);

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
    //
    // replaceCards(newCards) {
    //     this.cardSprites.forEach(sprite => sprite.destroy());
    //     this.cardSprites = [];
    //     this.createNewSprites(newCards);
    // }

    handleCardSelection(cardSprite) {
        if (cardSprite.selected) {
            this.selectedCards.push(cardSprite);
        } else {
            this.selectedCards = this.selectedCards.filter(c => c !== cardSprite);
        }

        if (this.selectedCards.length === 3) {
            setTimeout(() => {
                const isSet = this.checkSet(this.selectedCards.map(c => c.cardData));
                if (isSet) {
                    this.score += 1;
                    console.log("✅ 세트 성공! 점수:", this.score);
                    this.selectedCards.forEach(c => c.deselect());
                    this.selectedCards = [];
                    // TODO: 세트 카드 교체 로직
                } else {
                    console.log("❌ 세트 실패");
                    this.selectedCards.forEach(c => c.deselect());
                    this.selectedCards = [];
                }
            }, 500);
        }
    }

    checkSet(cards) {
        return constants.CARD_ATTRS.every(attr => {
            const values = cards.map(c => c[attr]);
            const unique = new Set(values);
            return unique.size === 1 || unique.size === 3;
        });
    }
}

function getCardFrame(card) {
    return `${card.color}_${card.shape}_${card.count}_${card.fill}`;
}
