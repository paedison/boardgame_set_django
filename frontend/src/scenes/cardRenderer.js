export function renderCard(scene, x, y, card) {
    const cardWidth = 140;
    const cardHeight = 190;
    const key = getCardKey(card);

    // const frame = scene.add.graphics({
    //     lineStyle: {width: 1, color: 0x555555},
    //     fillStyle: {color: 0x555555, alpha: 1},
    //     fillRoundedRect: {x: x, y: y, width: cardWidth, height: cardHeight, radius: 10},
    //     strokeRoundedRect: {x: x, y: y, width: cardWidth, height: cardHeight, radius: 10},
    // });

    const frame = scene.add.graphics();
    frame.fillStyle(0xffffff, 1);
    frame.fillRoundedRect(x, y, cardWidth, cardHeight, 10);
    frame.lineStyle(1, 0x555555);
    frame.strokeRoundedRect(x, y, cardWidth, cardHeight, 10);

    const offsetX = x + cardWidth / 2;
    const offsetY = y + cardHeight / 2;
    scene.add.image(offsetX, offsetY, 'cards', key).setScale(0.8);
}

function getCardKey(card) {
    return `${card.color}_${card.shape}_${card.count}_${card.fill}`;
}
