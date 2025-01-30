// Game Configuration
let tileSize = 32;
let rows = 16;
let columns = 16;

let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let context;

// Ship
let shipWidth = tileSize * 2;
let shipHeight = tileSize;
let shipX = (tileSize * columns) / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 2;
let shipVelocityX = tileSize;

let shipImg = new Image();
shipImg.src = "./assets/ship.png";

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
};

// Aliens
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienVelocityX = 1;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0;

// Load all alien images
let alienImages = [
    "./assets/alien-yellow.png",
    "./assets/alien-magenta.png",
    "./assets/alien-cyan.png",
    "./assets/alien.png" // White alien
];

// Preload alien images
let loadedAlienImages = alienImages.map((src) => {
    let img = new Image();
    img.src = src;
    return img;
});

// Bullets
let bulletArray = [];
let bulletVelocityY = -10;

// Score & Game State
let score = 0;
let gameOver = false;
let highScore = 0; // High score resets on page refresh

let shootSound = new Audio("./assets/shoot.wav");
let hitSound = new Audio("./assets/hitting.wav");
let countSound = new Audio("./assets/count.wav");

// Preload sounds
function preloadAudio(audio) {
    audio.load(); // Preload the audio
}
preloadAudio(shootSound);
preloadAudio(hitSound);
preloadAudio(countSound);

window.onload = function () {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    requestAnimationFrame(update);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", shoot);

    // Touch Controls
    setupTouchControls();

    // Prevent zooming
    document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

    createAliens();
};

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        showGameOverScreen();
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    // Draw Ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    // Draw Aliens
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX * 2;

                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienWidth;
                }
            }

            context.drawImage(alien.img, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
                checkHighScore();
            }
        }
    }

    // Bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Check collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                handleCollision(bullet, alien);
            }
        }
    }

    // Clear used bullets
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift();
    }

    // Next Level
    if (alienCount === 0) {
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 2);
        alienRows = Math.min(alienRows + 1, rows - 4);
        alienVelocityX += 0.2;
        alienArray = [];
        bulletArray = [];
        createAliens();
    }

    // Draw Score
    context.fillStyle = "white";
    context.font = "16px courier";
    context.fillText(`Score: ${score}`, 5, 20);
    context.fillText(`High Score: ${highScore}`, 5, 40);
}

function handleKeydown(e) {
    if (gameOver && e.code === "KeyR") {
        restartGame();
    } else if (e.code === "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX;
    } else if (e.code === "ArrowRight" && ship.x + shipVelocityX + ship.width <= boardWidth) {
        ship.x += shipVelocityX;
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let randomImg = loadedAlienImages[Math.floor(Math.random() * loadedAlienImages.length)];

            let alien = {
                img: randomImg,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                alive: true
            };
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver) return;

    if (e.code === "Space") {
        let bullet = {
            x: ship.x + (shipWidth * 15) / 32,
            y: ship.y,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false
        };
        bulletArray.push(bullet);

        // Play shoot sound
        shootSound.currentTime = 0;
        shootSound.play().catch((error) => {
            console.error("Shoot sound could not be played:", error);
        });
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && 
           a.x + a.width > b.x && 
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function handleCollision(bullet, alien) {
    bullet.used = true;
    alien.alive = false;
    alienCount--;
    score += 100;

    // Play hit sound
    hitSound.currentTime = 0;
    hitSound.play().catch((error) => {
        console.error("Hit sound could not be played:", error);
    });
}

function checkHighScore() {
    if (score > highScore) {
        highScore = score; // Only updates during the session
    }
}

function showGameOverScreen() {
    context.fillStyle = "red";
    context.font = "24px courier";

    // Calculate the width of the text to center it
    let text = "Game Over! Press 'R' to Restart";
    let textWidth = context.measureText(text).width;

    // Position the text in the center
    let x = (boardWidth - textWidth) / 2;
    let y = boardHeight / 2;

    context.fillText(text, x, y);
}

function restartGame() {
    gameOver = false;
    score = 0;
    ship.x = shipX;
    alienRows = 2;
    alienColumns = 3;
    alienVelocityX = 1;
    alienArray = [];
    bulletArray = [];
    createAliens();
}

// Touch Restart (Tap anywhere after game over)
document.addEventListener("touchstart", function () {
    if (gameOver) restartGame();
});

// Touch Controls
function setupTouchControls() {
    let startX = null;
    let endX = null;

    document.addEventListener("touchstart", function (e) {
        startX = e.touches[0].clientX;
    });

    document.addEventListener("touchmove", function (e) {
        endX = e.touches[0].clientX;

        if (startX && endX) {
            let diff = endX - startX;

            if (diff > 10 && ship.x + shipVelocityX + ship.width <= boardWidth) {
                ship.x += shipVelocityX;
            } else if (diff < -10 && ship.x - shipVelocityX >= 0) {
                ship.x -= shipVelocityX;
            }

            startX = endX;
        }
    });

    document.addEventListener("touchend", function (e) {
        shoot({ code: "Space" });
    });
}

//end of the code yes completed