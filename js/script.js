let inModal = false; //whether player is in high score modal or not 

let gameOver = false; //whether the player is on game over screen or not
let gameOverTimer = 0; //timer to display game over screen

//set result from ajax function to change high score table
function setResult(string){
    updateScores(string);
}

//ajax function to get updated high score table from database
function loadNewScores(){
    $.ajax({
        url: 'http://178.128.148.67/lucus/invaders/php/loadscores.php',
        type: 'POST',
        dataType: 'text',
        success: function(result){
            setResult(result);
        }
    });
}

//initialize high score table, 6 values
let scoreTable = Array(6).fill({});

//update scores stored in high score table
function updateScores(string){
    pscoreInfo = string.split(";");    

    for(let i = 0; i < scoreTable.length; i++){
        scoreTable[i] = {
            initial: pscoreInfo[i].split(", ")[1],
            score: pscoreInfo[i].split(", ")[2]
        }
    }

    //score to be displayed at top of screen during gameplay
    hiscore = scoreTable[0].score;
}

//set high scores when page loads
loadNewScores(); 

//canvas element
let cvs = document.getElementById("cvs");
let ctx = cvs.getContext("2d")

let started = false; //whether the game has been started or not
let startTimer = 0; //timer to display the "<READY>" text before game begins
let playing = false; //whether the player is in the playing state or not

//pixel size
let pixh = 2;
let pixw = 2;

//currently unused
let twoPlayer = false;

//whether the player has earned an extra life or not
let extraLife = false;

//set size of canvas element
cvs.width = 224 * pixw;
cvs.height = 260 * pixh;

//directional input
let leftP = false;
let rightP = false;

//the player can only go up and down if debug mode is on
let upP = false;
let downP = false;

//animation counters
let animationCounter = 0;
let ufoAnimationCounter = 0;
let deathAnimationTimer = 0;
let deathFrameCounter = 0;

//kill all invaders on screen (buggy, functionality disabled currently)
let killAll = false;

//whether player is alive or not (in game over animation state or has lost all lives)
let playerState = "alive";

//timer for bonus UFO
let ufoTimer = 0;

//player directions
let playerD;
let playerDY;

//player position
let playerx = 0;
let playery = 216;

//scores
let p1score = 0;
let p2score = 0;

//sentscore is set equal to p1score, then sentscore is used in ajax function to send to database 
let sentscore = 0;

//highest score in score table to be displayed at top of screen during gameplay
let hiscore = scoreTable[0].score;

//player's lives
let lives = 3;

//line at bottom of screen width
let bottomLine = 225;

//which invaders are at the bottom
let bottomMostInRow = [44,45,46,47,48,49,50,51,52,53,54,55];

//bonus ufo postion, state
let ufo = {
    x: -16,
    y: 41,
    state: "offScreen"
}

//player's number of shots
let shotNumber = 0;

//point values to be given to player after shooting UFO, changes based on shotNumber
let ufoPointValues = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];

//points given to player
let pointsGiven = ufoPointValues[0];

//keydown event
document.addEventListener("keydown", (event) => {
    //directions
    if(event.keyCode == 37){
        leftP = true;
    }
    if(event.keyCode == 39){
        rightP = true;
    }
    if(event.keyCode == 38){
        upP = true;
    }
    if(event.keyCode == 40){
        downP = true;
    }
    
    //debug mode toggle
    /*
    if(event.keyCode == 68 && playerState == "alive"){
        playery = 216 //reset player vertical position
        debug = !debug; //debug toggle
    }
    */

    //debug stuff
    if(debug){
        if(event.keyCode == 80 && playerState == "alive"){
            getExtraLife();
        }

        if(event.keyCode == 75 && playerState == "alive"){
            killPlayer();
        }

        if(event.keyCode == 61){
            p1score++;
        }

        if(event.keyCode == 173){
            p1score--;
        }
    }

    //killAll functionality (buggy, disabled)
    /*
    if(event.keyCode == 65 && invadersAlive != 0 && debug){
        killAll = true;
    }
    */

    //shoot missile (only if missile isnt already shot and player is alive)
    if(!missile.shot && (event.keyCode == 90 || event.keyCode == 32) && animationCounter == 0 && playerState == "alive" && playing){
        shootSfx.currentTime = 0; //reset sound effect
        shootSfx.play(); //play sound effect
        shotNumber++; //increment shot number

        //reset shot number if greater than 14
        if(shotNumber > 14){
            shotNumber = 0;
        }

        missile.shot = true;
    }
});

