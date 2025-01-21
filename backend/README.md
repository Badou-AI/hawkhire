# HawkHire Backend

Local FastAPI backend for the HawkHire application. This server handles internal processing before communicating with the remote API.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your configuration:
```env
# Environment variables
REMOTE_API_URL=http://147.79.115.55:8000
```

## Running the Server

Start the FastAPI server with:
```bash
uvicorn app.main:app --reload --port 8080
```

The server will be available at `http://localhost:8080`

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation: `http://localhost:8080/docs`
- ReDoc documentation: `http://localhost:8080/redoc`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── requirements.txt
└── README.md
```

## Adding New Endpoints

Add new endpoints in `app/main.py`. Example:

```python
@app.post("/process-data")
async def process_data(data: dict):
    # Add your processing logic here
    return {"processed": data}
```
