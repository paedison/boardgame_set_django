const CSRFToken = document.cookie.split('; ').
    find(row => row.startsWith('csrftoken='))?.split('=')[1];

function getCardFrameKey(card) {
  return card ? `${card.color}_${card.shape}_${card.count}_${card.fill}` : 'empty';
}

const windowSettings = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND: 0xffffff,
  FONT_FAMILY: 'Noto Sans KR',
  MARGIN_X: 55,
  MARGIN_Y: 40,
}

const cardSettings = {
  FRAME_KEY: getCardFrameKey,
  WIDTH: 100,
  HEIGHT: 150,
  MARGIN: 30,
  BORDER_WIDTH: 4,
  BORDER_COLOR_DEFAULT: 0xeeeeee,
  BORDER_COLOR_SELECTED: 0x008800,
}

const buttonSettings = {
  WIDTH: 170,
  HEIGHT: 30,
  MARGIN: 10,
  TEXT_COLOR: '#ffffff',
  BACKGROUND_RESTART: 0x007bff,
  BACKGROUND_CHANGE: 0xc45816,
  BACKGROUND_HINT: 0x28a745,
}

const textboxSettings = {
  WIDTH: 170,
  HEIGHT: 30,
  MARGIN: 5,
  TEXT_COLOR_LABEL: '#ffffff',
  TEXT_COLOR_DATA: '#002060',
  BACKGROUND_COLOR: 0x002060,
  BORDER_WIDTH: 2,
}

export const settings = {
  BASE_URL: 'http://localhost:8000/api/game/',
  CSRFToken: CSRFToken,
  
  window: windowSettings,
  card: cardSettings,
  button: buttonSettings,
  textbox: textboxSettings,
};