//keyup event
document.addEventListener("keyup", (event) => {
    //directions
    if(event.keyCode == 37){
        leftP = false;
    }
    if(event.keyCode == 39){
        rightP = false;
    }

    if(event.keyCode == 38){
        upP = false;
    }
    if(event.keyCode == 40){
        downP = false;
    }

    //start game
    if(!inModal){
        started = true;
    }
});

//starting fill style
ctx.fillStyle = "white";

//create alienz
let invader = [];

let iframe = 1; //invader animation frame
let moveH = 4; //horizontal movement distance
let moveV = 8; //vertical movement distance
let moveClock = 0; //time it takes for invaders to move
let soundClock = 0; //time between each movement sound effect
let clockCount; 
let leftmost = 0; //leftmost invader on screen index value
let rightmost = 54; //rightmost invader on screen index value
let moveSoundNum = 0; //which sound effect to play (pitch changes like beep boop bop boop)

let invadersAtBottom = false; //whether or not invaders have reached bottom of screen

//debug shit
let debug = false;

let flaggedInvader = null; //invader that has been shot
let animationTime; //explosion animation time
let invadersAlive = invader.length; //number of invaders currently alive
let startY = 64; //starting position for invaders when new wave starts
let multiplier; //speed multiplier
function initInvaders(){
    let index = 0; //index of invader to be created
    startY += 16; //starting Y position of each invader

    //create each invader
    for(let r = 0; r < 5; r++){
        for(let c = 0; c < 11; c++){
            //by default, invader is the "squid" type
            //different types of invaders have different sizes and point values
            invader[index] = {
                x: 24+(16*c),
                y: startY+(16*r),
                width: 8,
                type:0,
                boundl: (24+(16*c)) + 4, //hitbox
                boundr: 24+(16*c) + 4 + 12, //hitbox
                alive: true,
                pointVal: 30, //how many points to give to player when shot
                os: 4,
            }
            //change invaders type based on row
            switch(r){
                //"crab" type, middle
                case 1:
                case 2:
                    invader[index].pointVal = 20;
                    invader[index].width = 11;
                    invader[index].os = 3;
                    invader[index].boundl = invader[index].x + invader[index].os;
                    invader[index].boundr = invader[index].boundl + invader[index].width;
                    invader[index].type = 1;
                    break;
                //"octopus" type, bottom
                case 3:
                case 4:
                    invader[index].pointVal = 10;
                    invader[index].width = 12;
                    invader[index].os = 2
                    invader[index].boundl = invader[index].x + invader[index].os;
                    invader[index].boundr = invader[index].boundl + invader[index].width;
                    invader[index].type = 2;
                    break;
                default:
            }
            index++;
        }
    }

    //reset values
    iframe = 1;
    move = -4;
    moveClock = 0;
    soundClock = 0;
    clockCount = 54;
    leftmost = 0;
    rightmost = 54;
    moveSoundNum = 0;
    playerD;
    playerx = 15;
    flaggedInvader = null;
    animationTime = 140;
    invadersAlive = invader.length;
    multiplier = 1.03;
}

//draw a pixel on the screen
//color changes based on position on screen, colors are fixed
function drawPixel(x, y){
    if(y <= 62 && y >= 32){
        ctx.fillStyle = "rgb(254,30,30)";//red
    }
    else if((y >= 184 && y <= 239) || (y >= 240 && (x >= 25 && x <= 135))){
        ctx.fillStyle = "rgb(30,254,30)";//green
    }
    else{
        ctx.fillStyle = "rgb(255,255,255)";//white
    }
    ctx.fillRect((x)*pixw, (y)*pixh, pixw, pixh);
}

