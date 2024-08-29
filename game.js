const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 32;

const COLORS = ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff', '#ff8000'];
const GREY = '#808080';

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPiece = null;
let gameOver = false;
let charge = 0;
let zenMode = false;

document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(event) {
    if (gameOver && !zenMode) return;
    switch (event.key) {
        case 'ArrowRight':
            movePiece(1, 0);
            playSound('move');
            break;
        case 'ArrowLeft':
            movePiece(-1, 0);
            playSound('move');
            break;
        case 'ArrowUp':
            rotatePiece();
            playSound('rotate');
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            playSound('softDrop');
            break;
        case ' ':
            hardDrop();
            playSound('hardDrop');
            break;
        case 'f':
        case 'F':
            attack();
            playSound('attack');
            break;
    }
}

function movePiece(dx, dy) {
    if (canMove(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        drawBoard();
    }
}

function rotatePiece() {
    const rotatedPiece = rotate(currentPiece);
    if (canMove(rotatedPiece, 0, 0)) {
        currentPiece.shape = rotatedPiece.shape;
        drawBoard();
    }
}

function hardDrop() {
    while (canMove(currentPiece, 0, 1)) {
        currentPiece.y += 1;
    }
    placePiece();
    drawBoard();
}

function attack() {
    if (charge >= 10) {
        socket.emit('attack', { roomCode, charge });
        charge = 0;
    }
}

function canMove(piece, dx, dy) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function rotate(piece) {
    const newShape = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    return { ...piece, shape: newShape };
}

function placePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                const newY = currentPiece.y + y;
                const newX = currentPiece.x + x;
                if (newY >= 0) {
                    board[newY][newX] = currentPiece.color;
                }
            }
        });
    });
    clearRows();
    newPiece();
}

function clearRows() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(null));
            charge += 1;
        }
    }
}

function newPiece() {
    const shapes = [
        [[1, 1, 1], [0, 1, 0]],
        [[1, 1], [1, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 1, 1]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]]
    ];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    currentPiece = { shape, color, x: Math.floor(COLS / 2) - 1, y: -1 };
    if (!canMove(currentPiece, 0, 0)) {
        if (zenMode) {
            board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        } else {
            gameOver = true;
        }
    }
}

function isGameOver() {
    return !canMove(currentPiece, 0, 0);
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                context.fillStyle = cell;
                context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    context.fillStyle = currentPiece.color;
                    context.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }
}

function gameLoop() {
    if (gameOver && !zenMode) return;
    drawBoard();
    requestAnimationFrame(gameLoop);
}

function playSound(action) {
    // Placeholder for playing sound effects
    console.log(`Playing sound for ${action}`);
}

document.getElementById('startButton').addEventListener('click', () => {
    zenMode = document.getElementById('zenMode').checked;
    gameOver = false;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    newPiece();
    gameLoop();
});

newPiece();
