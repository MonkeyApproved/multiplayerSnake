/**
 * @fileoverview
 * Multiplayer Tron-like game.
 * 
 * To try from hard-drive, open chrome in file access mode:
 * open GoogleChrome.app/ --args --allow-file-access-from-files
 * 
 * Created by Bastian Höltkemeier (monkey-approved.com)
 */

let gamejs = require('gamejs');
let draw = require('gamejs/graphics');
var font = require('gamejs/font');

let redRGB = 'rgb(255, 0, 0)';
let blueRGB = 'rgb(0, 0, 255)';
let greenRGB = 'rgb(0, 200, 0)';
let greyRGB = 'rgb(120, 120, 120)';
let grey2RGB = 'rgb(70, 70, 70)';
let goldRGB = 'rgb(212, 175, 55)';
let purpleRGB = 'rgb(128, 0, 128)';
let blackRGB = 'rgb(0, 0, 0)';
let yellowRGB = 'rgb(255, 220, 0)';
let whiteRGB = 'rgb(255, 255, 255)';

let maxPlayers = 6;
let playerColors = [redRGB, blueRGB, greenRGB, greyRGB, goldRGB, purpleRGB];
let playerActive = [true, true, false, false, true, false];
let playerNames = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6'];
let playerKeys = [[gamejs.event.K_LEFT, gamejs.event.K_RIGHT],
				  		[gamejs.event.K_q, gamejs.event.K_w],
						[gamejs.event.K_o, gamejs.event.K_p],
						[gamejs.event.K_y, gamejs.event.K_x],
						[gamejs.event.K_r, gamejs.event.K_t],
						[gamejs.event.K_n, gamejs.event.K_m]];
let players = new Array();
				  
let gameMode = 'menu';
let gameStatus = 'start';
let options = {
	doubleSpeed : false,
	blowUp : true,
	powerUps : false,
}

console.log('Starting...')

class Button {
	constructor(position, textSize, text, colors, boxSize = false, alignment = 1, textColor = blackRGB) {
		this.position = position;
		this.textSize = textSize;
		this.text = text;
		this.textColor = textColor
		this.colors = colors;
		this.alignment = alignment;
		this.boxSize = boxSize;
		this.buttonActive = false;
	}
	
	scaleSizes(display) {
		this.font = new font.Font(display.getRect().height * this.textSize + 'px Kirang Haerang');
		this.textRendered = this.font.render(this.text, this.textColor);
		let textX = this.textRendered.getRect().width;
		let textY = this.textRendered.getRect().height;
		let posX = display.getRect().width * this.position[0];
		let posY = display.getRect().height * this.position[1];
		let boxX = textX * 1.1;
		let boxY = textY * 1.1;
		if (this.boxSize) {
			boxX = this.boxSize[0] * display.getRect().width;
			boxY = this.boxSize[1] * display.getRect().height;
		}
		if (textX > boxX) {
			let scaledSize = Math.round(display.getRect().height * this.textSize * boxX / textX * 0.9);
			this.font = new font.Font(scaledSize + 'px Kirang Haerang');
			this.textRendered = this.font.render(this.text, this.textColor);
			textX = this.textRendered.getRect().width;
			textY = this.textRendered.getRect().height;
		}
		if (this.alignment == 0) {
			this.textPos = [posX - textX/2, posY - textY/2];
			this.boxRect = new gamejs.Rect([posX - boxX/2, posY - boxY/2], [boxX, boxY]);
		} else if (this.alignment == 1) {
			this.textPos = [posX - textX, posY - textY/2];
			this.boxRect = new gamejs.Rect([posX - boxX, posY - boxY/2], [boxX, boxY]);
		} else if (this.alignment == -1) {
			this.textPos = [posX, posY - textY/2];
			this.boxRect = new gamejs.Rect([posX, posY - boxY/2], [boxX, boxY]);
		}
	}
	