//draw an object on the screen, with graphics taken from gfx.js
//object graphics are identified by type (which invader/object to draw), frame(which animation frame to draw), position, and binary width
function drawInvader(type, frame, x, y, binWidth){
    let tempLine;
    
    if(iGfx[type].length <= 1){
        frame = 0;
    }
    for(let r = 0; r < iGfx[type][frame].length; r++){
        //Converts row's graphics data into a string of binary numbers
        tempLine = (Number(iGfx[type][frame][r]).toString(2).padStart(binWidth, 0));

        //draw each pixel of objec
        for(let c = 0; c <= tempLine.length; c++){
            if(tempLine.charAt(c) == "1"){
                drawPixel(x+c, y+r, tempLine.charAt(c));              
            }
        }
    }
}

// draw text
function drawText(string, x, y){   
    let position = x;
    
    for(let loop = 0; loop <= string.length; loop++){
        if(string.charCodeAt(loop) >= 65 && string.charCodeAt(loop) <= 90){
            drawInvader((string.charCodeAt(loop)-65)+21, 0, position, y, 8);
        }
        else if(string.charCodeAt(loop) >= 48 && string.charCodeAt(loop) <= 57){
            drawInvader((string.charCodeAt(loop)-48)+9, 0, position, y, 8);
        }
        else{
            switch(string.charAt(loop)){
                case "<":
                    drawInvader(19, 0, position, y, 8);
                    break;
                case ">":
                    drawInvader(20, 0, position, y, 8);
                    break;
                case "-":
                    drawInvader(49, 0, position, y, 8);
                    break;
                }
        }

        position += 8;
    }
}

//player's missile
let missile = {
    x: playerx+9,
    y: playery,
    shot: false
}

//alien's missile (currently only one at a time)
let alienShot = [];

//sounds invaders make when they move
function InvaderSounds(){
    if(soundClock >= 1500 && invadersAlive >= 1){
        moveSoundNum++;
            if(moveSoundNum == 4){
                moveSoundNum = 0;
            }

        invaderMoveSfx[moveSoundNum].play();
        soundClock = 0;
    }
}


//change all invaders' horizontal and vertical position
function updatePosition(my, mx){
    for(let i = 0; i < invader.length; i++){
        invader[i].y += my;
        invader[i].x += mx;
        invader[i].boundl = invader[i].x + invader[i].os;
        invader[i].boundr = invader[i].boundl + invader[i].width;
    }
}

//destroy an invader when shot
function killInvader(i){
    //if missile collides with invader, 
    flaggedInvader = i                                  //save invader that was hit
    invader[flaggedInvader].type = 5;                   //set type to show explosion sprite
    animationCounter++;                                 //let explosion timer start
    
    invaderDeadSfx.currentTime = 0;
    invaderDeadSfx.play();

    p1score += invader[flaggedInvader].pointVal;          //update p1score
    clockCount = Math.ceil(clockCount * multiplier);          //increase speed
    invadersAlive--;  
}

//murder the player
function killPlayer(){
    playerState = "dead";
}

let HUDString = "SCORE<1> HI-SCORE SCORE<2>";

//give player an extra life
function getExtraLife(){
    extraLife = true;
    lives++;
    extraLifeSfx.currentTime = 0;
    extraLifeSfx.play();
}

