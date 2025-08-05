const CSRFToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

export const constants = {
    BASE_URL: 'http://localhost:8000/api/game/',
    WINDOW_WIDTH: 1280,
    WINDOW_HEIGHT: 720,

    BACKGROUND_COLOR: "#FFF",
    // C_WHITE: (255, 255, 255),

    CARD_WIDTH: 120,
    CARD_HEIGHT: 160,
    CARD_PADDING: 40,
    CARD_ATTRS: ["color", "shape", "fill", "count"],

    MESSAGE_BOX_WIDTH: 480,
    MESSAGE_BOX_HEIGHT: 250,
    CSRFToken: CSRFToken,
}
