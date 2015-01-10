/*
 
 Copyright (c) 2010 Doug McInnes
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 
 */

//=====================
// Key input code
//=====================

KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    68: 'd',
    81: 'q',
    83: 's',
    87: 'w',
}

var onKeyUp = function (key) {
    
};

// Is there a key press?
KEY_STATUS = { keyDown:false };
// Init all keys to not pressed
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
}

// Handle key inputs on window
$(window).keydown(function (e) {
  KEY_STATUS.keyDown = true;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
}).keyup(function (e) {
  KEY_STATUS.keyDown = false;
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
    onKeyUp(e.keyCode);
  }
});

//=========================
// Firebase Connection Code
//=========================

var baseURL = 'https://shining-heat-133.firebaseio.com/';

// Representation of firebase data glob
var baseData = new Firebase(baseURL);

var myChar = baseData.child('players').push();
myChar.onDisconnect().remove();

//=======================
// References to HTML
//=======================

var canvas = $("#canvas");
var context = canvas[0].getContext("2d");

//===============
// Sound FX
//===============

SFX = {
chirp:     new Audio('mp3/02chirp.mp3'),
music1:    new Audio('mp3/orangefreesounds_magic-bells-music-loop.mp3'),
music2:    new Audio('mp3/frankum_electronic-music-loop-002-v2.mp3')
};

StopFX = {};

var musicType = 0;

// preload audio
for (var sfx in SFX) {
    (function () {
        var audio = SFX[sfx];
        audio.load();
        if(sfx.indexOf('music') === 0) {
            audio.addEventListener('ended', function() {
                audio.currentTime = 0;
                audio.play();
            }, true);
        }
     
        StopFX[sfx] = function() {
            audio.pause();
            audio.currentTime = 0;
        }
     
        SFX[sfx] = function () {
            if (!this.muted) {
                audio.play();
                audio.muted = false;
                audio.currentTime = 0;
            }
            return audio;
        }
     })();
}

SFX.changeMusic = function() {
    if(musicType == 0) {
        StopFX.music1();
        SFX.music2();
        musicType = 1;
    }
    else {
        StopFX.music2();
        SFX.music1();
        musicType = 0;
    }
}

SFX.muted = false;

//=======================
// Camera
//=======================

Camera = function() {
    this.x = 0;
    this.y = 0;
    
    this.render = function(asset, posx, posy, rot) {
        context.save();
        context.translate(posx - this.x, posy - this.y);
        context.rotate(rot);
        context.drawImage(asset, -asset.width/2, -asset.height/2);
        context.restore();
    };
    
    this.getPositionInCameraSpace = function(posx, posy) {
        var ret = {x: posx, y:posy};
        ret.x -= this.x;
        ret.y -= this.y;
        
        return ret;
    };
};

var theCamera = new Camera();

//=======================
// Player Code
//=======================

// Distance from origin to edge of the world
var X_WALL = 400;
var Y_WALL = 250;

var collisionArray = [];

