# Green Tech Africa - Backend

This is the backend for the Green Tech Africa platform, built with Django and Django REST Framework.

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd green_tech_backend
   ```

2. **Set up a virtual environment**
   ```bash
   # Windows
   python -m venv .venv
   .\.venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Copy the example configuration and tweak values as needed:
   ```bash
   cp .env.example .env
   ```
   The `.env.example` file documents required settings such as the Django secret key,
   PostgreSQL credentials, Redis URL, and allowed frontend origins.

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Load demo fixtures (optional but recommended for the investor demo)**
   ```bash
   python manage.py loaddata \
     locations/fixtures/default_regions.json \
     plans/fixtures/sample_plans.json \
     plans/fixtures/sample_plan_assets.json \
     properties/fixtures/sample_properties.json \
     properties/fixtures/sample_property_images.json
   ```

7. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run the development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

8. **Test the authentication flow**
   ```bash
   # Register a user (returns a success message and triggers an email via Celery)
   http POST http://localhost:8000/api/v1/accounts/register/ \
     email==user@example.com password==Testpass123! confirm_password==Testpass123! \
     first_name==Demo last_name==User

   # Use the uid/token from the console email to verify the account
   http POST http://localhost:8000/api/v1/accounts/verify-email/ uid==<uid> token==<token>

   # Exchange credentials for JWTs
   http POST http://localhost:8000/api/v1/accounts/login/ email==user@example.com password==Testpass123!
   ```

## Docker (recommended for local dev)

The repository includes a `docker-compose.yml` that wires up PostgreSQL, Redis, the
Django API, and the React frontend.

```bash
docker compose up --build
```

Environment variables can be overridden by creating a `.env` file (copied from
`.env.example`) before running the command.

## Project Structure

- `accounts/`: User authentication and profile management
- `properties/`: Property listings and management
- `construction/`: Construction project management
- `quotes/`: Quote generation and management
- `sustainability/`: Sustainability scoring and features
- `ghana/`: Ghana-specific data and localization
- `core/`: Project settings and configurations

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Development Workflow

1. Make your changes
2. Run tests: `python manage.py test`
3. Create and apply migrations: 
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. Run the development server: `python manage.py runserver`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