	buttonPressed() {
		this.buttonActive = !this.buttonActive;
	}
	
	checkMouse(mousePos, display) {
		let condiX = this.boxRect.left < mousePos[0] && mousePos[0] < this.boxRect.right;
		let condiY = this.boxRect.top < mousePos[1] && mousePos[1] < this.boxRect.bottom;
		if (condiX && condiY) {
			this.buttonPressed(display);
		}
	}
	
	show(display) {
		if (this.buttonActive) {
			draw.rect(display, this.colors[1], this.boxRect, 0);
		} else {
			draw.rect(display, this.colors[0], this.boxRect, 0);
		}
		display.blit(this.textRendered, this.textPos);
	}		
};

class pureText {
	constructor(position, textSize, text, alignment = 1, textColor = blackRGB, maxWidth = 0.9) {
		this.position = position;
		this.textSize = textSize;
		this.text = text;
		this.textColor = textColor;
		this.alignment = alignment;
		this.maxWidth = maxWidth
	}
	
	scaleSizes(display) {
		this.font = new font.Font(display.getRect().height * this.textSize + 'px Kirang Haerang');
		this.textRendered = this.font.render(this.text, this.textColor);
		let textX = this.textRendered.getRect().width;
		let textY = this.textRendered.getRect().height;
		let dispX = display.getRect().width;
		let posX = dispX * this.position[0];
		let posY = display.getRect().height * this.position[1];
		if (textX > dispX * this.maxWidth) {
			let scaledSize = Math.round(display.getRect().height * this.textSize / textX * dispX * this.maxWidth);
			this.font = new font.Font(scaledSize + 'px Kirang Haerang');
			this.textRendered = this.font.render(this.text, this.textColor);
			textX = this.textRendered.getRect().width;
			textY = this.textRendered.getRect().height;
		}
		if (this.alignment == 0) {
			this.textPos = [posX - textX/2, posY - textY/2];
		} else if (this.alignment == 1) {
			this.textPos = [posX - textX, posY - textY/2];
		} else if (this.alignment == -1) {
			this.textPos = [posX, posY - textY/2];
		}
	}
	
	show(display) {
		display.blit(this.textRendered, this.textPos);
	}	
}

class nameButton extends Button {
	
	buttonPressed(display) {
		this.text = prompt('please enter player name', this.text);
		this.scaleSizes(display);
	}
}

class selectButton extends Button {
	
	buttonPressed(display) {
		this.buttonActive = !this.buttonActive;
		if (this.buttonActive) {
			this.text = 'X';
			this.scaleSizes(display);
		} else {
			this.text = ' ';
			this.scaleSizes(display);
		}
	}
}

let specialKeys = ['<menu>','<m1>','<m2>','<br>','<m3>','<m4>','<m5>','<>',
						'<bs>','<tab>','<>','<>','<clr>','<ent>','<>','<>','<s>','<ctrl>','<alt>','<p>',
						'<sl>','<>','<>','<>','<>','<>','<>','<esc>','<>','<>','<>',
						'<>','<spa>','<pu>','<pd>','<end>','<home>','<left>',
						'<up>','<right>','<down>','<sel>','<pr>','<exe>','<snap>','<ins>',
						'<del>','<hlp>'];
						
function readableKey(key) {
	if (key < 48) {
		return specialKeys[key];
	} else {
		return String.fromCharCode(key);
	}
}

class keySelect extends Button {
	
	constructor(position, textSize, keyLeft, keyRight, colors, boxSize = false, alignment = 1) {
		super(position, textSize, '', colors, boxSize, alignment)
		this.state = 0;
		this.keyLeft = keyLeft;
		this.keyRight = keyRight;
		this.text = 'left: ' + readableKey(this.keyLeft) + ' right: ' + readableKey(this.keyRight);
		//this.text = 'left: ' + this.keyLeft + ' right: ' + this.keyRight;
	}
	
