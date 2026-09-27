# Raven Arcade

A small browser arcade built with Django. Three canvas games, per-user accounts, profile
pictures, and a shared leaderboard. Dark raven-and-crimson theme, no build step, no frontend
framework — the games are plain JavaScript and CSS served by Django's staticfiles.

> Quiet games for loud minds. Est. after midnight.

## Games

| Game | Route | Controls | Notes |
| --- | --- | --- | --- |
| **Snake** | `/snake/` | `←↑↓→` or `WASD` | 20×20 grid. Eat, grow, don't bite your tail. |
| **Asteroid Destroyers** | `/asteroid-destroyers/` | `←→` / `A` `D` to move, `↑` / `W` / `Space` to fire | Ship has 10 health; every rock that gets past you costs 1. Asteroids wrap horizontally. |
| **Tetris** | `/tetris/` | `←→` move · `↑` rotate · `↓` soft drop · `Space` hard drop | 10×20 board, 7 tetrominoes. Keyboard only — the lobby labels it `DESKTOP`. |
| **Leaderboard** | `/leaderboard/` | — | Best score per player, per game. |

Guests can play; scores are only recorded for logged-in users.

## Requirements

- Python 3.10+
- [Pillow](https://pillow.readthedocs.io/) (pulled in by `requirements.txt`, needed for `ImageField`)

## Setup

```bash
git clone https://github.com/ciancomerford21-spec/Playground.git
cd Playground

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

Then open <http://127.0.0.1:8000/>.

A `db.sqlite3` is committed to the repo, so the app is playable immediately after
`migrate` — but you'll want to delete it and re-migrate if you want a clean database.

`python manage.py check` passes clean on the current code.

## How it fits together

```
Playground/
├── manage.py
├── requirements.txt
├── raven_arcade/          # project config
│   ├── settings.py        # SQLite, templates/ + static/, media/
│   └── urls.py            # admin/ + arcade/, plus media serving in DEBUG
├── arcade/                # the app
│   ├── models.py          # Profile, GameScore
│   ├── views.py           # pages, auth, the score API
│   ├── urls.py
│   ├── forms.py           # ProfileForm (profile picture upload)
│   ├── admin.py
│   └── migrations/
├── templates/             # base.html + one per page
├── static/
│   ├── css/               # site.css + one per game
│   └── js/                # snake.js, asteroids.js, tetris.js
└── media/profile_pictures/
```

### Data model

- **`Profile`** — `OneToOne` to the user, holds `profile_picture` (`ImageField`, uploads to
  `media/profile_pictures/`).
- **`GameScore`** — FK to user, `game` slug (`snake`, `asteroid_destroyers`, `tetris`),
  `score`, `created_at`. Ordered by `-score, created_at`, so the newest of equally-good runs
  ranks first. Every personal best is kept as a row; the views aggregate with `Max()`.

### Score saving

One endpoint handles all three games: `POST /scores/snake/`.

```json
{ "game": "asteroid_destroyers", "score": 1420 }
```

It requires login and a valid CSRF token, validates the game slug and a `0 ≤ score ≤ 1_000_000`
range, and only writes a row when the score beats the player's previous best. The response is
`{ "user_score": ..., "global_score": ... }`, which the JS uses to update the on-screen
"Your high score" and "All-time high" panels. The URL is named `save_score` and the
`game` field is what actually selects the table row — the path segment is vestigial, kept
because all three scripts share it.

## Configuration notes

`raven_arcade/settings.py` is set up for local development and is **not** production-safe as
committed:

- `SECRET_KEY` is a hardcoded literal
- `DEBUG = True`
- `ALLOWED_HOSTS` is `localhost`, `127.0.0.1`, `testserver`
- Media is served by Django itself via `static()` — fine in DEBUG, not behind a real web server

Move the secret key and `DEBUG` to environment variables before deploying anywhere.

## Admin

`/admin/` exposes both models. `GameScore` is filterable by game and date and searchable by
username; `Profile` is searchable by username and email.

## Known rough edges

- `db.sqlite3`, `__pycache__/`, and uploaded `media/` files are committed. A `.gitignore` would
  be worth adding.
- The lobby card counter reads "02 GAMES ONLINE" while three games are playable.
- The `RavenArcade/` directory at the repo root is empty and unreferenced.
- Only `Profile` and `GameScore` exist — no game-state persistence, so an interrupted run is lost.
- `templates/asteroid_destroyers.html` writes the auth flag as a literal `true`/`false` string
  assignment while the other two templates use `{{ user.is_authenticated|yesno:"true,false" }}`.
  Same result, three different ways of saying it.
