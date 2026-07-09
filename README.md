# neucbot-web

Web API for [neucBOT](https://github.com/shawest/neucbot) — a tool for calculating
(alpha,n) neutron yields and energy spectra.

## Project Structure

```
neucbot-web/
├── app/
│   ├── main.py                  # FastAPI app, router registration
│   ├── routers/
│   │   ├── alpha_lists.py       # GET+POST /api/alpha_lists
│   │   ├── chain_lists.py       # GET+POST /api/chain_lists
│   │   ├── materials.py         # GET /api/materials
│   │   └── views.py             # GET / (web UI)
│   ├── models/
│   │   ├── requests.py          # Pydantic request schemas
│   │   └── responses.py         # Pydantic response schemas
│   ├── services/
│   │   └── neucbot.py           # neucBOT calculations
│   ├── static/
│   │   └── app.js               # Frontend JavaScript (Alpine.js components)
│   └── templates/
│       ├── base.html            # Base layout
│       ├── index.html           # Main calculator page
│       └── partials/            # Jinja2 template partials
├── requirements.txt
└── Dockerfile
```

## Local Development

### Docker (recommended)

```bash
# Build the image
make build

# Run
make run
```

Visit `localhost:8080/docs` in your browser to inspect and test the API endpoints

### Python

Alternatively, this project can be run using Python.

#### Prerequisites

- `python` (v3.14 preferred)
- [neucbot](https://github.com/shawest/neucbot) cloned locally

#### Symlinking `neucbot` Files

Since `neucbot` is not currently published on PyPI, the project needs to be cloned
on your machine, and some directories need to be symlinked to the correct paths.

*Within your neucbot directory*, run the following:

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate # on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download all available ENSDF files to AlphaLists/
python preprocess_ENSDF.py

# Download and extract TalysSlim data
curl -sL https://github.com/mpiercy827/talys_slim/archive/refs/tags/v0.0.1.tar.gz -O

tar -xvf v0.0.1.tar.gz

mv talys_slim-0.0.1/TalysSlim ./Data

rm -rf talys_slim-0.0.1 v0.0.1.tar.gz
```

Then, from *within your neucbot-web directory*, run the following:

```bash
# Symlink required files
ln -s /path/to/neucbot/AlphaLists ./AlphaLists
ln -s /path/to/neucbot/Chains ./Chains
ln -s /path/to/neucbot/Data ./Data
ln -s /path/to/neucbot/neucbot ./neucbot
```

#### Running neucbot-web locally

Once all the necessary files have been symlinked, the dev server can be spun up.

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
fastapi dev app/main.py
```

The API will be available at http://localhost:8000.
Interactive docs (Swagger UI) will be at http://localhost:8000/docs.

## Deployments

To deploy this application to the ucr-ursa-major-sbc Google Cloud project, run:

```bash
make deploy
```

A deployment (which requires Docker to be installed locally) runs the following steps:

1. Builds a Docker image
2. Pushes that image to the neucbot-web image registry
3. Deploys the latest image using `gcloud run deploy`

For more information, see the `Makefile`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Web UI |
| GET | `/health` | Health check |
| GET | `/api/alpha_lists` | Lists elements available for alpha list calculations |
| POST | `/api/alpha_lists` | Calculate neutron yield for a list of alpha energies |
| GET | `/api/chain_lists` | Lists available chain lists for chain lists calculations |
| POST | `/api/chain_lists` | Calculate neutron yield for a decay chain |
| GET | `/api/materials` | Lists available preloaded materials |

See `/docs` for full request/response schemas and example payloads.

## TODO

- [ ] Add unit tests for backend + frontend components
