from setuptools import setup, find_packages

setup(
    name="green_tech_backend",
    version="0.1",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'Django>=4.2.0',
        'djangorestframework>=3.14.0',
        'djangorestframework-simplejwt>=5.3.0',
        'django-cors-headers>=4.3.0',
        'python-dotenv>=1.0.0',
        'drf-yasg>=1.21.0',
    ],
    python_requires='>=3.8',
)