	keyDown(key, display) {
		if (this.state == 1) {
			this.keyLeft = key;
			this.text = 'press right key';
			this.scaleSizes(display);
			this.state = 2;
		} else if (this.state == 2) {
			this.keyRight = key;
			this.text = 'left: ' + readableKey(this.keyLeft) + ' right: ' + readableKey(this.keyRight);
			//this.text = 'left: ' + this.keyLeft + ' right: ' + this.keyRight;
			this.scaleSizes(display);
			this.state = 0;
		}
	}
	
	buttonPressed(display) {
		this.state = 1;
		this.text = 'press left key';
		this.scaleSizes(display);
	}
}
  
class Menu {
	
	constructor(display) {
		let text0 = new pureText([0.5, 0.07], 0.1, 'CLICK TO CHANGE:', 0, redRGB)
		let text1 = new pureText([0.34, 0.17], 0.06, 'NAME', 0, grey2RGB, 0.4);
		let text2 = new pureText([0.75, 0.17], 0.06, 'KEYS', 0, grey2RGB, 0.4);
		let text3 = new pureText([0.09, 0.17], 0.06, '?', 0, grey2RGB, 0.09);
		let text4 = new pureText([0.33, 0.85], 0.06, 'OPTIONS', 0, grey2RGB, 0.5);
		this.text = [text0, text1, text2, text3, text4];
		for (let i = 0; i < this.text.length; i++) {
			this.text[i].scaleSizes(display);
		}
	   this.nameButtons = new Array(6);
		this.keyButtons = new Array(6);
		this.selectButtons = new Array(6);
		this.startButton = new Button([0.8, 0.9], 0.1, 'START', [redRGB, blueRGB], [0.3, 0.16], 0);
		this.startButton.scaleSizes(display);
		this.doubleSpeed = new Button([0.13, 0.94], 0.05, '2X SPEED', [greyRGB, blueRGB], [0.18, 0.08], 0);
		this.doubleSpeed.scaleSizes(display);
		this.powerUps = new Button([0.33, 0.94], 0.05, 'POWER UPs', [greyRGB, blueRGB], [0.18, 0.08], 0);
		this.powerUps.scaleSizes(display);
		this.blowUp = new Button([0.53, 0.94], 0.05, 'BLOW UP', [greyRGB, blueRGB], [0.18, 0.08], 0);
		this.blowUp.scaleSizes(display);
		this.blowUp.buttonPressed();
	   for (let i = 0; i < maxPlayers; i++) {
		   this.nameButtons[i] = new nameButton([0.34, 0.25 + 0.1 * i], 0.05, playerNames[i],
															[playerColors[i], playerColors[i]], [0.4, 0.07], 0);
			this.nameButtons[i].scaleSizes(display);
		   this.keyButtons[i] = new keySelect([0.75, 0.25 + 0.1 * i], 0.05, playerKeys[i][0], playerKeys[i][1],
															[playerColors[i], playerColors[i]], [0.4, 0.07], 0);
			this.keyButtons[i].scaleSizes(display);
		   this.selectButtons[i] = new selectButton([0.09, 0.25 + 0.1 * i], 0.06, ' ',
															[playerColors[i], playerColors[i]], [0.08, 0.07], 0);
			this.selectButtons[i].scaleSizes(display);
			if (playerActive[i]) {
				this.selectButtons[i].buttonPressed(display);
			}				
	   }
	}
	
	scaleSizes(display) {
	   for (let i = 0; i < maxPlayers; i++) {
			this.nameButtons[i].scaleSizes(display);
			this.keyButtons[i].scaleSizes(display);
			this.selectButtons[i].scaleSizes(display);
	   }
		this.startButton.scaleSizes(display);
		this.doubleSpeed.scaleSizes(display);
		this.powerUps.scaleSizes(display);
		this.blowUp.scaleSizes(display);
		for (let i = 0; i < this.text.length; i++) {
			this.text[i].scaleSizes(display);
		}
	}
	
