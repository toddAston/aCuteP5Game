var socket = io('http://localhost:3005');

// Create arrays objects.
let players = [];
let trees = [];

// Add self to players.
players.push(new player({'userID': socket.id}, 10, 10));

// Add other players that have joined.
socket.on('otherClientJoined', (data) => {
  if(socket.id !== data.userID){
    players.push(new player({userID: data.userID}, 10, 10));
  }
});

// Remove other players if they have left.
socket.on('otherClientDisconnected', (data) => {
  let index = players.findIndex(function(e){
    if(e.id === data.userID){
      return e;
    }
  });
  players.splice(index, 1);
});

// When joining add previously joined players.
socket.on('addPreviouslyJoinedPlayers', (data) => {
  for(let i = 0; i < data.length; i++){
    players.push(new player(data[i], data[i].x, data[i].y));
  }
});

// Function to send client movement to server.
sendMovement = function(data){
  socket.emit('movement', {userID: socket.id, 'x': data.x, 'y': data.y});
};

// Receive and apply new coordinates of other moved players.
socket.on('otherClientMovement', (data) => {
  if(data.userID !== socket.id){
    players.find(player => player.id === data.userID).movePlayer(data.x, data.y);
  }
});

// Receive enviorment objects.
socket.on('renderObjects', (data) => {
  
  for(let i = 0; i < data.length; i++)
    trees.push(new tree(data[i]));
});

// P5 setup.
function setup() {
  createCanvas(600, 400);
  background(51);

  for(let i = 0; i < players.length; i++){
    players[i].vector = createVector(players[i].x, players[i].y);
  }

}

// Tree 'object'.
function tree(treeData){
  this.x = treeData.y;
  this.y = treeData.x;
  this.size = treeData.size;
  this.treeID = treeData.treeID;

  this.show = function (){
    square(this.x, this.y, this.size);
  }
}

Array.min = function( array ){
  return Math.min.apply( Math, array );
};

// Player 'objects'.
function player(data, constx, consty, r, d){
    this.id = data.userID;
    this.x = constx;
    this.y = consty;
    this.pointerX1 = this.x;
    this.pointerY1 = this.y;
    this.radius = r;
    this.angle = 0;
    this.closestItem;
    //this.pointerBoundary.diameter = 15;
    this.diameter = 5;
    this.pointerDistance = 10;
    this.vector;

    this.show = function (){
      circle(this.x, this.y, this.diameter);
    }

    this.showPointer = function(){
      let trianglePadding = 5;
      circle(this.x + 5, this.y + 5, 5);
    };

    this.findClosestObject = function (){
      let objects = [];
      let distances = [];
      let closestItem;
      let min = 9999;
      for(let i = 0; i < trees.length; i++){
        let d = int(dist(this.x, this.y, trees[i].x, trees[i].y));
        let id = trees[i].treeID;
        let distance = d;
        if(d < min){
          closestItem = trees[i];
          min = d;
        }
      };

      return min < 25 ? closestItem : null;
    }

    this.returnPointedObject = function(){

    }

    this.movePlayer = function(x, y){
      this.x = x;
      this.y = y;
    }
}

function draw(){
  // Rewrite canvas to hide previously drawn items.
  background(51);

  // Set fill to green for tree rendering.
  c = color('green');
  fill(c);

  // Render all the received tree objects.
  for (let i = 0; i < trees.length; i++) {
    trees[i].show();
  }

  // Set fill back to white for the players.
  c = color('white');
  fill(c);

  // Render all players.
  for (let i = 0; i < players.length; i++) {
    players[i].show();
  }

  // Continously find closest object
  let closestItem = players[0].findClosestObject();
  if(closestItem !== null){
    players[0].closestItem = closestItem;
    line(players[0].x, players[0].y, closestItem.x, closestItem.y);
  }
  

  // Catch movement, apply client side and send to server.
  if(keyIsDown(87)){
    players[0].y -= 2;
    sendMovement({x: players[0].x, y: players[0].y});
  }

  if(keyIsDown(65)){
    players[0].x -= 2;
    sendMovement({x: players[0].x, y: players[0].y});
  }

  if(keyIsDown(68)){
    players[0].x += 2;
    sendMovement({x: players[0].x, y: players[0].y});
  }

  if(keyIsDown(83)){
    players[0].y += 2;
    sendMovement({x: players[0].x, y: players[0].y});
  }
}



