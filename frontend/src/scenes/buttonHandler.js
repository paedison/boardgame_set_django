import {settings} from '../constants.js';
import {TextButton} from './interface.js';

function changeCards(scene, gameStart = true) {
  let cardSprites = scene.cardSprites;
  fetch(`${settings.BASE_URL}draw/?game_start=${gameStart || ''}`).
    then(res => res.json()).
    then(data => {
      const {newCards} = data;
      scene.tweens.add({
        targets: cardSprites, alpha: 0, duration: 500, ease: 'Power2',
        onComplete: () => {
          cardSprites.forEach((cardSprite, index) => cardSprite.changeCard(newCards[index]));
          scene.tweens.add({targets: cardSprites, alpha: 1, duration: 500, ease: 'Power2'});
        },
      });
    }).
    catch(error => console.error('게임 시작 데이터 요청 실패:', error));
  
  scene.cardSprites.forEach(cardSprite => cardSprite.deselect());
}

export class RestartButton extends TextButton {
  execute() {
    changeCards(this.scene);
    this.scene.initiateAllRecords();
  }
}

export class CardChangeButton extends TextButton {
  execute() {
    changeCards(this.scene);
    this.scene.initiateSelectRecords();
  }
}

export class HintButton extends TextButton {
  execute() {
    this.scene.hintSets.length === 0 ? this.requestHint() : this.showHint();
  }
  
  requestHint() {
    let cardSprites = this.scene.cardSprites;
    
    fetch(`${settings.BASE_URL}hint/`).
      then(res => res.json()).
      then(data => {
        const {possibleSets, newCards} = data;
        
        if (possibleSets.length === 0) {
          if (newCards.length === 0) {
            this.scene.addLog('남은 카드가 없습니다.', 'fail');
            this.scene.scene.pause();
            this.scene.scene.launch('GameOverScene', {
              score: this.scene.score
            });
          } else {
            this.scene.addLog('세트가 없습니다.', 'fail');
            this.scene.tweens.add({
              targets: cardSprites, alpha: 0, duration: 500, ease: 'Power2',
              onComplete: () => {
                cardSprites.forEach((cardSprite, index) => cardSprite.changeCard(newCards[index]));
                this.scene.tweens.add({targets: cardSprites, alpha: 1, duration: 500, ease: 'Power2'});
              },
            });
          }
        } else {
          this.scene.hintSets = possibleSets; // [[id1, id2, id3], [id4, id5, id6], ...]
          this.showHint();
        }
      });
  }
  
  showHint() {
    this.scene.hintUsedCount += 1;
    this.scene.addLog(`세트가 ${this.scene.hintSets.length}개 있습니다.`, 'success');
    this.scene.hintUsedCountBox.data.setText(`${this.scene.hintUsedCount}`);
    this.showHintSprites();
  }
  
  showHintSprites() {
    let hintSprites = [];
    this.scene.hintSets.forEach(hintSet => {
      let spriteIds = [];
      hintSet.forEach(cardId => {
        this.scene.cardSprites.forEach(cardSprite => {
          if (cardSprite.cardData.id === cardId) spriteIds.push(cardSprite.index);
        });
      });
      hintSprites.push(spriteIds);
    });
    console.log(hintSprites);
  }
}

export class RestartGameButton extends TextButton {
  execute() {
    const cameras = this.scene.cameras;
    const scene = this.scene.scene;
    
    cameras.main.fadeOut(250, 255, 255, 255);
    cameras.main.once('camerafadeoutcomplete', () => {
      scene.stop('MainScene');
      scene.stop();
      scene.start('MainScene');
    });
  }
}
