(function () {
    // Constants initialized here
    var Gravity = 0.35;
    var Distance = 215;
    var hGravity = 0.0005;
    var MaxVelocity = 7;
    var HoleSize = 100;
    var BirdJump = -6.5;
    var activePipes = [];
    var deadPipes = [];
    var Score = 0;
    var PipeWidth = 52;
    var PipeLength = 320;
    var PipeVelocity = -2.5;
    var Boost = -10;
    var floorHeight = 55;
    var animater = 0;
    var gameOver = false;
    var gameActive = false;

    // bird animations
    var BirdImgs = [];
    var birdImgUp = document.createElement("img");
    birdImgUp.src = "resources/wingup.png";
    var birdImgRest = document.createElement("img");
    birdImgRest.src = "resources/wing mid.png";
    var birdImgDown = document.createElement("img");
    birdImgDown.src = "resources/wing down.png";
    BirdImgs.push(birdImgUp);
    BirdImgs.push(birdImgRest);
    BirdImgs.push(birdImgDown);
    
    //background pic
    var backgroundImg = document.createElement("img");
    backgroundImg.src = "resources/backnofloor.png";
        
    // moving ground
    var floor = document.createElement("img");
    floor.src = "resources/longfloor.png";

    // pipe up down
    var pipeDown = document.createElement("img");
    pipeDown.src = "resources/pipedown.png";
    var pipeUp = document.createElement("img");
    pipeUp.src = "resources/pipeup.png";

    // access aligned bounding box
    function aabb(x, y, w, h) {
        // these are the dimension for the OBJECT to intersect 
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.intersect = function (rect) {
            return rect.contains(this.x, this.y) ||
            rect.contains(this.x, this.y + this.h) ||
            rect.contains(this.x + this.w, this.y) ||
            rect.contains(this.x + this.w, this.y + this.h) ||
            this.contains(rect.x, rect.y) ||
            this.contains(rect.x, rect.y + rect.h) ||
            this.contains(rect.x + rect.w, rect.y) ||
            this.contains(rect.x + rect.w, rect.y + rect.h)
        }
        this.contains = function (x, y) {
            return x >= this.x && x <= (this.x + this.w) && y >= this.y && y <= (this.y + this.h);
        }
    }

    function Pipes(aabb, hVelocity, direction) {
        // commented part helps performance - batch canvas calls
        this.hVelocity = hVelocity;
        this.aabb = aabb;
        this.scored = false;
        this.isFacingDown = direction;
        this.draw = function (context) {
            var drawImg = this.isFacingDown ? pipeDown : pipeUp;
            var height = this.isFacingDown ? this.aabb.h - PipeLength : this.aabb.y;
            context.save();
            this.hVelocity = Math.max(this.hVelocity, -MaxVelocity);
            context.fillStyle = "red";
            this.aabb.y = this.aabb.y < 0 ? 0 : Math.min(this.aabb.y, context.canvas.height - this.aabb.h);
            this.aabb.x = Math.max(this.aabb.x, 0-aabb.w);
            context.drawImage(drawImg, this.aabb.x, height);
           
            // no img pipes
            //context.beginPath();
            //context.rect(this.aabb.x, this.aabb.y, this.aabb.w, this.aabb.h);
            //context.fill();
            //context.lineWidths = 8;
            //context.strokeStyle = 'black';
            //context.stroke();
            this.aabb.x = this.aabb.x + this.hVelocity;
            context.restore();
        }
    }

    function Bird(aabb, vVelocity) {
        this.vVelocity = vVelocity;
        this.aabb = aabb;
        this.swayValue = 0.1;
        this.swayDirection = true;
        this.picture = 0;
        this.calculatedRadian = 0;
        this.sway = function (context) {
            var index = 0;
            if (this.picture < 20) 
                index = 0;
            else if (this.picture < 40 || this.picture > 60)
                index = 1;
            else
                index = 2;
            var drawBird = BirdImgs[index];
            // toggles direction whether to fly up or down
            if (this.swayValue > 5 && this.swayDirection) {
                this.swayDirection = false;
            }
            else if(this.swayValue < -5 && !this.swayDirection){
                this.swayDirection = true;
            }
            if (this.swayValue < 10 && this.swayDirection) {
                this.swayValue += 0.5;
            }
            else {
                this.swayValue -= 0.5;
            }
            this.picture++;
            if(this.picture > 80) {
                this.picture = 0;
            }

            calculatedRadian = this.vVelocity * 7.5;
            if(calculatedRadian > 50) {
                calculatedRadian = 50;
            } else if (calculatedRadian < -50) {
                calculatedRadian = -50;
            }
            
            rotateAndPaintImage( context, drawBird, calculatedRadian, this);        
        }
        this.draw = function (context) {
            context.save();
            this.vVelocity += Gravity;
            this.vVelocity = Math.min(this.vVelocity, MaxVelocity);
            this.aabb.y = this.aabb.y < 0 ? 0 : Math.min(this.aabb.y, context.canvas.height - this.aabb.h);
            this.aabb.x = Math.max(this.aabb.x, 0);
            if(!gameActive){
                this.vVelocity = 0;
            } 
            this.sway(context);
            
            // commented part for box around bird
            //context.beginPath();
            //context.rect(this.aabb.x, this.aabb.y, this.aabb.w, this.aabb.h);
            //context.lineWidths = 8;
            //context.strokeStyle = 'black';
            //context.stroke();
            this.aabb.y = this.aabb.y + this.vVelocity;
            context.restore();
            
        }
    }

    /* Helper function to rotate the bird depending on their vertical velocity */
    function rotateAndPaintImage ( context, image, angleInRad , bird ) {
        var TO_RADIANS = Math.PI/180;
        var yAdjuster = angleInRad < 0 ? (-angleInRad/5) : (-angleInRad/3);
        var xAdjuster = angleInRad > angleInRad/2.5 ? angleInRad/3 : 0 
        var middleX = bird.aabb.x + xAdjuster;
        var middleY = bird.aabb.y + yAdjuster;
        context.translate( middleX, middleY );
        context.rotate( angleInRad * TO_RADIANS);
        context.drawImage( image, 0, bird.swayValue );
        context.rotate( -angleInRad * TO_RADIANS);
        context.translate( -middleX, -middleY );
    }

    /* Generate pipes for the game; re-uses dead objects to reduce load on browser */
    function generatePipes(context) {
        while (activePipes.length < 10) {
            // bitwise 0 to get the actual integer not floating
            var height = context.canvas.height - floorHeight;
            var pipeOneHeight = Math.random() * (height - 250) + 100 | 0; // 350
            var pipeTwoHeight = height - HoleSize - pipeOneHeight;
            if (activePipes.length === 0) {
                pipeOne = new Pipes(new aabb(800, 0, PipeWidth, pipeOneHeight), PipeVelocity, true);
                pipeTwo = new Pipes(new aabb(800, pipeOneHeight + HoleSize, PipeWidth, pipeTwoHeight), PipeVelocity, false);
            }
            else {
                var index = activePipes.length - 1;
                var comparePipe = activePipes[index];
                if(deadPipes.length >= 2){
                    var temp = deadPipes.splice(0,2);
                    pipeOne = temp[0];
                    pipeTwo = temp[1];
                    pipeOne.scored = false;
                    pipeTwo.scored = false;
                    pipeOne.aabb.x = comparePipe.aabb.x + Distance;
                    pipeTwo.aabb.x = comparePipe.aabb.x + Distance;
                    pipeTwo.aabb.y = pipeOneHeight + HoleSize;
                    pipeOne.aabb.h = pipeOneHeight;
                    pipeTwo.aabb.h = pipeTwoHeight;
                    pipeOne.hVelocity = comparePipe.hVelocity;
                    pipeTwo.hVelocity = comparePipe.hVelocity;
                }
                else{
                    pipeOne = new Pipes(new aabb(comparePipe.aabb.x + Distance, 0, PipeWidth, pipeOneHeight), comparePipe.hVelocity, true)
                    pipeTwo = new Pipes(new aabb(comparePipe.aabb.x + Distance, pipeOneHeight + HoleSize, PipeWidth, pipeTwoHeight), comparePipe.hVelocity, false)
                }
                            }
            activePipes.push(pipeOne);
            activePipes.push(pipeTwo);

        }
    }

    /* Function to recycle "dead" pipes */
    function killPipe() {
        if (activePipes[0].aabb.x <= 0 - activePipes[0].aabb.w) {
            // GC flag to deallocate memory
            //activePipes[0] = null;
            //activePipes[1] = null;
            
            // different approach; splice the "dead" arrays and persist them
            // for later use to restore them to "live pipes"
            var temp = activePipes.splice(0, 2);
            deadPipes = deadPipes.concat(temp);
        }
    }

    /* Check if the game is over */
    function isGameOver(bird, context){
        var floorBound = context.canvas.height - floorHeight + 3 < (bird.aabb.y + bird.aabb.h);
        if(floorBound){
            return true;
        }
        for (var i = 0; i < activePipes.length; i++) {
            if (activePipes[i].aabb.intersect(bird.aabb)) {
                return true;
            }
        }

        return false;
    }

    /* Update the current score */
    function updateScore(context, bird) {
        var currentPipe = activePipes[0];
        // If there are no pipes, i.e. game did not start, don't do anything
        if(activePipes.length == 0)
            return;
        var gap = currentPipe.aabb.h;
        var width = currentPipe.aabb.x;

        // Only award the point if the pipe was not scored on yet
        if (bird.aabb.y > gap && bird.aabb.y < (gap + HoleSize) && bird.aabb.x >= (width + PipeWidth) && !currentPipe.scored) {
            Score += 1;
            currentPipe.scored = true;
        }

        // Draw the score on the canvas
        context.save();
        context.font = '20pt Calibri';
        context.fillText("Score: " + Score, 25, 25);
        context.restore();
    }

    /* Initializer when the user opens the website */
    window.onload = function () {
        var bird = new Bird(new aabb(100, 200, 35, 20), -1);

        var canvas = document.getElementById("frame");
        var context = canvas.getContext("2d");
        context.canvas = canvas;
        var background = document.getElementById("background");
        var backCtx = background.getContext("2d");
        backCtx.drawImage(backgroundImg, 0, 0);

        var pressed = false;
        window.onkeypress = function (e) {

            /*
                view the keystroke
                alert(e.keyCode);
            */
            /*
                Acceleration; tough to do; set static velocity when pressed
                bird.velocity -= 2;
            */

            function pressMe() {
                // If the game was over, invoke new game state
                if(gameOver) {
                    newGame();
                }
                // If the game is not over, start the game 
                else if (!gameActive) {
                    gameActive = true;
                }
                bird.vVelocity = BirdJump;
                pressed = true;
            }

            // Spacebar KeyCode
            if (e.keyCode === 102 && !pressed) {
                pressMe();
            }

            // Tap KeyCode
            if (e.keyCode === 32 && !pressed) {
                pressMe();
            }
        }
    
        // Make sure to know when the key is pressed, otherwise accelaration is applied non-stop
        window.onkeyup = function (e) {
            if (e.keyCode === 32) {
                pressed = false;
            }
            if (e.keyCode === 102){
                pressed = false;
            }
        }

        // Click KeyCode
        window.onclick = function (e) {
            bird.vVelocity = BirdJump;
        }

        requestAnimationFrame(function renderLoop() {
            // Saves the clean context state
            context.save();
            
            // Clean the canvas for the new rendering
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            
            // Draw the bird to the canvas
            bird.draw(context);

            // Draw the pipes to the canvas
            for (var i = 0; i < activePipes.length; i++) {
                activePipes[i].draw(context);
            }

            // Draw moving floor
            context.drawImage(floor,-1 * animater, context.canvas.height - floorHeight);

            // check if the game is over
            if(isGameOver(bird, context)){
               displayGameover(context);
               gameOver = true;
               gameActive = false;
            }

            // Pre-click active game state, do not generate any pipes
            if(gameActive){
                generatePipes(context);
                killPipe();
                updateScore(context, bird);
            } else if (!gameOver) {
                context.font = 'bold 30pt Helvetica';
                context.fillText("Click to Start!", 125, 250);
            }
    
            // Restore clean context state
            context.restore();
            
            // Used to determine speed of the floor
            animater += 3.5;
            if(animater > 500) {
                animater = 0;
            }

            // If game is over, don't draw anymore
            if(!gameOver) 
                requestAnimationFrame(renderLoop);
        });

        /* Function to display Game Over text */
        function displayGameover(context) {
            context.save();
            context.font = 'bold 30pt Helvetica';
            context.fillText("GAME OVER!!", 125, 250);
            context.font = '20pt Helvetica';
            context.fillText("Click to Restart", 165, 150);
            context.restore();
        }

        /* New Game function */
        function newGame() {
            gameActive = false;
            gameOver = false;
            activePipes.splice(0, activePipes.length);
            window.onload();
        }
    };
}());
