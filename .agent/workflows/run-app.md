---
description: How to run the RideGuard application
---

1. Open a terminal in the project directory.
2. Install dependencies (if not already done):
```powershell
npm.cmd install
```
3. Start the backend server:
```powershell
$env:NODE_ENV='development'; npx.cmd tsx server/index.ts
```
4. In a separate terminal, start the Expo web app:
```powershell
npx.cmd expo start --web --localhost
```
5. Open your browser to `http://localhost:8081`.