	checkMouse(mousePos, display) {
	   for (let i = 0; i < maxPlayers; i++) {
			this.nameButtons[i].checkMouse(mousePos, display);
			this.keyButtons[i].checkMouse(mousePos, display);
			this.selectButtons[i].checkMouse(mousePos, display);
	   }
		this.startButton.checkMouse(mousePos, display);
		this.doubleSpeed.checkMouse(mousePos, display);
		this.powerUps.checkMouse(mousePos, display);
		this.blowUp.checkMouse(mousePos, display);
	}
	
	keyDown(key, display) {
	   for (let i = 0; i < maxPlayers; i++) {
			this.keyButtons[i].keyDown(key, display);
	   }
	}
	
	show(display, inGameMenu, gameSurface) {
	   for (let i = 0; i < maxPlayers; i++) {
			this.nameButtons[i].show(display);
			this.keyButtons[i].show(display);
			this.selectButtons[i].show(display);
	   }
		this.startButton.show(display);
		this.doubleSpeed.show(display);
		this.powerUps.show(display);
		this.blowUp.show(display);
		for (let i = 0; i < this.text.length; i++) {
			this.text[i].show(display);;
		}
		if (this.startButton.buttonActive) {
			this.startNewGame(display, inGameMenu, gameSurface);
		}
	}
	
	startNewGame(display, inGameMenu, gameSurface) {
		gameMode = 'game';
		gameStatus = 'start';
	   let sizeX = display.getRect().width;
	   let sizeY = display.getRect().height;
		players = [];
	   for (let i = 0; i < maxPlayers; i++) {
			playerNames[i] = this.nameButtons[i].text;
			playerKeys[i] = [this.keyButtons[i].keyLeft, this.keyButtons[i].keyRight];
			playerActive[i] = this.selectButtons[i].buttonActive;
	   }
		for (let i = 0; i < maxPlayers; i++) {
			if (playerActive[i]) {
				players.push(new Player(playerKeys[i], playerColors[i], sizeX, sizeY, playerNames[i]));
			}
		}
		options.doubleSpeed = this.doubleSpeed.buttonActive;
		options.blowUp = this.blowUp.buttonActive;
		options.powerUps = this.powerUps.buttonActive;
		inGameMenu.updatePlayers(display);
		this.startButton.buttonActive = false;
		gameSurface.scaleSizes(display);
	}
}

class InGameMenu {
	
	constructor(display) {
		this.dispX = display.getRect().width;
		this.dispY = display.getRect().height;
		this.largeRect = new gamejs.Rect([0, 0], [this.dispX, 0.1 * this.dispY]);
		this.scoreBoard = [];
		this.scoreSpacing = 0.7 / players.length;
		this.pauseButton = new Button([0.775, 0.05], 0.06, 'PAUSE', [yellowRGB, redRGB], [0.14, 0.08], 0);
		this.pauseButton.scaleSizes(display);
		this.menuButton = new Button([0.925, 0.05], 0.06, 'MENU', [yellowRGB, redRGB], [0.14, 0.08], 0);
		this.menuButton.scaleSizes(display);
		for (let i = 0; i < players.length; i++) {
			let playerScore = new pureText([this.scoreSpacing * (i + 0.5), 0.025], 0.05,
													players[i].playerName, 0, players[i].color, this.scoreSpacing*0.9);
			playerScore.scaleSizes(display);
			this.scoreBoard.push(playerScore);
			playerScore = new pureText([this.scoreSpacing * (i + 0.5), 0.075], 0.05,
												players[i].score, 0, players[i].color, this.scoreSpacing*0.9);
			playerScore.scaleSizes(display);
			this.scoreBoard.push(playerScore);
		}
	}
	