//game loop
function Game(){
    //document.getElementById("invadersAliveDisplay").innerHTML = invadersAlive; //...
    //document.getElementById("movingDisplay").innerHTML = missile.x + " " + missile.y + " " + missile.shot;
    //document.getElementById("score").innerHTML = Number(p1score).toString().padStart(4, '0'); //...
    //document.getElementById("ufoTimer").innerHTML = ufoTimer + " " + ufo.state;
    //document.getElementById("shotNumber").innerHTML = shotNumber;

    //reset fill style
    ctx.fillStyle = "white";
    
    //draw score info at top of screen
    drawText(HUDString,6,8);
    drawText(p1score.toString().padStart(4, "0") + "    " + hiscore.toString().padStart(4, "0"),22,24);

    //draw 2nd player's score
    if(twoPlayer){
        drawText(p2score.toString().padStart(4, "0"), 166, 24);
    }

    //search for new leftmost or rightmost invader each time previous is killed
    if(!invader[leftmost].alive || !invader[rightmost].alive){
        leftmost = 54;
        for(let r = 0; r < 5; r++){
            for(let c = 0; c < 11; c++){
                if(invader[(c+(r*11))].alive && invader[(c+(r*11))].x < invader[leftmost].x){
                    leftmost = (c+r*11);
                }
            }
        }
        rightmost = 0;
        for(let r = 0; r < 5; r++){
            for(let c = 0; c < 11; c++){
                if(invader[54-(c+(r*11))].alive && invader[54-(c+(r*11))].x > invader[rightmost].x){
                    rightmost = 54-(c+r*11);
                }
            }
        }
    }

    //search for bottommost invader
    for(let c = 0; c < 11; c++){
        for(let r = 0; r < 5; r++){
            if(invader[(c+(r*11))].alive){  
                bottomMostInRow[c] = (c+(r*11)); 
            }
        }
    }

    //1up at 1500 points
    if(!extraLife && p1score >= 1500){
        getExtraLife();
    }

    //move invaders
    if(moveClock >= 1500 && animationCounter == 0 && playing){
        //if an invader is at the edge of screen, descend and change horizontal direction
        if(invader[leftmost].x <= 6 && moveH < 0 || invader[rightmost].x >= (198) && moveH > 0){
            //move vertically
            updatePosition(moveV, 0);
            moveH = -moveH;
        }
        else{
            //move horizontally
            updatePosition(0, moveH);
        }
        
        //change animation frame
        if(iframe==1){
        iframe = 0;
        }
        else if(iframe==0){
            iframe = 1;
        }
        
        //reset timer
        moveClock = 0;
    }

    //play beep bop boop bop sounds
    if(playerState == "alive" && playing){
        InvaderSounds();
    }

    let row = 0;

    for(let i = 0; i < invader.length; i++ && playing){
        //check each invader
        if(invader[i].alive){
            if(animationCounter == 0 && missile.shot && 
                missile.x > invader[i].boundl && missile.y >= invader[i].y && 
                missile.x < invader[i].boundr && missile.y <= invader[i].y+8 &&
                invader[i].type != 5)
                {
                if(killAll){
                    killInvader(0);
                }
                else{
                    killInvader(i);
                }
            }
            //else
            if(i == flaggedInvader && animationCounter > 0 && animationCounter <= animationTime){
                //show explosion graphic after invader is hit for a specified period of time
                animationCounter += 25;
            } 
            else if(animationCounter >= animationTime ){
                //end explosion, kill invader, reset missile position
                invader[flaggedInvader].alive = false
                animationCounter = 0;

                missile.shot = false;

                if(killAll && invadersAlive != 0){
                    if(invader[flaggedInvader+1].alive){
                        killInvader(flaggedInvader+1);
                    }
                    else{
                        flaggedInvader++;
                    }
                } 
                else if(invadersAlive == 0){
                    initInvaders();
                    killAll = false;
                }
                else{
                    flaggedInvader = null;
                }
            }
                      //graphic          frame   x             y
            drawInvader(invader[i].type, iframe, invader[i].x, invader[i].y, 16);

            ctx.beginPath();
            ctx.lineWidth = "1";

            //draw hitboxes
            if(debug){
                if(i == leftmost){
                    ctx.strokeStyle = "blue";
                }
                else if(i == rightmost){
                    ctx.strokeStyle = "yellow";
                }
                else{
                    ctx.strokeStyle = "red";
                }
                if(i == bottomMostInRow[row]){
                    ctx.strokeStyle = "white";
                }

                ctx.rect(invader[i].boundl * pixw, invader[i].y * pixh, invader[i].width * pixw, 8 * pixh);
                ctx.stroke();
            }
            if(invader[i].y >= 216 && playerState == "alive"){
                invadersAtBottom = true;
                killPlayer();
            }
        }

        row++;
        if(row == 11){
            row = 0;
        }
    }

    //draw lives
    drawText(lives.toString(), 6, 240);
    for(let i = 0; i < lives-1; i++){
        drawInvader(4, 0, 24+(i*16), 240, 16);
    }

    //Only do this if player is alive/not in death animation
    if(playerState == "alive" && playing){
        let resetPos = false;
        if(alienShot[0].shot){
            alienShot[0].y += 4;

            if(alienShot[0].y == missile.y && alienShot[0].x == missile.x){
                resetPos = true;
                missile.shot = false;
            }

            if(alienShot[0].y >= playery && alienShot[0].y <= (playery+8) &&
               alienShot[0].x >= playerx && alienShot[0].x <= (playerx+16)){
                resetPos = true;
                missile.shot = false;
                killPlayer();
            }
            
            if(alienShot[0].y > 260){
                resetPos = true;
            }

            if(resetPos == true){

                resetPos = false;
                alienShot[0].shot = false;

                let selectedInvader = bottomMostInRow[Math.floor(Math.random() * 11)]

                do{
                    selectedInvader = bottomMostInRow[Math.floor(Math.random() * 11)]
                }while(!invader[selectedInvader].alive);

                alienShot[0].x = invader[selectedInvader].x+8;
                alienShot[0].y = invader[selectedInvader].y+8;
            }
        }
        else{
            alienShot[0].shot = true;
        }

        drawInvader(6, 0, alienShot[0].x, alienShot[0].y, 8);

        //Move Horizontally
        if(leftP && !rightP && playerx >= 16){
            playerD = -2;
        }
        else if(rightP && !leftP && playerx <= 185){
            playerD = 2;
        }
        else{
            playerD = 0;
        }
        //Move Vertically (testing purposes)
        if(debug){
            if(upP && !downP){
                playerDY = -2;
            }
            else if(downP && !upP){
                playerDY = 2;
            }
            else{
                playerDY = 0;
            }
            playery += playerDY;
        }
        
        //player movement
        playerx += playerD;

        drawInvader(4, 0, playerx, playery, 16); //draw player

        //shoot missile
        if(missile.shot && animationCounter == 0){
            if(missile.y <= 0){
                missile.shot = false;
                missile.x = playerx+8;
                missile.y = playery;
            }else{
                missile.y -= 7;
            }
        }else{
            missile.x = playerx+8;
            missile.y = playery;
        }

        if(debug){
            ctx.rect(playerx * pixw, playery * pixh, 16 * pixw, 8 * pixh);
            ctx.stroke();  
        }

        drawInvader(6, 0, missile.x, missile.y, 8); //draw missile

        //icrease timer 4 moving invaders
        moveClock += clockCount;
        soundClock += clockCount;  
    }
    //Player death
    if(playerState == "dead"){

        if(deathAnimationTimer == 0){
            playerDeathSfx.play();
        }

        if(deathAnimationTimer < 25){
            if(deathFrameCounter > 3){
                drawInvader(7, 0, playerx, playery,16);
            }
            if(deathFrameCounter <= 3){
                drawInvader(7, 1, playerx, playery,16);
            }

            if(deathFrameCounter == 6){
                deathFrameCounter = 0;
            }
        }

        deathAnimationTimer++;
        deathFrameCounter++;

        if(deathAnimationTimer == 25){
            if(invadersAtBottom){
                lives = 0;
            }
            else{
                lives--;
            }
        }

        if(deathAnimationTimer > 75 && !invadersAtBottom && !lives <= 0){
            deathAnimationTimer = 0;
            deathFrameCounter = 0;
            playerState = "alive";
        }
        else if (deathAnimationTimer > 25 && (invadersAtBottom || lives <= 0)){
            playerDeathSfx.pause();
            playerDeathSfx.currentTime = 0;
    
            hiscore = scoreTable[0].score;
            drawText("GAME OVER", 70, 56);

            gameOver = true;
        }
    }

    for(let i = 0; i <= bottomLine; i++){
        drawPixel(i, 239, "1")
    }

    if(ufoTimer >= 1100 && ufo.state == "offScreen"){
        ufo.state = "moving";
        ufoTimer = 0;
    }

    //UFO
    if(ufo.state == "offScreen" && playerState == "alive"){
        ufoTimer += 1;
    }
    else if (ufo.state == "moving"){
        if(ufo.x == -16){
            ufoSfx.play();
        }
        
        ufo.x += 1.55;
        drawInvader(3, 0, Math.round(ufo.x), ufo.y, 16);
        
        if(ufo.x >= 224){0
            ufo.x = -16;
            
            ufoSfx.pause()
            ufoSfx.currentTime = 0;

            ufo.state = "offScreen";
        }

        if(missile.shot &&
            missile.x > ufo.x && missile.y >= ufo.y && 
            missile.x < ufo.x+16 && missile.y <= ufo.y+8){
            
            missile.shot = false;
            ufo.state = "dyingAnimation";
            pointsGiven = ufoPointValues[shotNumber];
            p1score += pointsGiven;
        }
    }
    else if (ufo.state == "dyingAnimation"){
        if(ufoAnimationCounter == 0){
            ufoDeadSfx.play();
            ufoSfx.pause()
            ufoSfx.currentTime = 0;
        }
        ufoAnimationCounter++;
        if(ufoAnimationCounter <= 25){
            drawInvader(8, 0, Math.round(ufo.x), ufo.y , 16);
            drawInvader(8, 1, Math.round(ufo.x)+16, ufo.y , 8);
        }
        else if(ufoAnimationCounter > 25 && ufoAnimationCounter <= 50){
            drawText(pointsGiven.toString(), Math.round(ufo.x), ufo.y);
        }
        else{
            ufo.state = "offScreen";
            ufoAnimationCounter = 0;
            ufo.x = -16;
        }
    }

    drawText("CREDIT 00", 134, 240);
}

