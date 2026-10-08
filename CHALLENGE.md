# The Rigged Showcase

**Category:** Web · XS-Leaks
**Flag format:** exactly 29 characters

---

> Welcome to the annual **Global Developer Showcase**!
>
> You've spent months building the perfect web project, but rumors are circulating
> that the judging is completely rigged this year. If you want any chance of winning,
> you can't rely on playing fair. You need to get admin access and manually shortlist
> your project yourself.
>
> To pull this off, you'll need the Head Judge's **master password** (which is the flag).
>
> Here is how the judging works: you submit your project HTML to the evaluation portal.
> Shortly after, the automated **Head Judge bot** — who is fully authenticated as an
> admin — will visit your submission to "review" your work.
>
> Take a very close look at how the portal's `/result` endpoint handles password checks.
> Can you weaponize your submitted project to trick the bot into giving up the password
> when it visits?

---

## What you have

| URL | Purpose |
| --- | --- |
| `http://localhost:9000` | The judging portal. Upload your `.html` here. |
| `http://localhost:9001` | Where your uploaded HTML is served to the bot. |

Your HTML file runs **inside the Head Judge's browser**, which is logged in
as admin on `localhost:9000`. Anything your script does — fetch, iframe,
image load, navigation — carries the admin session for that origin.

## Goal

Leak the Head Judge's **23-character** master password.

## Hints

**Hint 1 — Look at the oracle.**
The portal's `/result` endpoint compares your input against the password
character by character and returns an HTML page. Look closely at what
that page contains.

**Hint 2 — You can load, but you can't read.**
Your HTML runs on `localhost:9001`. The portal lives on `localhost:9000`.
Different ports = **different origins**. You can load things from the
portal inside your page, but the same-origin policy stops you from reading
the response body directly.

**Hint 3 — Some things are readable cross-origin.**
Certain properties of a loaded iframe are still readable even when the
iframe is cross-origin. One of them is about how many child frames the
iframe has.

**Hint 4 — Brute-force one character at a time.**
The number of hidden iframes equals the number of matching prefix
characters in your guess. Find the character at position 0, then
position 1, then position 2, and so on until you have all 23.

## Reporting your findings

The bot does not read your browser's `console.log`. To send findings
back to yourself (so they show up on your run page), POST them to:

    http://localhost:9000/report/ID

where ID is the same id you see in the URL of your run page.
Whatever you POST will appear in the terminal-style result card once the
bot finishes (or when the 5-minute timer runs out).

## Notes

- The bot's browser is a **fresh session per submission**. Cookies from one
  run do not persist to the next.
- The bot waits up to **90 seconds** per submission. Be efficient.
- Only `.html` files up to 1 MB are accepted.

---

## Flag

Exactly 29 characters total. Example shape: `FLAG{xxxxxxxxxxxxxxxxxxxxxxx}`.
