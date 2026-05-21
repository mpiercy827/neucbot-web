# neucbot-web

Web API for [neucBOT](https://github.com/shawest/neucbot) — a tool for calculating
(alpha,n) neutron yields and energy spectra.

## Project Structure

```
neucbot-web/
├── app/
│   ├── main.py                  # FastAPI app, router registration
│   ├── routers/
│   │   ├── alpha_lists.py       # POST /api/alpha_lists
│   │   └── chain_lists.py       # POST /api/chain_lists
│   ├── models/
│   │   ├── requests.py          # Pydantic request schemas
│   │   └── responses.py         # Pydantic response schemas
│   └── services/
│       └── neucbot.py           # neucBOT invocation and output parsing
├── requirements.txt
└── Dockerfile
```

## Local Development

### Prerequisites

- Python 3.11+
- neucBOT cloned and set up (see [neucBOT README](https://github.com/shawest/neucbot))

### Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Point the app at your local neucBOT installation
export NEUCBOT_PATH=/path/to/neucbot/neucbot.py
export NEUCBOT_DATA_PATH=/path/to/neucbot/Data

# Start the development server
fastapi dev app/main.py
```

The API will be available at http://localhost:8000.
Interactive docs (Swagger UI) will be at http://localhost:8000/docs.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/alpha_lists` | Calculate neutron yield for a list of alpha energies |
| POST | `/api/chain_lists` | Calculate neutron yield for a decay chain |

See `/docs` for full request/response schemas and example payloads.

## Docker

```bash
# Build the image (includes compiling TALYS from source)
docker build -t neucbot-web .

# Run
docker run -p 8000:8000 neucbot-web
```

Note: the Docker build clones and compiles TALYS automatically.
The neucBOT repo should be present at `./neucbot` relative to this project
before building (it is copied into the image at `/opt/neucbot`).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEUCBOT_PATH` | `/opt/neucbot/neucbot.py` | Path to the neucbot.py script |
| `NEUCBOT_DATA_PATH` | `/opt/neucbot/Data` | Path to neucBOT's Data directory |
| `TALYS_PATH` | `/opt/talys/structure` | Path to TALYS structure data directory |
