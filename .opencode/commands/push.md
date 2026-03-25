---
description: Commit all changes and push to GitHub
---

Stage all changes, create a commit with a concise message summarizing what changed, then push to the current branch on GitHub.

1. Run `git status` and `git diff` to review all changes
2. Run `git log --oneline -5` to match the commit message style
3. Stage everything with `git add -A`
4. Create a commit with a short, descriptive message (no body unless the change is complex)
5. Push to the remote with `git push`

If the push is rejected due to being behind, run `git pull --rebase` then push again.

Do not ask for confirmation — just do it.
