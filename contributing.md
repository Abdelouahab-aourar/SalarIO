# CONTRIBUTING

This document defines the **default workflow for contributing to this repository** using:

- **Branches + Pull Requests**

---

## 1) Non-negotiable rules

1. **`main` is the default branch** (protected)
    - ✅ Changes land via Pull Request (PR)
    - ❌ No direct pushes, no direct merges to `main`
2. **`dev` is the integration branch.** Branch from `dev` and open PRs to `dev`.
3. All work happens on a separate branch, never on `main` or `dev`, the branch must be named after each person.

---

## 2) Contribution flow

### 2.1 Update `dev` and create a branch

```bash
git switch dev
git pull origin dev

git switch -c abdelouahab
```

### 2.2 Commit rules (emoji is mandatory)

**Commit format (required)**

```
<emoji> <type>(scope): short description
```

**Examples**

- `✨ feat(profile): add avatar upload`
- `🐛 fix(auth): prevent crash on empty token`
- `🧹 refactor(api): simplify error mapping`
- `📝 docs(readme): update setup instructions`
- `🚀 ci(github): speed up cache strategy`

**Emoji mapping**

| Emoji | Type | Meaning |
|-------|------|---------|
| ✨ | `feat` | feature |
| 🐛 | `fix` | bug fix |
| ❌ | `breaking` | breaking change |
| 🧹 | `refactor` | refactor / cleanup |
| 🏗️ | `build` | build config |
| 📝 | `docs` | documentation |
| 🗑️ | `chore` | chore / remove |
| 🧪 | `test` | tests |
| 🚀 | `ci` | CI / pipeline |

✅ Keep commits small and reviewable:

```bash
git commit -m "✨ feat(profile): add avatar picker UI"
```

### 2.3 Push to your branch

```bash
git push -u origin abdelouahab
```

### 2.4 Open a Pull Request (PR) to `dev`

- Base: `dev`
- Compare: your branch

### 2.5 Keep your branch up to date

```bash
git switch abdelouahab
git pull origin dev
git push
```

---


## 3) Quick cheatsheet

**Start**

```bash
git switch dev
git pull origin dev
git switch -c abdelouahab
```

**Commit**

```bash
git commit -m "✨ feat(scope): short description"
```

**PR**

```bash
git push -u origin abdelouahab
```

**Update**

```bash
git switch abdelouahab
git pull origin dev
git push
```