	updatePlayers(display) {
		this.scoreBoard = [];
		this.scoreSpacing = 0.7 / players.length;
		for (let i = 0; i < players.length; i++) {
			let playerScore = new pureText([this.scoreSpacing * (i + 0.5), 0.025], 0.05,
													players[i].playerName, 0, players[i].color, this.scoreSpacing*0.9);
			playerScore.scaleSizes(display);
			this.scoreBoard.push(playerScore);
			playerScore = new pureText([this.scoreSpacing * (i + 0.5), 0.075], 0.05,
												players[i].score, 0, players[i].color, this.scoreSpacing*0.9);
			playerScore.scaleSizes(display);
			this.scoreBoard.push(playerScore);
		}
	}
	
	checkMouse(mousePos, display) {
	   this.pauseButton.checkMouse(mousePos, display);
		if (this.pauseButton.buttonActive) {
			gameStatus = 'pause';
		} else {
			gameStatus = 'normal';
		}
	   this.menuButton.checkMouse(mousePos, display);
		if (this.menuButton.buttonActive) {
			gameMode = 'menu';
			this.menuButton.buttonActive = false;
		}
	}
	
	scaleSizes(display) {
		this.pauseButton.scaleSizes(display);
		this.menuButton.scaleSizes(display);
		this.dispX = display.getRect().width;
		this.dispY = display.getRect().height;
		this.largeRect = new gamejs.Rect([0, 0], [this.dispX, 0.1 * this.dispY]);
		for (let i = 0; i < this.scoreBoard.length; i++) {
			this.scoreBoard[i].scaleSizes(display);
		}
	}
	
	show(display) {
		draw.rect(display, blackRGB, this.largeRect, 0);
		this.pauseButton.show(display);
		this.menuButton.show(display);
		for (let i = 0; i < this.scoreBoard.length; i++) {
			this.scoreBoard[i].show(display);
		}
	}
	
}

function Player(keys, color, width, height, playerName) {
	this.keys = keys;
	this.keyValues = [0, 0];
	this.color = color;
	this.radius = 2;
	this.speed = 1;
	this.position = [0.1 * width + Math.random() * width * 0.8,
					 0.2 * height + Math.random() * height * 0.7];
	this.angle = Math.random() * 2 * Math.PI;
	this.mode = 'curve';
	this.playerAlive = true;
	this.score = 0;
	this.playerName = playerName;
	this.nextGapIn = Math.round(300 + 500 * Math.random());
	this.gapSize = Math.round(10 + 10 * Math.random());
	
	this.resetPosition = function(width, height) {
		this.radius = 2;
		this.speed = 1;
		this.position = [0.1 * width + Math.random() * width * 0.8,
						 0.2 * height + Math.random() * height * 0.7];
		this.angle = Math.random() * 2 * Math.PI;
		this.playerAlive = true;
		this.nextGapIn = Math.round(300 + 500 * Math.random());
		this.gapSize = Math.round(10 + 10 * Math.random());
	}
	
	this.keyDown = function(key) {
	  if (key == this.keys[0]) {
		  this.keyValues[0] = 1;
	  } else if (key == this.keys[1]) {
		  this.keyValues[1] = -1;
	  }
	}
	
	this.keyUp = function(key) {
	  if (key == this.keys[0]) {
		  this.keyValues[0] = 0;
	  } else if (key == this.keys[1]) {
		  this.keyValues[1] = 0;
	  }
	}
	
	this.collisionLine = function(angle, radius, pixelArray) {
		for (let i = 0; i < radius; i++) {
			let posX = Math.round(this.position[0] + Math.cos(angle) * i);
			let posY = Math.round(this.position[1] - Math.sin(angle) * i);
			let color = pixelArray.get(posX, posY);
			if (color[0] + color[1] + color[2] == 0) {
				return false;
			}
		}
		return true;
	}
	
	this.checkCollision = function(pixelArray, width, height) {
		let angles = [this.angle, this.angle + Math.PI / 2, this.angle - Math.PI / 2];
		for (let i = 0; i < 3; i++) {
			if (this.collisionLine(angles[i], 6, pixelArray)) {
				this.playerAlive = false;
			};
		}
	}
	
	this.show = function(display) {
		if (this.playerAlive){
			this.nextGapIn--;
			this.angle += (this.keyValues[0] + this.keyValues[1]) * Math.PI / 100 / this.speed
			this.position = [this.position[0] + Math.cos(this.angle) * this.speed,
								  this.position[1] - Math.sin(this.angle) * this.speed];
			if (this.nextGapIn < 0) {
				this.gapSize--;
				if (this.gapSize < 0) {
					this.nextGapIn = Math.round(300 + 500 * Math.random());
					this.gapSize = Math.round(10 + 10 * Math.random());
				}
			} else {
				draw.circle(display, this.color, this.position, this.radius, 0);
			}
		} else {
			if (options.blowUp) {
				this.radius += 0.1;
				draw.circle(display, this.color, this.position, this.radius, 0);
			}
		}
	}
};

