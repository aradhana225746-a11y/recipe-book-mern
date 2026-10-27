# Savour — MERN Recipe Book

A responsive recipe journal built with MongoDB Atlas, Express, React and Node.js.

## Project structure
- `frontend/` — React + Vite recipe journal
- `backend/` — Express REST API + Mongoose model
- Root `package.json` — npm workspaces

## Run locally
1. Install Node.js 18 or newer.
2. Create a **test-only** MongoDB Atlas cluster, database user, and configure Network Access to allow your IP.
3. Replace the deliberately unusable placeholder `MONGODB_URI` in `backend/.env` with your own **test** Atlas database URI. Do not put production secrets in a public repository.
4. From the repository root run:
```bash
npm install
npm run dev
```
5. Open http://localhost:5173. Backend is http://localhost:5000. Vite proxies `/api` to the backend.

Both frontend and backend have committed `.env` files with safe placeholder values. For a separate frontend host set `VITE_API_URL` to its full API endpoint before building.

## API
| Method | Endpoint | Function |
| --- | --- | --- |
| GET | /api/recipes | List recipes |
| GET | /api/recipes/:id | Recipe details |
| POST | /api/recipes | Create |
| PUT | /api/recipes/:id | Update |
| DELETE | /api/recipes/:id | Delete |
| GET | /api/health | Check DB connection |

Example POST/PUT JSON:
```json
{
  "name": "Lemon Pasta",
  "category": "Dinner",
  "ingredients": ["200 g pasta", "1 lemon"],
  "preparationSteps": ["Boil pasta.", "Mix with lemon."],
  "cookingTime": 20
}
```

Features: validated create/edit form, responsive recipe cards, details modal, search, category filter, deletion confirmation, loading/error notices and automatic re-fetch following every write.

**Important:** The included database URI is a dummy, not a working Atlas connection. Configure a dedicated test database to verify end-to-end functionality.
