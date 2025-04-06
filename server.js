const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

let players = [];

server.on('connection', ws => {
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: 'full' }));
    ws.close();
    return;
  }

  players.push(ws);
  const symbol = players.length === 1 ? 'X' : 'O';
  ws.symbol = symbol;
  ws.send(JSON.stringify({ type: 'init', symbol }));

  if (players.length === 2) {
    players.forEach((p, i) => {
      p.send(JSON.stringify({ type: 'start', turn: i === 0 }));
    });
  }

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'move') {
      const index = data.index;
      players.forEach(p => {
        p.send(JSON.stringify({
          type: 'move',
          index,
          symbol: ws.symbol,
          turn: p !== ws
        }));
      });

      // Basic win check (for demo)
      ws.moves = ws.moves || [];
      ws.moves.push(index);
      if (checkWin(ws.moves)) {
        players.forEach(p => p.send(JSON.stringify({
          type: 'win',
          winner: ws.symbol
        })));
      } else if (isDraw()) {
        players.forEach(p => p.send(JSON.stringify({ type: 'draw' })));
      }
    }
  });

  ws.on('close', () => {
    players = players.filter(p => p !== ws);
    players.forEach(p => p.send(JSON.stringify({ type: 'opponent_left' })));
  });
});

function checkWin(moves) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(p => p.every(i => moves.includes(i)));
}

function isDraw() {
  const allMoves = players.flatMap(p => p.moves || []);
  return allMoves.length === 9;
}

console.log("WebSocket server running on ws://localhost:3000");
