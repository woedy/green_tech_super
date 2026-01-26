# Financial Tools API Documentation

This document provides a comprehensive guide to the Financial Tools API, which includes endpoints for managing financing options, government incentives, payment plans, and ROI calculations.

## Base URL
All API endpoints are prefixed with `/api/v1/finances/`.

## Authentication
All endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Financing Options

#### List Financing Options

```
GET /financing-options/
```

**Query Parameters:**
- `loan_amount` (optional): Filter options by loan amount range

**Example Request:**
```http
GET /api/v1/finances/financing-options/?loan_amount=50000
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Green Home Loan",
    "description": "Special loan for eco-friendly homes",
    "interest_rate": "3.50",
    "min_loan_amount": "10000.00",
    "max_loan_amount": "1000000.00",
    "min_loan_term": 12,
    "max_loan_term": 360,
    "is_active": true
  }
]
```

### Government Incentives

#### List Government Incentives

```
GET /government-incentives/
```

**Query Parameters:**
- `property_type` (optional): Filter by property type ID
- `eco_features` (optional): Comma-separated list of eco feature IDs

**Example Request:**
```http
GET /api/v1/finances/government-incentives/?property_type=1&eco_features=1,2
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Solar Panel Rebate",
    "incentive_type": "rebate",
    "description": "Government rebate for solar panel installation",
    "amount": "2000.00",
    "is_percentage": false,
    "min_qualifying_amount": "10000.00",
    "eligible_property_types": [1],
    "eligible_eco_features": [1],
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "is_active": true,
    "application_url": "https://example.com/rebates/solar",
    "documentation_required": "Proof of purchase, installation certificate"
  }
]
```

#### Check Eligibility

```
POST /government-incentives/check-eligibility/
```

**Request Body:**
```json
{
  "property_id": 1
}
```

**Response (200 OK):**
```json
{
  "eligible_incentives": [
    {
      "id": 1,
      "name": "Solar Panel Rebate",
      "amount": "2000.00",
      "incentive_type": "rebate",
      "application_url": "https://example.com/rebates/solar"
    }
  ]
}
```

### Payment Plans

#### List Payment Plans

```
GET /payment-plans/
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "5-Year Fixed",
    "description": "5-year fixed payment plan",
    "down_payment_percentage": "20.00",
    "interest_rate": "4.50",
    "term_months": 60,
    "payment_frequency": "monthly",
    "is_active": true
  }
]
```

#### Calculate Payment

```
POST /payment-plans/calculate/
```

**Request Body:**
```json
{
  "amount": "100000.00",
  "interest_rate": "5.0",
  "term_months": 360,
  "down_payment": "20000.00",
  "payment_frequency": "monthly"
}
```

**Response (200 OK):**
```json
{
  "loan_amount": "80000.00",
  "down_payment": "20000.00",
  "payment_amount": "429.46",
  "payment_frequency": "monthly",
  "total_interest": "74605.60",
  "total_payment": "154605.60",
  "term_months": 360
}
```

### ROI Calculations

#### Calculate ROI

```
POST /roi-calculations/calculate/
```

**Request Body:**
```json
{
  "initial_cost": "10000.00",
  "annual_savings": "1500.00",
  "lifespan_years": 10,
  "maintenance_cost_per_year": "100.00"
}
```

**Response (200 OK):**
```json
{
  "initial_cost": "10000.00",
  "annual_savings": "1500.00",
  "lifespan_years": 10,
  "maintenance_cost_per_year": "100.00",
  "total_savings": "14000.00",
  "roi_percentage": 40.0,
  "payback_period_years": 7.14,
  "is_viable": true
}
```

### Payment Schedules

#### List Payment Schedules

```
GET /payment-schedules/
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "payment_plan": 1,
    "property": 1,
    "project": 1,
    "payment_amount": "1500.00",
    "payment_date": "2023-06-15",
    "status": "pending",
    "created_at": "2023-05-15T10:00:00Z",
    "updated_at": "2023-05-15T10:00:00Z"
  }
]
```

#### Create Payment Schedule

```
POST /payment-schedules/
```

**Request Body:**
```json
{
  "payment_plan": 1,
  "property": 1,
  "project": 1,
  "payment_amount": "2000.00",
  "payment_date": "2023-07-15",
  "status": "pending"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "payment_plan": 1,
  "property": 1,
  "project": 1,
  "payment_amount": "2000.00",
  "payment_date": "2023-07-15",
  "status": "pending",
  "created_at": "2023-05-15T10:30:00Z",
  "updated_at": "2023-05-15T10:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Rate Limiting
- 1000 requests per hour per user for read operations
- 100 requests per hour per user for write operations
