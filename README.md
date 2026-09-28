# TrueReach

Advertising board management platform. Tracks real-world foot traffic at digital
ad boards using on-device computer vision, and reports impressions to the backend.

## Layout

```
TrueReach/
├── backend/      Node + Express + MongoDB API
├── frontend/     React 19 + Vite + Tailwind dashboard
├── ai-module/    Python + Ultralytics YOLO impression tracker
└── venv/         Shared Python virtualenv (ai-module only)
```

The virtualenv lives at the project root rather than inside `ai-module/` because
Python virtual environments are not relocatable: every script in `venv/bin` has an
absolute path baked into its shebang. Keeping it at a stable top-level location
avoids having to rebuild it whenever the module folders change.

## Setup

The Python venv is already created. If you ever need to rebuild it:

```bash
python3 -m venv venv
./venv/bin/pip install -r ai-module/requirements.txt
```

Activate it with `source venv/bin/activate`, or call the interpreter directly:

```bash
./venv/bin/python ai-module/tracker.py
```

### Backend

```bash
cd backend
cp .env.example .env     # then fill in MONGO_URI and JWT_SECRET
npm install
npm run seed             # optional: load sample data
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI module

```bash
cp ai-module/.env.example ai-module/.env   # then fill in IDs and manager credentials
```

`ai-module/.env` must be read from the `ai-module` directory, since `config.py`
calls `load_dotenv()` against the working directory. Run the tracker from there:

```bash
cd ai-module
../venv/bin/python tracker.py
```

## Environment variables

Real `.env` files are gitignored. Templates are committed as `.env.example` in
both `backend/` and `ai-module/` — copy them to `.env` and fill in the values.

## Roles

The app has four roles: super admin, city manager, advertiser, and the on-site
tracker device. The tracker authenticates over HTTP as a city manager, so
`MANAGER_EMAIL` in `ai-module/.env` must be an existing citymanager account that
owns the city where the board is installed.
