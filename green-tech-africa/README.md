# Green Tech Africa – Frontend

## Local development

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Copy the example environment file and adjust values if necessary:
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_URL` points to the Django backend (defaults to `http://localhost:8000`).
   - `VITE_APP_ENV` can be used inside the app for environment-specific logic.

3. Start the dev server:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```

The React app is also wired into the root `docker-compose.yml`. Running `docker compose up` from the repository root will boot the frontend alongside the backend and infrastructure dependencies.

### Authentication helpers

- Use the registration form at `/auth/register` to create an account. The UI now calls the Django API and expects the verification email before login succeeds.
- After verifying via the emailed link, the login form exchanges credentials for JWTs and stores them in `localStorage` (key: `gta_auth_state`). Tokens automatically refresh when API calls return `401`.
