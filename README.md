# SRM Full Stack Engineering Challenge

Monorepo with:

- `apps/frontend`: Next.js frontend
- `apps/backend`: Express.js API

## Setup

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.
Backend runs on `http://localhost:3001`.

## API

`POST /bfhl`

Example body:

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```
