# The Rigged Showcase

A web challenge.

- Portal:    http://localhost:9000
- User host: http://localhost:9001
- Flag:      FLAG{<23-character secret>}

## Run

1. Edit `.env`:
   - `SECRET=` → a 23-character secret string
   - `FLAG=`   → `FLAG{}` with that same secret inside the braces
2. `docker compose up --build`
3. Open http://localhost:9000

## Reset

    rm -rf showcase/shared/uploads/* showcase/shared/reports/*

See `CHALLENGE.md` for the player-facing statement and `solve/exploit.html`
for a reference solution.
