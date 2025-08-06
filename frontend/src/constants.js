const CSRFToken = document.cookie.split('; ').
    find(row => row.startsWith('csrftoken='))?.
    split('=')[1];

function getCardFrame(card) {
  return card ? `${card.color}_${card.shape}_${card.count}_${card.fill}` : 'empty';
}

export const constants = {
  BASE_URL: 'http://localhost:8000/api/game/',
  WINDOW_WIDTH: 700,
  WINDOW_HEIGHT: 800,
  
  BACKGROUND_COLOR: 0xffffff,
  DEFAULT_BORDER_COLOR: 0xeeeeee,
  SELECTED_BORDER_COLOR: 0x008800,
  HINTED_BORDER_COLOR: 0xff0000,
  // C_WHITE: (255, 255, 255),
  
  BORDER_WIDTH: 4,
  
  CARD_WIDTH: 100,
  CARD_HEIGHT: 150,
  CARD_PADDING: 30,
  CARD_ATTRS: ['color', 'shape', 'fill', 'count'],
  
  MESSAGE_BOX_WIDTH: 480,
  MESSAGE_BOX_HEIGHT: 250,
  CSRFToken: CSRFToken,
  
  CARD_FRAME: getCardFrame,
};