Player = function(asset, name) {
    // Do not allow magnitude of velocity vector to exceed this
    var MAX_VEL = 2.0;
    
    // Sprite is ready to render after image is finished loading
    this.ready = false;
    
    // The sprite for this player
    this.asset = asset;
    this.spritenum = 0;
    this.sprite = new Image();
    this.sprite.src = asset;
    this.sprite.onload = function(me) {
        me.ready = true;
        context.drawImage(me.sprite, 0, 0);
    } (this);
    
    // Physics
    this.pos = {x:0, y:0};
    this.vel = {x:0, y:0};
    this.rot = 0.1;
    
    // Unique player ID
    if(name) {
        this.name = name;
    }
    else {
        this.name = "Guest" + Math.floor(10000 * Math.random());
    }
    
    // Use the camera to place this sprite
    this.render = function() {
        if(this.ready == true) {
            theCamera.render(this.sprite, this.pos.x, this.pos.y, this.rot);
        }
    };
    
    // Called during update loop
    this.update = function() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        
        // Disabling camera stuff for now
        /*if(this.pos.x > X_WALL) {
            this.pos.x = -X_WALL;
            theCamera.x -= X_WALL*2;
        }
        else if(this.pos.x < -X_WALL) {
            this.pos.x = X_WALL;
            theCamera.x += X_WALL*2;
        }
        
        if(this.pos.y > Y_WALL) {
            this.pos.y = -Y_WALL;
            theCamera.y -= Y_WALL*2;
        }
        else if(this.pos.y < -Y_WALL) {
            this.pos.y = Y_WALL;
            theCamera.y += Y_WALL*2;
        }
        
        var camPos = theCamera.getPositionInCameraSpace(this.pos.x, this.pos.y);
        if(camPos.x < 100 || camPos.x > canvas.width() - 200) {
            theCamera.x += this.vel.x;
        }
        if(camPos.y < 100 || camPos.y > canvas.height() - 200) {
            theCamera.y += this.vel.y;
        }*/
        
        var myPos = {x: this.pos.x/* - this.sprite.width/2*/,
                     y: this.pos.y/* + this.sprite.height/2*/};
        
        if(myPos.x > 800) {
            this.pos.x = 0;
        }
        else if(myPos.x < 0) {
            this.pos.x = 800;
        }
        
        if(myPos.y > 500) {
            this.pos.y = 0;
        }
        else if(myPos.y < 0) {
            this.pos.y = 500;
        }
        
        // Do collision detection
        for(other in otherPlayers) {
            var otherName = other.name;
            if(this.collisionDetect(otherPlayers[other])) {
                if(!(otherName in collisionArray)) {
                    this.onCollision();
                }
                collisionArray[otherName] = 0;
            }
            else {
                if(otherName in collisionArray) {
                    delete collisionArray[otherName];
                }
            }
        }
    };
    
    this.collisionDetect = function(other) {
        if(other.pos.x > this.pos.x + this.sprite.width) {
            return false;
        }
        if(this.pos.x > other.pos.x + other.sprite.width) {
            return false;
        }
        if(other.pos.y > this.pos.y + this.sprite.height) {
            return false;
        }
        if(this.pos.y > other.pos.y + other.sprite.height) {
            return false;
        }
        return true;
    };
    
    this.changeVel = function(amt) {
        var tempVel = {x:this.vel.x, y:this.vel.y};
        tempVel.x += amt.x;
        tempVel.y += amt.y;
        if((tempVel.x*tempVel.x) + (tempVel.y*tempVel.y) < (MAX_VEL*MAX_VEL)) {
            this.vel = tempVel;
        }
    };
    
    this.rotate = function(amt) {
        this.rot += amt;
    }
    
    this.pushToFirebase = function() {
        myChar.set({'asset': this.asset, 'name': this.name, 'pos':{'x': this.pos.x, 'y': this.pos.y}, 'rot': this.rot});
    };
    
    this.onCollision = function() {
        SFX.chirp();
    };
    
    this.changeSprite = function(newSprite) {
        this.ready = false;
        
        this.sprite = new Image();
        this.sprite.src = newSprite;
        this.asset = newSprite;
        
        myChar.set({'asset': this.asset, 'name': this.name, 'pos':{'x': this.pos.x, 'y': this.pos.y}, 'rot': this.rot});
        
        this.sprite.onload = function(me) {
            me.ready = true;
            context.drawImage(me.sprite, 0, 0);
        } (this);
    };
};

var p1 = new Player("art/player00.png");
var otherPlayers = [];

//===============
// AI Players
//===============

var AIPlayer = function(asset) {
    var GOAL_DISTANCE_THRESHOLD = 1.0;
    
    this.player = new Player(asset);
    this.goalx = 0;
    this.goaly = 0;
    
    this.update = function() {
        // Handle roaming behavior
        if((this.player.pos.x - this.goalx) * (this.player.pos.x-this.goalx) +
           (this.player.pos.y - this.goaly) * (this.player.pos.y-this.goaly) < GOAL_DISTANCE_THRESHOLD*GOAL_DISTANCE_THRESHOLD) {
            doAIMove(this);
        }
        else {
            var moveVector = {x: this.goalx - this.player.pos.x, y: this.goaly - this.player.pos.y};
            var magnitude = Math.sqrt(moveVector.x*moveVector.x + moveVector.y*moveVector.y);
            moveVector.x /= magnitude;
            moveVector.y /= magnitude;
            this.player.pos.x += moveVector.x;
            this.player.pos.y += moveVector.y;
        }
        
        // Rotate if close to player
        var myPos = {x: this.player.pos.x + this.player.sprite.width/2,
                     y: this.player.pos.y + this.player.sprite.height/2};
        
        var playerPos = {x: p1.pos.x + p1.sprite.width/2,
                         y: p1.pos.y + p1.sprite.height/2};
        
        var dist = Math.sqrt((myPos.x - playerPos.x) * (myPos.x - playerPos.x) +
                             (myPos.y - playerPos.y) * (myPos.y - playerPos.y));
        
        var rotRate = 0.0;
        if(dist < 200.0) {
            rotRate = (1.0/(dist+1.0)) * 2.0;
        }
        
        this.player.rot += rotRate;
    };
    
    this.doMoveTo = function(posx, posy) {
        this.goalx = posx;
        this.goaly = posy;
    };
    
    this.render = function() {
        this.player.render();
    };
    
    doAIMove(this);
};

