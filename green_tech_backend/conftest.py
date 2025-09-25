import os

def pytest_configure():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    import django  # noqa: WPS433

    django.setup()
