# bookcat-api

A Node.js and Express backend app, built up one session at a time for **BED OCT26** (Backend Development, Ngee Ann Polytechnic).

This repository is a **reference for the teaching team and for students**. The code you see here is exactly what was built in class, up to the most recent session taught.

## How the repo is organised

There is one branch, `main`, and each session ends at a **tag**. A tag is a labelled snapshot of the whole project at that moment.

Each session has an IPL (the 3-hour class) and an OAL (the 1-hour online work before the next class).

| Tag | What the code looks like |
|---|---|
| `s01-oal-end` | Node, npm and Express running. `GET /` and `GET /categories` (a hardcoded array). This is also the starting point for Session 2. |
| `s02-ipl-end` | The live-coded routes against the NP Bookstore `Author` table: `GET /authors`, `GET /authors/:id`, `POST`, `PUT` and `DELETE`, each with `try / catch / finally`, `parseInt`, bound inputs and the right status code. |

More tags are added here as each session is taught.

## Run it

You need Node.js installed.

```bash
git clone <this repo's URL>
cd bookcat-api
npm install
npm start
```

From Session 2 onward the routes need the **NP Bookstore** database on your own SQL Server. Put your own login in `dbConfig.js`. Do not commit a real password.

Then open <http://localhost:3000/> in a browser. The files in `requests/` list the requests for each session.

## Look at a session, or live-code it

You do not need to be a collaborator, and you cannot push to this repo. Clone it and work on your own copy.

```bash
# See the code exactly as it was at the end of a session (read-only view)
git checkout s01-oal-end

# Start a session live, from where the previous one ended
git switch -c my-demo s01-oal-end

# See what changed between two points
git diff s01-oal-end s02-ipl-end

# Return to the latest code
git switch main
```

You can also download any tag as a zip from the repository's **Releases** or **Tags** page on GitHub.

## Conventions

- The database is **NP Bookstore** (SQL Server).
- CommonJS (`require`), not ES modules.
- Every response uses `res.status(code).json({ ... })`. The only exception is DELETE, which sends `res.status(204).send()`.
- Ids and numeric query values are converted with `parseInt`.
