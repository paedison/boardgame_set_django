export function generateDeck(forTest = false) {
    const colors = ['red', 'green', 'purple'];
    const shapes = ['oval', 'squiggle', 'diamond'];
    const counts = [1, 2, 3];
    const fills = ['solid', 'striped', 'open'];

    const deck = [];

    for (const c of colors) {
        for (const s of shapes) {
            for (const n of counts) {
                for (const f of fills) {
                    deck.push({ color: c, shape: s, count: n, fill: f });
                }
            }
        }
    }

    if (forTest) {
        return Phaser.Utils.Array.Shuffle(deck).slice(0, 12);
    }

    return deck;
}