//game interval
setInterval(function(){
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if(gameOver){
        if(gameOverTimer < 125){
            gameOverTimer++;
        }

        if(!inModal && gameOverTimer == 125){
            sentScore = p1score;
            p1score = 0;
            extraLife = false;

            for(let i = 0; i < scoreTable.length; i++){
                if(sentScore > parseInt(scoreTable[i].score)){
                    inModal = true;
                    document.getElementById("modal").style.display = "block";
                    break;
                }
            }

            playing = false;
            gameOver = false;
            started = false;
            lives = 3;
            gameOverTimer = 0;
            callAjax();
        }
    }

    if(playing){
        Game();
    }
    else if(started){
        if(startTimer == 0){
            startY = 64;
            initInvaders();

            alienShot[0] = {
                x: invader[bottomMostInRow[Math.floor(Math.random() * 11)]].x+8,
                y: invader[bottomMostInRow[Math.floor(Math.random() * 11)]].y+8,
                shot: false,
            }
        }
        Game();

        drawText("<READY>", (224/2)-((7*8)/2), 56);

        startTimer++;

        if(startTimer >= 50){
            playing = true;
            started = false;
            startTimer = 0;
        }
    }
    else{
        drawText("SPACE INVADERS", (224/2)-((14*8)/2), 50);
        drawInvader(1, 1, (224/2)-(8/2), 68, 16);
        drawText("HI-SCORES", (224/2)-((9*8)/2), 85);

        for(let i = 0; i < scoreTable.length; i++){
            drawText(scoreTable[i].initial.toUpperCase(), (224/2)-((9*8)/2)-8, 103+(10*i));
            drawText("----", 92, 103+(10*i));
            drawText(scoreTable[i].score.toString().padStart(4, "0"), 124, 103+(10*i));
        }

        drawText("PUSH ANY KEY TO START", (224/2)-((21*8)/2), 200);
    }
},25);

//event listener for submit button for high scores
$(document).ready(function(){    
    $(window).keydown(function(event){
        if(event.keyCode == 13){
            event.preventDefault();
            return false;
        }
    })

    $('#submit').click(function(){    
        let initials = $('#initials').val();
    
        //console.log(sentScore + " " + initials);

        //load php to update scores in database
        $.ajax({
            type: "post",
            url: 'http://178.128.148.67/lucus/invaders/php/changescore.php',
            //url: 'php/changescore.php',
            data: {
                'initial': initials,
                'score': sentScore
            },
            success: function(result){
                //console.log(result);
            }
        })

        document.getElementById("modal").style.display = "none";
        inModal = false;
        loadNewScores();
    });
});
