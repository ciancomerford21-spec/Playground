(function () {
    const canvas = document.getElementById("asteroid-board");
    const ctx = canvas.getContext("2d");
    const message = document.getElementById("asteroid-message");
    const title = document.getElementById("asteroid-message-title");
    const start = document.getElementById("asteroid-start");
    const scoreEl = document.getElementById("asteroid-score");
    const highEl = document.getElementById("asteroid-high-score");
    const globalEl = document.getElementById("asteroid-global-score");
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const keys = {};
    let ship, asteroids, bullets, score, health, running = false, frame;
    let highScore = Number(highEl.textContent) || 0;

    function reset() {
        ship = { x: canvas.width / 2, y: canvas.height - 42, vx: 0, cooldown: 0 };
        asteroids = [];
        bullets = [];
        score = 0;
        health = 10;
        updateHealth();
        for (let i = 0; i < 4; i += 1) spawnAsteroid(28);
        scoreEl.textContent = "0000";
        draw();
    }
    function spawnAsteroid(size) {
        const x = size + Math.random() * (canvas.width - size * 4);
        const y = -size - Math.random() * 160;
        asteroids.push({ x, y, size, vx: (Math.random() - .5) * .3, vy: .55 + Math.random() * .55, rotation: Math.random() * 6 });
    }
    function wrapHorizontal(body) { if (body.x < -body.size) body.x = canvas.width + body.size; if (body.x > canvas.width + body.size) body.x = -body.size; }
    function updateHealth() {
        document.getElementById("asteroid-health").textContent = String(health);
        document.getElementById("asteroid-health-fill").style.width = `${health * 10}%`;
    }
    function shoot() { if (ship.cooldown > 0) return; bullets.push({ x: ship.x, y: ship.y - 20, vx: 0, vy: -8, life: 75 }); ship.cooldown = 10; }
    function update() {
        if (keys.ArrowLeft || keys.a) ship.vx -= .35;
        if (keys.ArrowRight || keys.d) ship.vx += .35;
        ship.vx *= .88; ship.x += ship.vx;
        ship.x = Math.max(20, Math.min(canvas.width - 20, ship.x));
        if (ship.cooldown > 0) ship.cooldown -= 1;
        bullets.forEach(bullet => { bullet.x += bullet.vx; bullet.y += bullet.vy; bullet.life -= 1; });
        bullets = bullets.filter(bullet => bullet.life > 0);
        asteroids.forEach(asteroid => { asteroid.x += asteroid.vx; asteroid.y += asteroid.vy; asteroid.rotation += .01; wrapHorizontal(asteroid); });
        for (let i = asteroids.length - 1; i >= 0; i -= 1) {
            if (asteroids[i].y - asteroids[i].size > canvas.height) {
                asteroids.splice(i, 1);
                health -= 1;
                updateHealth();
                if (health <= 0) return endGame();
            }
        }
        if (asteroids.some(asteroid => Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y) < asteroid.size + 12)) return endGame();
        for (let i = asteroids.length - 1; i >= 0; i -= 1) for (let j = bullets.length - 1; j >= 0; j -= 1) {
            if (Math.hypot(asteroids[i].x - bullets[j].x, asteroids[i].y - bullets[j].y) < asteroids[i].size) {
                if (asteroids[i].size > 15) { asteroids.push({ ...asteroids[i], size: asteroids[i].size / 2, vx: -.45, vy: asteroids[i].vy + .1 }); }
                asteroids.splice(i, 1); bullets.splice(j, 1); score += 10; scoreEl.textContent = String(score).padStart(4, "0"); break;
            }
        }
        if (!asteroids.length) for (let i = 0; i < 4; i += 1) spawnAsteroid(28);
        draw(); frame = requestAnimationFrame(update);
    }
    function draw() {
        ctx.fillStyle = "#130d0e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#e5484d"; ctx.lineWidth = 2;
        asteroids.forEach(a => { ctx.beginPath(); for (let i = 0; i < 9; i += 1) { const angle = i * Math.PI * 2 / 9 + a.rotation; const radius = a.size * (.78 + (i % 3) * .12); const x = a.x + Math.cos(angle) * radius, y = a.y + Math.sin(angle) * radius; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); });
        ctx.fillStyle = "#ff8a8d"; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill(); });
        ctx.save(); ctx.translate(ship.x, ship.y); ctx.strokeStyle = "#ff7474"; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-16, 15); ctx.lineTo(0, 9); ctx.lineTo(16, 15); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    function saveScore() { if (!window.ravenUserAuthenticated) return; fetch("/scores/snake/", { method: "POST", headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken}, body: JSON.stringify({ game: "asteroid_destroyers", score }) }).then(r => r.json()).then(data => { highEl.textContent = String(data.user_score || highScore).padStart(4, "0"); globalEl.textContent = String(data.global_score || 0).padStart(4, "0"); }).catch(() => {}); }
    function endGame() { if (!running) return; running = false; cancelAnimationFrame(frame); saveScore(); title.textContent = health <= 0 ? "The hull is gone." : "The void wins."; start.textContent = "Launch again ↗"; message.classList.remove("hidden"); }
    function begin() { reset(); running = true; message.classList.add("hidden"); frame = requestAnimationFrame(update); }
    document.addEventListener("keydown", event => {
        keys[event.key] = true;
        if (event.key === " " && !event.repeat && running) shoot();
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "a", "d", "w", " "].includes(event.key)) event.preventDefault();
    });
    document.addEventListener("keyup", event => { keys[event.key] = false; });
    canvas.addEventListener("click", shoot); start.addEventListener("click", begin); reset();
}());
