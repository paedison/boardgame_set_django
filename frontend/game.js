const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#f0f0f0',
  scene: {
    preload,
    create
  }
};

const game = new Phaser.Game(config);

let selectedCards = [];
let cardSprites = [];

function preload() {
  // 카드 시트와 JSON 프레임 데이터 로딩
  this.load.atlas('cards', 'assets/cardsheet.png', 'assets/cardsheet.json');
}

function create() {
  const scene = this;

  // 카드 정보 API 호출
  fetch('/api/game/cards/')
    .then(res => res.json())
    .then(cards => {
      cards.forEach((card, index) => {
        const frameName = `${card.color}_${card.shape}_${card.number}_${card.fill}`;
        const x = 100 + (index % 5) * 120;
        const y = 100 + Math.floor(index / 5) * 180;

        const sprite = scene.add.sprite(x, y, 'cards', frameName).setInteractive();
        sprite.cardData = card;

        sprite.on('pointerdown', () => handleCardClick(sprite));
        cardSprites.push(sprite);
      });
    });

  // 다시 시작 버튼
  const restartBtn = this.add.text(650, 20, '🔄 다시 시작', {
    fontSize: '18px',
    backgroundColor: '#ddd',
    padding: { x: 10, y: 5 }
  }).setInteractive();

  restartBtn.on('pointerdown', () => {
    selectedCards.forEach(s => {
      s.clearTint();
      s.setScale(1);
    });
    selectedCards = [];
  });
}

function handleCardClick(sprite) {
  if (selectedCards.includes(sprite)) return;

  sprite.setScale(1.1);
  selectedCards.push(sprite);

  if (selectedCards.length === 3) {
    const ids = selectedCards.map(s => s.cardData.id);

    fetch('/api/game/validate-set/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_ids: ids })
    })
      .then(res => res.json())
      .then(data => {
        const tint = data.is_valid_set ? 0x00ff00 : 0xff0000;
        selectedCards.forEach(s => s.setTint(tint));

        setTimeout(() => {
          selectedCards.forEach(s => {
            s.clearTint();
            s.setScale(1);
          });
          selectedCards = [];
        }, 1000);
      });
  }
}