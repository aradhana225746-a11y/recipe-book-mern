# Savour — MERN Recipe Book

A responsive recipe journal built with MongoDB Atlas, Express, React and Node.js.

## Project structure
- `frontend/` — React + Vite recipe journal
- `backend/` — Express REST API + Mongoose model
- Root `package.json` — npm workspaces

## Run locally
1. Install Node.js 18 or newer.
2. Create a **test-only** MongoDB Atlas cluster, database user, and configure Network Access to allow your IP.
3. Keep the committed `backend/.env` as dummy configuration. Create a local `backend/.env.local` file (already ignored by Git) with your **test-only** Atlas connection URI. The local file overrides the dummy values without risking a public password commit:

```env
MONGODB_URI=mongodb+srv://aradhanarose1707_db_user:YOUR_TEST_PASSWORD@cluster0.avnewsh.mongodb.net/recipe_book?retryWrites=true&w=majority
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Replace `YOUR_TEST_PASSWORD` with your Atlas database-user password. URL-encode special characters in the password. Do **not** paste your password into GitHub or this chat. If reusing a cluster, grant the test user `readWrite` access only to `recipe_book` and allow your current IP in Atlas Network Access.
4. From the repository root run:
```bash
npm install
npm run dev
```
5. Open http://localhost:5173. Backend is http://localhost:5000. Vite proxies `/api` to the backend.

Both frontend and backend have committed `.env` files with safe placeholder values. A real test URI goes only in the Git-ignored `backend/.env.local`. For a separate frontend host set `VITE_API_URL` to its full API endpoint before building.

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

## Additional features
- **Cook Mode:** large step-by-step instructions, arrow-key navigation, progress and ingredient prep checklist (cooking progress is temporary; the recipes remain in MongoDB).
- **Persistent favorites:** `PATCH /api/recipes/:id/favorite` toggles `isFavorite` in MongoDB, with a favorites filter.
- **Persistent shopping list:** add ingredients from a recipe or manually, check items and remove them. Stored in a separate MongoDB collection; duplicate ingredient text is deduplicated case-insensitively.
- **Quick discovery:** Under-30-minute filter and Surprise Me recipe picker.

Shopping list API: `GET /api/shopping-list`, `POST /api/shopping-list` with `{ "ingredients": ["item"] }`, `PATCH /api/shopping-list/:id` with `{ "checked": true }`, `DELETE /api/shopping-list/:id`, and `DELETE /api/shopping-list/checked`.

These features keep all stored recipe and shopping-list data in MongoDB; only the temporary step and checklist positions during a cooking session live in browser memory.
