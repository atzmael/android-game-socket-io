var core = {};
core.world = null;
core.ctxFX = null;
core.objects = [];

core.createObj = function(obj){
    this.objects.push(obj);
    return obj;
}

core.destroyObj = function(obj){
    for(let i = 0; i < this.objects.length; i++){
        if(this.objects[i] == obj){
            this.objects.splice(i,1);
        }
    }
    obj = null;
    delete obj;
}

core.deltaTime = 0;
core.init = function(){
    core.world = new World("world");
    let fxcanvas = document.getElementById("fx");
    fxcanvas.width =  window.innerWidth;
    fxcanvas.height = window.innerHeight;
    core.ctxFX = fxcanvas.getContext("2d");

    time = Date.now();
    function update(){
        core.deltaTime = (Date.now() - time)/1000;
        time = Date.now();

        core.objects.forEach((obj)=>{
            if(typeof obj.update != "undefined")
                obj.update();
        });

        core.ctxFX.clearRect(0,0,window.innerWidth,window.innerHeight);
        core.world.update();

        for(let i = core.objects.length - 1; i>=0 ;i--){
            if(typeof core.objects[i].draw != "undefined")
                core.objects[i].draw();
        }

        requestAnimationFrame(update);
    }
    update();
}


class World{
    constructor(id){
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        setImageSmoothing(this.ctx,false);

        this.isShaking = false;
        this.shakePower = 0;
        this.shakeTimer = {x: 0,y: 0};
        this.shake = {x: 0,y: 0};
    }

    collision(x,y,w,h){
        let pix = this.ctx.getImageData(x - w/2, y - h/2, w, h).data; 
        for (var i = 0, n = pix.length; i < n; i += 4) {
            if(pix[i+3] > 0){
                return true;
            }
        }
        return false;
    }
    
    collisionValue(x,y,w,h){
        let pix = this.ctx.getImageData(x - w/2, y - h/2, w, h).data; 
        let averageOpacity = 0;
        for (var i = 0, n = pix.length; i < n; i += 4) {
            averageOpacity += pix[i+3];
        }
        averageOpacity = (averageOpacity/(w*h))/255;
        return averageOpacity;
    }

    reset(){
        this.ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    }
    
    loadlevel(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        let img = new Image();
        img.onload = ()=>{
            this.ctx.drawImage(img,0, 0,this.canvas.width,this.canvas.height); 
        }
        img.src = "levels/level2.png";
    }

    dig(x,y,radius){
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.arc(0,0,radius,0,2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
    }

    shakeScreen(power){
        this.shakePower = power;
        this.shakeTimer = {x: Math.PI *2 * Math.random(),y: Math.PI *2 * Math.random()};
        this.isShaking = true;
    }

    update(){
        if(this.isShaking){ 
            this.shake.x += Math.sin(this.shakeTimer.x) * this.shakePower;
            this.shake.y += Math.sin(this.shakeTimer.y) * this.shakePower;
            this.shakeTimer.x += core.deltaTime * 80;  
            this.shakeTimer.y += core.deltaTime * 80;         
            if(this.shakeTimer.x > Math.PI * 2 * 4){
                this.shakeTimer = {x: 0,y: 0};
                this.shake = {x: 0,y: 0};
                this.isShaking = false;
            }
        }

        this.canvas.style.transform = "translate("+this.shake.x+"px,"+this.shake.y+"px)";
    }
}

function setImageSmoothing(ctx,val){
    ctx.mozImageSmoothingEnabled = val;
    ctx.webkitImageSmoothingEnabled = val;
    ctx.msImageSmoothingEnabled = val;
    ctx.imageSmoothingEnabled = val;
}