var doAIMove = function(player) {
    /*var posx = Math.floor(1.5*X_WALL*Math.random()) - X_WALL;
    var posy = Math.floor(1.5*Y_WALL*Math.random()) - Y_WALL;*/
    
    var posx = Math.floor(700*Math.random()) + 50;
    var posy = Math.floor(400*Math.random()) + 50;
    player.doMoveTo(posx, posy);
};

var AIPlayerArray = [];

//=======================
// Game Loop
//=======================

var requestAnimFrame = (function() {
    return (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    })
})();

function update(dt) {
    var ACCEL = 0.05;
    var ROT = 0.1;
    
    // We control the horizontal...
    if(KEY_STATUS['left'] == true) {
        p1.changeVel({x:-ACCEL, y:0});
    }
    else if(KEY_STATUS['right'] == true) {
        p1.changeVel({x:ACCEL, y:0});
    }
    // ...and the vertical
    if(KEY_STATUS['up'] == true) {
        p1.changeVel({x:0, y:-ACCEL});
    }
    else if(KEY_STATUS['down'] == true) {
        p1.changeVel({x:0, y:ACCEL});
    }
    
    if(KEY_STATUS['a'] == true) {
        p1.rotate(-ROT);
    }
    else if(KEY_STATUS['d'] == true) {
        p1.rotate(ROT);
    }
    
    p1.update();
    p1.pushToFirebase();
    
    for(p in AIPlayerArray) {
        AIPlayerArray[p].update();
    }
};

function render() {
    context.clearRect(0, 0, canvas.width(), canvas.height());
    
    // Render me
    p1.render();
    
    // Render other players
    for(p in otherPlayers) {
        otherPlayers[p].render();
    }
    
    // Render AI players
    for(p in AIPlayerArray) {
        AIPlayerArray[p].render();
    }
};

var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;
    
    update(dt);
    render();
    
    lastTime = now;
    requestAnimFrame(main);
};

//=====================
// Event Hooks
//=====================

baseData.child('players').on('child_added', function(snapshot) {
    data = snapshot.val();
    if(data.name == p1.name) return;
    var newPlayer = new Player(data.asset, data.name);
    newPlayer.pos.x = data.pos.x;
    newPlayer.pos.y = data.pos.y;
                             
    otherPlayers[newPlayer.name] = newPlayer;
});

baseData.child('players').on('child_changed', function(snapshot) {
    data = snapshot.val();
    if(data.name == p1.name) return;
    otherPlayers[data.name].pos.x = data.pos.x;
    otherPlayers[data.name].pos.y = data.pos.y;
    otherPlayers[data.name].rot = data.rot;
    if(otherPlayers[data.name].asset != data.asset) {
        otherPlayers[data.name].changeSprite(data.asset);
    }
});

baseData.child('players').on('child_removed', function(snapshot) {
    data = snapshot.val();
    if(data.name == p1.name) return;
    delete otherPlayers[data.name];
});

//======
// Test
//======

SFX.music1();
var np = new AIPlayer("art/player04.png");
AIPlayerArray[np.player.name] = np;

var currentBackground = 0;

onKeyUp = function(key) {
    if(KEY_CODES[key] == 'q') {
        if(currentBackground == 0) {
            $('#canvas').css("background-image", "url(art/earth-image2.jpg)");
            currentBackground = 1;
        }
        else if(currentBackground == 1) {
            $('#canvas').css("background-image", "url(art/lights-spain.jpg)");
            currentBackground = 2;
        }
        else if(currentBackground == 2) {
            $('#canvas').css("background-image", "url(art/lights-sf.jpg)");
            currentBackground = 3;
        }
        else {
            $('#canvas').css("background-image", "url(art/lights-shanghai.jpg)");
            currentBackground = 0;
        }
    }
    else if(KEY_CODES[key] == 'w') {
        SFX.changeMusic();
    }
    else if(KEY_CODES[key] == 's') {
        p1.spritenum += 1;
        if(p1.spritenum > 7) {
            p1.spritenum = 0;
        }
        p1.changeSprite("art/player0" + p1.spritenum + ".png");
    }
};

main();
