class Player{
    constructor(id,username,color){
        this.id = id;
        this.username = username;
        this.color = color; 
        this.position = {x:window.innerWidth * Math.random(), y:window.innerHeight * Math.random()}; 
        this.direction = {x: 0,y: 0};
        this.health = 3;
        this.old_position ={x:0, y:0};
        this.speed = 200;
        this.score = 0;
        this.rank = 0;
    }

    setDirection(direction){
        if(direction.x != 0 || direction.y != 0){
            this.direction = direction;
        }
    }

    shoot(){
        core.createObj(new Rocket(this.position.x,this.position.y,this.color,this.id));
    }

    reset(){
        let x = window.innerWidth * Math.random();
        let y = window.innerHeight * Math.random();
        this.position = {x:x, y:y}; 
        this.old_position = {x:x, y:y}; 
        this.health = 3;
        this.direction = {x: 0,y: 0};
    }

    takeDamage(){
        this.health--;
        game.playerHit(this.id,this.health);
        if(this.health == 0){
            game.tryRestart();
        }
    }

    update(){
        if(this.health > 0){
            this.charge += core.deltaTime;
            if(core.world.collision(this.position.x + 3 * Math.sign(this.direction.x),this.position.y + 3 * Math.sign(this.direction.y),1,1) && (this.direction.x != 0 || this.direction.y != 0)){
                let radius =  this.health == 1 ? 80 : 30;
                core.world.dig(this.position.x,this.position.y,radius);
                core.createObj(new Explosion(this.position.x,this.position.y,radius));
                this.takeDamage();
            }
            this.old_position.x = this.position.x;
            this.old_position.y =  this.position.y;

            this.position.x += this.direction.x * this.speed * core.deltaTime;
            this.position.y += this.direction.y * this.speed * core.deltaTime;
            
            if(this.position.x < 0){
                this.position.x = window.innerWidth;
                this.old_position.x = window.innerWidth;
            }else if(this.position.x > window.innerWidth){
                this.position.x = 0;
                this.old_position.x = 0;
            }
            if(this.position.y < 0){
                this.position.y = window.innerHeight;
                this.old_position.y = window.innerHeight;
            }else if(this.position.y > window.innerHeight){
                this.position.y = 0;
                this.old_position.y = 0;
            }
        }
    }

    draw(){
        if(this.health > 0){
            let ctx = core.world.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.old_position.x,this.old_position.y);
            ctx.lineTo(this.position.x,this.position.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        if(this.direction.x == 0 && this.direction.y == 0){
            let ctx = core.ctxFX;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 10, 0, 2 * Math.PI);
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
}

class Rocket{
    constructor(x,y,color,playerid){
        this.position = {x: x, y: y};
        this.target = null;
        let distance = 10000000;
        this.color = color;
        game.players.forEach(player => {
            let diff = {x: player.position.x - this.position.x,y: player.position.y - this.position.y};
            let currentDistance = vectorMagnitude(diff);
            if(currentDistance < distance && player.id != playerid && player.health > 0){
                distance = currentDistance;
                this.target = player;
            }
        });

        this.direction = {x:0,y:0};
        this.timer = 7;
    }

    update(){
        if(this.target == null){
            core.destroyObj(this);
        }else{
            this.timer -= core.deltaTime;
            let diff = {x: this.target.position.x - this.position.x,y: this.target.position.y - this.position.y};
            if(this.timer < 0){
                core.createObj(new Explosion(this.position.x,this.position.y,10));
                core.world.dig(this.position.x,this.position.y,10);
                core.destroyObj(this);
            }else if(vectorMagnitude(diff) < 5){
                core.createObj(new Explosion(this.position.x,this.position.y,50));
                core.world.dig(this.position.x,this.position.y,50);
                this.target.takeDamage();
                core.destroyObj(this);
            }

            let targetdir = vectorNormalize(diff);
            this.direction.x += (targetdir.x - this.direction.x) * 0.015;
            this.direction.y += (targetdir.y - this.direction.y) * 0.015;

            this.position.x += this.direction.x * 500 * core.deltaTime;
            this.position.y += this.direction.y * 500 * core.deltaTime;
        }
    }

    draw(){
        let ctx = core.ctxFX;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Explosion{
    constructor(x,y,radius){
        this.position = {x: x, y: y}
        this.radius = radius;
        this.timer = 0;
        core.world.shakeScreen(5);
    }

    update(){
        this.timer += core.deltaTime;
        if(this.timer > 0.15){
            core.destroyObj(this);
        }
    }

    draw(){
        let ctx = core.ctxFX;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.timer > 0.05 ? "white" : "black";
        ctx.fill();
    }
}

function vectorMagnitude(vect){
    return Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
}

function vectorNormalize(vect){
    let magnitude = vectorMagnitude(vect);
    if(magnitude != 0){
        return {x: vect.x/magnitude, y: vect.y/magnitude};
    }else{
        return {x: 0, y: 0};
    }
}

function drawRect(ctx,x,y,w,h,color,rotation = 0){
    ctx.save();
    ctx.translate(x, y);
    if(rotation != 0)
        ctx.rotate(Math.PI/180 * rotation);
    ctx.beginPath();
    ctx.rect(-w/2,-h/2,w,h);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}