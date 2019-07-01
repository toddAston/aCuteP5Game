// Setup basic express server. Not really sure why I require express like this but
// i'm pretty sure I had to?
let express = require('express');
let app = express();
let path = require('path');
let server = require('http').createServer(app);
let io = require('socket.io')(server);
let port = 3005;

let objectCounter = 0;

// Listen on port set above.
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Give public access to static resources.
app.use(express.static(path.join(__dirname, 'resources')));

// Create array for all the active players. 
let allPlayers = [];
let trees = [];

const canvasWidth = 400 - 15;
const canvasHeight = 600 - 15;
const numTrees = 25;

let treeObject = class{
  constructor(objectCounter){
    this.x = Math.ceil(Math.random() * (canvasWidth - 0) + 0);
    this.y = Math.ceil(Math.random() * (canvasHeight - 0) + 0);
    this.size = Math.ceil(Math.random() * (25 - 15) + 0);
    this.treeID = objectCounter + 1;
  }
}

let tree;

function isNotAlreadyCreated() {
  return createdTree.x !== tree.x && createdTree.y !== tree.y;
}

for(let i = 0; i < numTrees; i++){
  // Check if tree already exists at coordinates, if so retry a new object.
  tree = new treeObject(objectCounter);
    if(i !== 0){
    let treeExists = trees.every(e => {
      return e.x !== tree.x && e.y !== tree.y;
    }); 
    console.log(treeExists);
    
    if(treeExists){
      trees.push(tree);
      objectCounter += 1;
    } else {
    i--; 
    }
  }
}

// On connection of new player listen for these things, AKA: do stuff. :)
io.on('connection', (socket) => {
  // Basic data to record of each player.
  let currentNewPlayer = {
    userID: socket.id,
    x: 10,
    y: 10
  };

  // Send previously joined player's data only to the session that just joined.
  io.to(socket.id).emit('addPreviouslyJoinedPlayers', [...allPlayers]);

  io.to(socket.id).emit('renderObjects', [...trees]);

  // Add session that just joined to current record of players.
  allPlayers.push(currentNewPlayer);

  // Tell clients to add this new player to their record of players.
  io.emit('otherClientJoined', {userID: socket.id}, 10, 10);

  // When a player leaves/disconnects remove the player from the server's record.
  socket.on('disconnect', () => {
    let index = allPlayers.findIndex(function(e){
      if(e.userID === socket.id){
        return e;
      }
    });
    
    // Tell client to remove the player that has left from their records.
    io.emit('otherClientDisconnected', {userID: allPlayers[index].userID});      

    allPlayers.splice(index, 1);
  });

  // Listen for movement emit from players. Client side moves 2 pixels 
  // depending on their direction and only sends the server their new coordinates.
  socket.on('movement', (direction) => {

    // Find player to be moved.
    let index = allPlayers.findIndex(function(e){
      if(e.userID === direction.userID){
        return e;
      }
    });

    // Set player x and y to received x and y.
    allPlayers[index].x = direction.x;
    allPlayers[index].y = direction.y;

    // Tell clients to update the players movements.
    io.emit('otherClientMovement', {userID: socket.id, x: direction.x, y: direction.y});      
  })
});