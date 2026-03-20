# React + Vite

This project uses React + Vite + Tailwind CSS and includes a basic login flow wired for a Laravel backend.

## Setup

1) Create a local env file:

- Copy `.env.example` to `.env`
- Update `VITE_API_BASE_URL` (your Laravel URL, e.g. `http://localhost:8000`)
- Choose auth mode with `VITE_AUTH_MODE`:
  - `sanctum` (cookie-based SPA auth, recommended for Laravel)
  - `token` (expects a bearer token from `POST /api/login`)

2) Run the app:

- `npm run dev`

## Backend expectations (Laravel)

- `GET /api/user` returns the authenticated user (Sanctum: `auth:sanctum`, Token: `auth:api`/`auth:sanctum`).
- Login:
  - Sanctum mode: `GET /sanctum/csrf-cookie` then `POST /login`
  - Token mode: `POST /api/login` returns `{ token, user }`
- Logout:
  - Sanctum mode: `POST /logout`
  - Token mode: `POST /api/logout`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
