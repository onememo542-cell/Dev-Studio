# Changelog

All notable changes to Dev Studio will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — 2026-05-23

### Added

- **Activity log** — every action you take in the app (creating prompts, running agents, updating jobs, logging in, etc.) is now silently recorded. This powers future features like a personal history feed, undo support, and admin oversight.

- **Notifications system** — the foundation for in-app alerts is now in place. The app can now deliver targeted notifications such as "your agent finished running", "a planner task is overdue", or "your CV was generated" — with read/unread state and one-click deep-links to the relevant resource.

### Security

- Both new features are protected with Row-Level Security: you can only ever see your own activity and your own notifications. The server is the only party allowed to write to these records — no client-side tampering is possible.

---

*Older history predates this changelog. Run `git log --oneline` to see full commit history.*
