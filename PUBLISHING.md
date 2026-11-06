# Publishing (instructor only, never push this branch to the public repo)

## Set up once

Two remotes. `origin` is private and holds everything. `public` is what students and tutors see.

```bash
git remote add origin  <private repo URL>
git remote add public  <public repo URL>
git push origin --all --tags
```

## What lives where

| Item | Private (`origin`) | Public (`public`) |
|---|---|---|
| `main` and the session tags | Yes | Only up to the session already taught |
| `instructor` branch (this file, `teaching/`) | Yes | **Never** |
| `solutions/*` branches and their tags | Yes | Only when released (see below) |

Pushing a tag or branch publishes everything behind it. Never push a future commit to `public`.

## After each session is taught

Push `main` to `public` up to the tag just taught, then push the tags that exist so far.

```bash
git push public s02-oal-end:refs/heads/main
git push public s01-oal-end s02-ipl-end s02-oal-end
```

Replace `s02-oal-end` with the latest tag taught. Do not use `git push public --all` or `--tags`.

## Release schedule agreed so far

| What | When |
|---|---|
| Practice solution for a session (`sNN-practice-solution` on `solutions/sNN-practice`) | After the next session |
| Session 6 lab answer (`s06-lab-end`) | After the lab session |

To release a practice solution:

```bash
git push public solutions/s03-practice s03-practice-solution
```

`s06-lab-end` is on `main`, because it follows `s05-oal-end`. **Do not push `main` past `s05-oal-end` until the lab session is over**, and push the lab answer only then:

```bash
git push public s06-lab-end:refs/heads/main
git push public s06-lab-end
```

## Tag order on main

`s01-oal-end`, `s02-ipl-end`, `s02-oal-end`, `s03-ipl-end`, `s03-oal-end`, `s04-ipl-end`, `s04-oal-end`, `s05-ipl-end`, `s05-oal-end`, `s06-lab-end`.

Each practice solution branches from the matching `-ipl-end` tag (`s02` to `s05`). Sessions 3 to 5 have cold-read snippets and answers under `teaching/`.

## Adding a new session

1. Build on `main`, one commit per tag. Add the tag (`git tag -a s03-ipl-end -m "..."`).
2. Put the practice solution on `solutions/sNN-practice`, branched from the `-ipl-end` tag.
3. Put cold-read snippets and notes under `teaching/` on this branch, then `git rebase main` so it stays on top of the latest code.
4. Check that nothing real is in `.env`, and that `.env` is not tracked: `git ls-files | grep -x .env` should print nothing.
