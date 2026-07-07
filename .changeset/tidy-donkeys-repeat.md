---
"@anticapture/api": patch
---

Fix SQL injection pattern in proposals-activity repository: proposal IDs in the getUserVotes IN clause are now bound parameters instead of string-interpolated raw SQL