class gameSurface {
	constructor(display) {
	   this.sizeX = display.getRect().width;
	   this.sizeY = display.getRect().height;
		this.surface = new gamejs.graphics.Surface([this.sizeX, this.sizeY]);
		this.surface.fill('rgb(0, 0, 0)');
		this.startupText = new pureText([0.5, 0.5], 0.3, '5', 0, redRGB, 0.9);
		this.startupText.scaleSizes(display);
		this.timer = 251;
		this.pauseText = new pureText([0.5, 0.5], 0.3, '-PAUSE-', 0, redRGB, 0.9);
		this.pauseText.scaleSizes(display);
		this.winnerText = new pureText([0.5, 0.5], 0.3, 'player 1 won!!!', 0, redRGB, 0.9);
		this.winnerText.scaleSizes(display);
		draw.rect(this.surface, yellowRGB, new gamejs.Rect([0, 0.1 * this.sizeY], [this.sizeX, 0.9 * this.sizeY]), 5);
	}
	
	scaleSizes(display) {
	   this.sizeX = display.getRect().width;
	   this.sizeY = display.getRect().height;
		this.surface = new gamejs.graphics.Surface([this.sizeX, this.sizeY]);
		this.surface.fill('rgb(0, 0, 0)');
		this.startupText.scaleSizes(display);
		this.winnerText.scaleSizes(display);
		this.pauseText.scaleSizes(display);
		draw.rect(this.surface, yellowRGB, new gamejs.Rect([0, 0.1 * this.sizeY], [this.sizeX, 0.9 * this.sizeY]), 5);
		for (let player of players) {
			player.resetPosition(this.sizeX, this.sizeY);
		}
	}
	
	updateStartupText(display) {
		this.timer--;
		if (this.timer == 250) {
			this.startupText.text = '5';
			this.startupText.scaleSizes(display);
			this.scaleSizes(display);
			// draw a bit of line for every player, so they know where they start...
	    	for (let i = 0; i < players.length; i++) {
				for (let repeat = 0; repeat < 20; repeat++) {
		  	   	players[i].show(this.surface);
				}
	    	}
		} else if (this.timer == 200) {
			this.startupText.text = '4';
			this.startupText.scaleSizes(display);
		} else if (this.timer == 150) {
			this.startupText.text = '3';
			this.startupText.scaleSizes(display);
		} else if (this.timer == 100) {
			this.startupText.text = '2';
			this.startupText.scaleSizes(display);
		} else if (this.timer == 50) {
			this.startupText.text = '1';
			this.startupText.scaleSizes(display);
		} else if (this.timer == 0) {
			this.timer = 251;
			gameStatus = 'normal';
		}
	}
	
