(function () {
    // Constants initialized here
    var Gravity = 0.35;
    var Distance = 250;
    var hGravity = 0.0005;
    var MaxVelocity = 7;
    var HoleSize = 135; // static HoleSize
    var BirdJump = -6.5;
    var activePipes = [];
    var deadPipes = [];
    var Score = 0;
    var PipeWidth = 60;
    var Boost = -10;
    var floorHeight = 55;
    // use boolean in case image not loaded, square instead of img
    var imgLoaded = false;
    var backgroundLoaded = false;
    var birdImg = document.createElement("img");
    birdImg.src = "../resources/bird.png";
    birdImg.onload = function () {
        imgLoaded = true;
    }
    var backgroundImg = document.createElement("img");
    backgroundImg.src = "../resources/fullback.png";
    // THIS IS A CLASS
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

    function gameObject(aabb, velocity, hVelocity, type) {
        // velocity is vertical movement
        this.aabb = aabb;
        this.velocity = velocity;
        this.hVelocity = hVelocity;
        this.type = type;
        //this.game = game;
        this.draw = function (context) {
            // save and restore state as well, it can be used in a loop
            // multiple times in the same requestAnimationFrame function
            this.velocity = type === "bird" ? this.velocity + Gravity : this.velocity;
            this.velocity = Math.min(this.velocity, MaxVelocity);
            this.hVelocity = Math.min(this.hVelocity, MaxVelocity);
            context.save();
            context.fillStyle = this.type === "bird" ? "blue" : "red";
            // scope-ly speaking, var is the only thing accessible w/o a dot
            // limits the lower & upper boundary
            this.aabb.y = this.aabb.y < 0 ? 0 : Math.min(this.aabb.y, context.canvas.height - this.aabb.h);
            // limits left boundary
            this.aabb.x = Math.max(this.aabb.x, 0);
            context.beginPath();
            this.type === "bird" ? context.drawImage(birdImg, this.aabb.x, this.aabb.y) : context.fill();
            context.rect(this.aabb.x, this.aabb.y, this.aabb.w, this.aabb.h);
            if (type === "bird")
                context.drawImage(birdImg, this.aabb.x, this.aabb.y)
            else {
                context.fill();
            }
            context.lineWidths = 8;
            context.strokeStyle = 'black';
            context.stroke();
            this.aabb.y = this.aabb.y + this.velocity;
            this.aabb.x = this.aabb.x + this.hVelocity;

            /*
            if (this.type === "pipe") {
                if (this.game.bird.aabb.intersect(this.aabb)) {
                    alert("Game Over!");
                }
            }*/

            context.restore();
        }
    }

    function Pipes(aabb, hVelocity) {
        // commented part helps performance - batch canvas calls
        this.hVelocity = hVelocity;
        this.aabb = aabb;
        this.scored = false;
        this.draw = function (context) {
            //context.save();
            this.hVelocity = Math.max(this.hVelocity, -MaxVelocity);
            context.fillStyle = "red";
            this.aabb.y = this.aabb.y < 0 ? 0 : Math.min(this.aabb.y, context.canvas.height - this.aabb.h);
            this.aabb.x = Math.max(this.aabb.x, 0-aabb.w);
            //context.beginPath();
            context.rect(this.aabb.x, this.aabb.y, this.aabb.w, this.aabb.h);
            //context.fill();
            context.lineWidths = 8;
            context.strokeStyle = 'black';
            //context.stroke();
            this.aabb.x = this.aabb.x + this.hVelocity;
            //context.restore();
        }
    }

    function Bird(aabb, vVelocity) {
        this.vVelocity = vVelocity;
        this.aabb = aabb;
        this.swayValue = 0.1;
        this.swayDirection = true;
        this.sway = function (context) {
            if (this.swayValue > 10 && this.swayDirection) {
                this.swayDirection = false;
            }
            else if(this.swayValue < 0 && !this.swayDirection){
                this.swayDirection = true;
            }
            if (this.swayValue < 10 && this.swayDirection) {
                this.swayValue += 0.2;
            }
            else {
                this.swayValue -= 0.2;
            }

            context.drawImage(birdImg, this.aabb.x, this.aabb.y + this.swayValue);
        }
        this.draw = function (context) {
            context.save();
            this.vVelocity += Gravity;
            this.vVelocity = Math.min(this.vVelocity, MaxVelocity);
            this.aabb.y = this.aabb.y < 0 ? 0 : Math.min(this.aabb.y, context.canvas.height - this.aabb.h);
            this.aabb.x = Math.max(this.aabb.x, 0);
            context.beginPath();
            context.rect(this.aabb.x, this.aabb.y, this.aabb.w, this.aabb.h);
            this.sway(context);
            context.lineWidths = 8;
            context.strokeStyle = 'black';
            context.stroke();
            this.aabb.y = this.aabb.y + this.vVelocity;
            context.restore();
        }
    }

    function generatePipes(context) {
        while (activePipes.length < 10) {
            // bitwise 0 to get the actual integer not floating
            var height = context.canvas.height - floorHeight;
            var pipeOneHeight = Math.random() * (height - 250) + 100 | 0; // 350
            var pipeTwoHeight = height - HoleSize - pipeOneHeight;
            if (activePipes.length === 0) {
                pipeOne = new Pipes(new aabb(800, 0, PipeWidth, pipeOneHeight), -1.5);
                pipeTwo = new Pipes(new aabb(800, pipeOneHeight + HoleSize, PipeWidth, pipeTwoHeight), -1.5);
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
                    pipeOne = new Pipes(new aabb(comparePipe.aabb.x + Distance, 0, PipeWidth, pipeOneHeight), comparePipe.hVelocity)
                    pipeTwo = new Pipes(new aabb(comparePipe.aabb.x + Distance, pipeOneHeight + HoleSize, PipeWidth, pipeTwoHeight), comparePipe.hVelocity)
                }
                            }
            activePipes.push(pipeOne);
            activePipes.push(pipeTwo);

            // TODO: Implement boost
            // TODO: Background
            // TODO: Animation
            // LABEL UPDATE
        }
    }

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

    function isGameOver(bird, context){
        var floorBound = context.canvas.height - floorHeight <= (bird.aabb.y + bird.aabb.h);            
        for (var i = 0; i < activePipes.length; i++) {
            if (activePipes[i].aabb.intersect(bird.aabb)) {
                alert("Hit the pipe!");
                return true;
            }
        }
        if(floorBound){
            alert("Hit the floor!")
            return true;
        }
        return false;
    }

    function updateScore(context, bird) {
        if(activePipes[0].scored)
            return;
        context.save();
        context.font = 'bold 30pt Calibri';
        var gap = activePipes[0].aabb.h;
        var width = activePipes[0].aabb.x;

        if (bird.aabb.y > gap && bird.aabb.y < (gap + HoleSize) && bird.aabb.x >= (width + PipeWidth)) {
            Score += 1;
            activePipes[0].scored = true;
        }
        context.fillText(Score, 100, 100);
        context.restore();
    }

    window.onload = function () {
        //Bird.prototype = new gameObject(new aabb(100, 200, 20, 20), -1, 0, "bird");
        var bird = new Bird(new aabb(100, 200, 40, 50), -1);
        var pressed = false;

        //var bird = new gameObject(new aabb(100, 200, 20, 20), -1, 0, "bird");
        /*
        // struct to hold bird and pipe
        var game = {
            bird:bird,pipe:pipe
        };
        bird.game = game;
        pipe.game = game;
        */

        var canvas = document.getElementById("frame");
        var context = canvas.getContext("2d");
        context.canvas = canvas;
        var background = document.getElementById("background");
        var backCtx = background.getContext("2d");
        backCtx.drawImage(backgroundImg, 0, 0);
        //var i = 0;
        window.onkeypress = function (e) {

            /*
                view the keystroke
                alert(e.keyCode);
            */

            if (e.keyCode === 102 && !pressed) {
                
                pressed = true;
            }

            if (e.keyCode === 32 && !pressed) {

                /*
                // acceleration; tough to do; set static velocity when pressed
                //bird.velocity -= 2;
                */

                bird.vVelocity = BirdJump;
                pressed = true;
            }
        }
        window.onkeyup = function (e) {
            if (e.keyCode === 32) {
                pressed = false;
            }
            if (e.keyCode === 102){
                pressed = false;
            }
        }

        window.onclick = function (e) {
            bird.vVelocity = BirdJump;
        }
        requestAnimationFrame(function renderLoop() {
            // saves the clean context state
            context.save();
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            generatePipes(context);
            updateScore(context, bird);
            //context.rotate(Math.PI * i / 180 / 2);

            /*
            // this is needed otherwise it'll draw a continuing line.
            // OR if you use context. save and restore you can bypass this
            //context.beginPath();
            //context.moveTo(100, 100+i);
            //context.lineTo(200, 200+i);
            */

            bird.draw(context);
            context.beginPath();
            for (var i = 0; i < activePipes.length; i++) {
                activePipes[i].hVelocity -= hGravity;
                activePipes[i].draw(context);
            }
            context.fill();
            context.stroke();
            context.restore();

            /*
            //context.strokeStyle = "blue";
            //context.stroke();
            //i++;
            // this is needed otherwise it'll draw a continuing line.
            */

            // restores the clean context state (like MIPS s-registers)
            //context.restore();
            killPipe();
            //if(isGameOver(bird, context)){
                //return;
            //}



            requestAnimationFrame(renderLoop);
        });
        
    };
}());
