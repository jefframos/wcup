# World Cup 2026 UK TV Guide

Upload these files to the root of your GitHub Pages repo.

This fixed version:
- removes the old service-worker cache, so the phone page actually updates
- starts on the current day every time you open it
- uses previous/next calendar day buttons based on the selected day
- uses flag chips for followed-team filters instead of typing

Edit `FOLLOWED_TEAMS` inside `index.html` to change the teams shown as flags.

After pushing to GitHub Pages, open the page on your phone and hard refresh once. If you added it to Home Screen already, delete the old Home Screen shortcut and add it again.
