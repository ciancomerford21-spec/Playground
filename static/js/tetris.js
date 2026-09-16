(function () {
    const canvas = document.getElementById("tetris-board");
    const ctx = canvas.getContext("2d");
    const message = document.getElementById("tetris-message");
    const title = document.getElementById("tetris-message-title");
    const start = document.getElementById("tetris-start");
    const scoreEl = document.getElementById("tetris-score");
    const linesEl = document.getElementById("tetris-lines");
    const cols = 10;
    const rows = 20;
    const cell = 30;
    const shapes = [
        [[[0, 1], [1, 1], [2, 1], [3, 1]], "#e5484d"],
        [[[0, 0], [1, 0], [0, 1], [1, 1]], "#eb923e"],
        [[[1, 0], [0, 1], [1, 1], [2, 1]], "#d54491"],
        [[[1, 0], [2, 0], [0, 1], [1, 1]], "#4f93e0"],
        [[[0, 0], [1, 0], [1, 1], [2, 1]], "#5bbf76"],
        [[[0, 0], [0, 1], [1, 1], [2, 1]], "#e25b4c"],
        [[[2, 0], [0, 1], [1, 1], [2, 1]], "#9a63d3"]
    ];
    let board, piece, score, lines, timer, running = false;

    function newPiece() {
        const selected = shapes[Math.floor(Math.random() * shapes.length)];
        return { blocks: selected[0].map(block => block.slice()), color: selected[1], x: 3, y: 0 };
    }
    function reset() {
        board = Array.from({ length: rows }, () => Array(cols).fill(null));
        piece = newPiece();
        score = 0;
        lines = 0;
        scoreEl.textContent = "0000";
        linesEl.textContent = "00";
        draw();
    }
    function fits(blocks, x, y) {
        return blocks.every(([dx, dy]) => x + dx >= 0 && x + dx < cols && y + dy < rows && (y + dy < 0 || !board[y + dy][x + dx]));
    }
    function rotate(blocks) {
        const rotated = blocks.map(([x, y]) => [-y, x]);
        const minX = Math.min(...rotated.map(([x]) => x));
        const minY = Math.min(...rotated.map(([, y]) => y));
        return rotated.map(([x, y]) => [x - minX, y - minY]);
    }
    function lock() {
        piece.blocks.forEach(([x, y]) => { if (piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color; });
        const remaining = board.filter(row => row.some(cellValue => !cellValue));
        const cleared = rows - remaining.length;
        board = Array.from({ length: cleared }, () => Array(cols).fill(null)).concat(remaining);
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared];
        scoreEl.textContent = String(score).padStart(4, "0");
        linesEl.textContent = String(lines).padStart(2, "0");
        piece = newPiece();
        if (!fits(piece.blocks, piece.x, piece.y)) endGame();
    }
    function stepDown() {
        if (fits(piece.blocks, piece.x, piece.y + 1)) piece.y += 1;
        else lock();
    }
    function drawCell(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    }
    function draw() {
        ctx.fillStyle = "#130d0e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        board.forEach((row, y) => row.forEach((color, x) => { if (color) drawCell(x, y, color); }));
        if (piece) piece.blocks.forEach(([x, y]) => { if (piece.y + y >= 0) drawCell(piece.x + x, piece.y + y, piece.color); });
        ctx.strokeStyle = "#3b2527";
        for (let x = 0; x <= cols; x += 1) ctx.beginPath(), ctx.moveTo(x * cell, 0), ctx.lineTo(x * cell, canvas.height), ctx.stroke();
        for (let y = 0; y <= rows; y += 1) ctx.beginPath(), ctx.moveTo(0, y * cell), ctx.lineTo(canvas.width, y * cell), ctx.stroke();
    }
    function begin() {
        reset();
        running = true;
        message.classList.add("hidden");
        clearInterval(timer);
        timer = setInterval(() => {
            stepDown();
            draw();
        }, 550);
    }
    function endGame() { if (!running) return; running = false; clearInterval(timer); title.textContent = "The tower reached the sky."; start.textContent = "Try again ↗"; message.classList.remove("hidden"); }
    document.addEventListener("keydown", event => {
        if (!running) return;
        if (event.key === "ArrowLeft" && fits(piece.blocks, piece.x - 1, piece.y)) piece.x -= 1;
        if (event.key === "ArrowRight" && fits(piece.blocks, piece.x + 1, piece.y)) piece.x += 1;
        if (event.key === "ArrowDown") stepDown();
        if (event.key === "ArrowUp") { const turned = rotate(piece.blocks); if (fits(turned, piece.x, piece.y)) piece.blocks = turned; }
        if (event.key === " ") while (fits(piece.blocks, piece.x, piece.y + 1)) piece.y += 1;
        if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) { event.preventDefault(); draw(); }
    });
    start.addEventListener("click", begin);
    reset();
}());