	checkForWinner(display, inGameMenu) {
		let winner = -1;
		let alive = 0;
		for (let i = 0; i < players.length; i++) {
			if (players[i].playerAlive) {
				winner = i;
				alive++;
			}
		}
		if (alive == 1) {
			gameStatus = 'win';
			this.winnerText.text = players[winner].playerName + ' won!!!';
			this.winnerText.textColor = players[winner].color;
			this.winnerText.scaleSizes(display);
			players[winner].score += 1;
			inGameMenu.updatePlayers(display)
		} else if (alive == 0) {
			gameStatus = 'win';
			this.winnerText.text = 'nobody won you idiots!!!';
			this.winnerText.scaleSizes(display);
		}
	}
	
	show(display, inGameMenu) {
		if (gameStatus == 'normal') {
			this.checkForWinner(display, inGameMenu);
			let pixelValues = new gamejs.graphics.SurfaceArray(this.surface);
	    	for (let i = 0; i < players.length; i++) {
	    	   players[i].checkCollision(pixelValues, this.sizeX, this.sizeY);
	  	   	players[i].show(this.surface);
				if (options.doubleSpeed) {
					players[i].show(this.surface);
				}
	    	}
			display.blit(this.surface);
		} else if (gameStatus == 'start') {
			this.updateStartupText(display);
			display.blit(this.surface);
			this.startupText.show(display);
		} else if (gameStatus == 'pause') {
			display.blit(this.surface);
			this.pauseText.show(display);
		} else if (gameStatus == 'win') {
			display.blit(this.surface);
			this.winnerText.show(display);
			this.timer--;
			if (this.timer < 0) {
				this.timer = 251;
				gameStatus = 'start';
			}
		}
	}
}

function main() {
   // --- define all graphics elements --- //
   let display = gamejs.display.getSurface();
   gamejs.display.setCaption("MONKEY GAMES: Don't crash!!!");
   let sizeX = display.getRect().width;
   let sizeY = display.getRect().height;
	
	for (let i = 0; i < maxPlayers; i++) {
		if (playerActive[i]) {
			players.push(new Player(playerKeys[i], playerColors[i], sizeX, sizeY, playerNames[i]));
		}
	}
	
	let surface = new gameSurface(display);
	let gameMenu = new Menu(display);
	let inGameMenu = new InGameMenu(display);
  
   // --- the following functions are used by the gameJS library --- //
   gamejs.event.onDisplayResize(function(event) {
  	   sizeX = display.getRect().width;
  	   sizeY = display.getRect().height;
		gameMenu.scaleSizes(display);
		inGameMenu.scaleSizes(display);
		surface.scaleSizes(display);
   });
	
   gamejs.event.onMouseDown(function(event) {
	   if (gameMode == 'menu') {
			gameMenu.checkMouse(event.pos, display);
	   } else if (gameMode == 'game') {
	   	inGameMenu.checkMouse(event.pos, display);
	   }
   });

   gamejs.event.onKeyDown(function(event) {
	   if (gameMode == 'game') {
		   for (let i = 0; i < players.length; i++) {
			   players[i].keyDown(event.key);
		   }
	   } else if (gameMode == 'menu') {
	   	gameMenu.keyDown(event.key, display);
	   }
   });
  
   gamejs.event.onKeyUp(function(event) {
	   if (gameMode == 'game') {
		   for (let i = 0; i < players.length; i++) {
			   players[i].keyUp(event.key);
		   }
	   }
   });
	
   gamejs.onTick(function() {
		if (gameMode == 'game') {
			display.clear();
			surface.show(display, inGameMenu);
			inGameMenu.show(display);
			for (player of players) {
				if (player.playerAlive) {
					draw.circle(display, yellowRGB, player.position, player.radius, 0);
				}
			}
		} else if (gameMode == 'menu') {
			display.fill('rgb(0, 0, 0)');
			gameMenu.show(display, inGameMenu, surface);
		}
   });
};

// gamejs.ready will call your main function
// once all components and resources are ready.
gamejs.ready(main);
