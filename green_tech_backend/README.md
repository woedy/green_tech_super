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
   Create a `.env` file in the project root with the following variables:
   ```
   DJANGO_SECRET_KEY=your-secret-key-here
   DJANGO_DEBUG=True
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

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
