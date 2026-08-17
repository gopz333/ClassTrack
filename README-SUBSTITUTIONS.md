# ClassTrack 2.0 — Substitute Faculty Feature

## What was added
- HOD dashboard now shows current substitute assignments.
- HOD has a dedicated Substitute Classes page.
- HOD can assign a substitute faculty member to any timetable class.
- Prevents assigning the original faculty as their own substitute.
- Prevents a substitute from being assigned when they already teach another class at the same time.
- Prevents duplicate substitution assignments for the same class.
- Faculty dashboards/timetables show assigned substitution classes.
- Substitute faculty can start the assigned class and use the existing OTP attendance flow.
- Students continue using the normal attendance flow.
- HOD can remove a substitution when no active class is using it.
- Existing database files are migrated automatically by adding the substitutions collection.

## Run
From the ClassTrack folder:

```powershell
npm install
npm run dev:all
```

Then open the Vite URL shown by the terminal.

For the HOD demo:
- ID: HOD001
- Password: demo123

For faculty:
- ID: FAC001 ... FAC007
- Password: demo123
