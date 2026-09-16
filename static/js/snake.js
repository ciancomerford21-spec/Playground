(function () {
    const canvas = document.getElementById("game-board");
    const ctx = canvas.getContext("2d");
    const message = document.getElementById("game-message");
    const title = document.getElementById("message-title");
    const start = document.getElementById("start-button");
    const scoreEl = document.getElementById("score");
    const highScoreEl = document.getElementById("high-score");
    const cells = 20;
    const step = canvas.width / cells;
    let snake, food, direction, nextDirection, score, timer, running = false;
    let highScore = Number(highScoreEl.textContent) || 0;
    let globalScore = Number(document.getElementById("global-score").textContent) || 0;
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    function reset() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        direction = { x: 1, y: 0 };
        nextDirection = direction;
        score = 0;
        scoreEl.textContent = "0000";
        placeFood();
        draw();
    }
    function placeFood() {
        do { food = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) }; }
        while (snake.some(part => part.x === food.x && part.y === food.y));
    }
    function draw() {
        ctx.fillStyle = "#130d0e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e5484d";
        ctx.shadowColor = "#e5484d";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(food.x * step + step / 2, food.y * step + step / 2, step * .24, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? "#ff8a8d" : "#b8323b";
            ctx.fillRect(part.x * step + 2, part.y * step + 2, step - 4, step - 4);
        });
    }
    function tick() {
        direction = nextDirection;
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || snake.some(part => part.x === head.x && part.y === head.y)) return endGame();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreEl.textContent = String(score).padStart(4, "0");
            if (score > highScore) { highScore = score; highScoreEl.textContent = String(highScore).padStart(4, "0"); }
            placeFood();
        } else snake.pop();
        draw();
    }
    function begin() { reset(); running = true; message.classList.add("hidden"); clearInterval(timer); timer = setInterval(tick, 115); }
    function saveScore() {
        if (!window.ravenUserAuthenticated) return;
        fetch("/scores/snake/", {
            method: "POST",
            headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken},
            body: JSON.stringify({game: "snake", score: score})
        }).then(response => response.json()).then(data => {
            if (data.user_score !== undefined) {
                highScore = data.user_score;
                highScoreEl.textContent = String(data.user_score).padStart(4, "0");
            }
            if (data.global_score !== undefined) {
                globalScore = data.global_score;
                document.getElementById("global-score").textContent = String(globalScore).padStart(4, "0");
            }
        }).catch(() => {});
    }
    function endGame() { running = false; clearInterval(timer); saveScore(); title.textContent = "The night got you."; start.textContent = "Try again ↗"; message.classList.remove("hidden"); }
    document.addEventListener("keydown", event => {
        const keys = { ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } };
        const intended = keys[event.key];
        if (intended && (intended.x !== -direction.x || intended.y !== -direction.y)) { nextDirection = intended; event.preventDefault(); }
    });
    start.addEventListener("click", begin);
    reset();
}());
