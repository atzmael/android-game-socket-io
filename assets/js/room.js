let game = {};
game.players = new Array();
game.socket = null; 
game.running = true;
game.getPlayer = function(id){
    for(let i=0; i < game.players.length;i++){
        if(game.players[i].id == id){
            return game.players[i];
        }
    }
}

game.init = function(){
	let socket = io.connect("/");
    game.socket = socket;
    socket.emit("room_new");

    socket.on("room",function(roomId){
        document.getElementById("room_id").innerText = roomId;
        core.init();
        socket.on("server_move",function(data){
            game.getPlayer(data.id).setDirection({x: data.x,y:data.y});
        });
    });

    socket.on("server_client_connected",function(data){
        let player = core.createObj(new Player(data.id,data.username, data.color));
        game.players.push(player);
        console.log(data.username + " is connected");
        game.displayScoreboard();
    });

    socket.on("server_client_disconnected",function(id){
        console.log(id);
        let player = game.players.filter(e => e.id == id)[0];
        game.players = game.players.filter(e => e.id != id);
        core.destroyObj(player);
        game.displayScoreboard();
        game.tryRestart();
    });

    socket.on("server_rocket",function(id){
        if(game.running)
            game.getPlayer(id).shoot();
    });
}


game.restart = function(){
    game.socket.emit("room_restart");
    game.running = true;
    core.world.reset();
    for(let i=0; i < game.players.length;i++){
        game.players[i].reset();
    }
}

game.playerHit = function(id,health){
    game.socket.emit("room_hit",{id: id, health: health})
}

game.tryRestart = function(){
    alives = game.players.filter(e => e.health > 0);
    alives.forEach(player => {
        player.score++;
    });
    if(alives.length <= 1 && game.running){
        game.running = false;
        game.displayScoreboard();
        setTimeout(()=>{
            game.restart();
        },1000);
    }
}

game.displayScoreboard = function(){
    let scoreboard = document.querySelector("#scoreboard .score-wrapper");
    scoreboard.innerHTML = "";
    
    let rankArray = new Array();

    game.players.sort(sortByScore);
    let rank = 1;

    game.players.forEach(player => {
        player.rank = rank;
        rank++;
        let score = document.createElement("span");
        score.innerHTML = "<p>"+player.rank+" - "+player.username+"</p><p>"+player.score+"</p>";
        score.style.color = player.color;
        scoreboard.appendChild(score);

        rankArray.push({id:player.id,rank:player.rank});
    });
    game.socket.emit("room_ranks",rankArray);
}

function sortByScore(a, b) {
    if (a.score > b.score)
        return -1;
    if (a.score < b.score)
        return 1;
    return 0;
}


window.onload = game.init;

