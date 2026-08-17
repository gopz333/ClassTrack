# ClassTrack

ClassTrack is a role-based academic monitoring platform for Students, Faculty, HOD, Academic Office and Management.

## Features
- Role-based login
- Faculty login using **Faculty ID or email**
- Faculty-specific timetable
- Start/end live classes
- Two-minute OTP attendance
- Duplicate and section validation
- Syllabus progress tracking
- Smart academic alerts
- Student feedback
- Signed expiring authentication tokens
- Passwords stored as scrypt hashes
- Production build served directly by the Node server

## Run locally

```bash
npm install
npm run build
npm run server
```

Open `http://localhost:5000`.

For development with Vite hot reload:

```bash
npm run dev:all
```

## Demo accounts

All demo accounts use the password configured by `DEMO_PASSWORD` (default: `demo123`).

### Faculty
- `FAC001` / `parameswari@fxec.edu.in`
- `FAC002` / `soundariya@fxec.edu.in`
- `FAC003` / `angeline@fxec.edu.in`
- `FAC004` / `lincy@fxec.edu.in`
- `FAC005` / `gomathiselvi@fxec.edu.in`
- `FAC006` / `merlin@fxec.edu.in`
- `FAC007` / `janet@fxec.edu.in`

### Other demo roles
- Student: `STU001` / `student@demo.com`
- HOD: `HOD001` / `hod@demo.com`
- Academic: `ACA001` / `academic@demo.com`
- Official: `OFF001` / `admin@demo.com`

Password: `demo123` unless changed with `DEMO_PASSWORD` before first initialization.

## Production setup

1. Copy `.env.example` to `.env`.
2. Set a strong random `AUTH_SECRET`.
3. Set a non-default `DEMO_PASSWORD` if demo accounts are exposed.
4. Use HTTPS through your hosting provider/reverse proxy.
5. Replace demo accounts with real institutional accounts before production use.
6. For multi-instance institutional production, replace the JSON datastore with PostgreSQL/MySQL and managed storage.

The current JSON datastore is appropriate for a college demo or single-server deployment; it is not intended for high-concurrency institutional production.

## Easiest public deployment: Render

The repository includes `render.yaml`. Create a new Blueprint/Web Service from this project in Render and it will build the Vite frontend and run the Node server as one public service.

After deployment, your public address will look like `https://classtrack-xxxx.onrender.com`.

For a real institution, do not publish the demo credentials. Create proper faculty accounts and move the datastore to PostgreSQL before relying on it for official attendance records.
