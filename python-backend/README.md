# MyRush Python Backend

FastAPI backend server with PostgreSQL database for the MyRush application.

## Features

- **FastAPI Framework**: Modern, fast Python web framework
- **PostgreSQL Database**: Direct connection to Supabase PostgreSQL
- **JWT Authentication**: Secure token-based authentication
- **SQLAlchemy ORM**: Database operations with Python objects
- **Pydantic Validation**: Request/response validation
- **CORS Support**: Cross-origin resource sharing enabled

## Prerequisites

- Python 3.8 or higher
- PostgreSQL database (Supabase)

## Installation

1. **Navigate to the python-backend directory:**
   ```bash
   cd python-backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create .env file:**
   ```bash
   copy .env.example .env
   ```
   
   Then edit `.env` with your actual configuration.

## Running the Server

**Development mode (with auto-reload):**
```bash
python server.py
```

The server will start on `http://localhost:5000`

**API Documentation:**
- Swagger UI: `http://localhost:5000/api/docs`
- ReDoc: `http://localhost:5000/api/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get current user profile (requires auth)

### Profile
- `POST /api/v1/profile/save` - Save/update user profile
- `GET /api/v1/profile/{phone_number}` - Get user profile by phone number

## Project Structure

```
python-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routes/              # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── profile.py
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── auth.py
├── .env                     # Environment variables
├── .env.example             # Example environment variables
├── requirements.txt         # Python dependencies
├── server.py               # Server entry point
└── README.md               # This file
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `PORT` - Server port (default: 5000)
- `HOST` - Server host (default: 0.0.0.0)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration time
- `CORS_ORIGINS` - Allowed CORS origins

## Database

The application connects to a PostgreSQL database using SQLAlchemy. Make sure your database has the required tables created. The application expects the following tables:

- `users` - User authentication data
- `profiles` - User profile information
- `user_profiles` - Extended user profile data

## Development

To add new features:

1. Create models in `app/models/`
2. Create schemas in `app/schemas/`
3. Create routes in `app/routes/`
4. Register routes in `app/main.py`

## Production Deployment

For production, use a production-grade ASGI server:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```
