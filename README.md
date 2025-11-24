# Sweet Home — Confectionery Management System

**Extensible inventory, POS, and financial analytics platform for confectioneries with Python/Quart backend**

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Quart](https://img.shields.io/badge/Quart-Async%20Flask-4B8BBE?style=for-the-badge&logo=python&logoColor=white)](https://quart.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge)](https://jwt.io/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-green?style=for-the-badge)](https://github.com)

**⚠️ Note:** _Experimental codebase with some unsafe patterns. Production use requires security hardening and refactoring._

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Python Backend](#-python-backend)
- [Data Structure](#-data-structure)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

A **full-stack confectionery management system** combining:
- **React Frontend** for real-time inventory, POS, and analytics
- **Python/Quart Backend** for secure authentication, JWT tokens, and receipt generation
- **Firebase Firestore** for data persistence
- **Modern DevOps** with CORS, environment variables, and secure headers

**Perfect for:** 🧁 Bakeries • 🍪 Confectioneries • 🎂 Pastry shops • 🍬 Candy makers

---

## 🏗 Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend                              │
│                    (Vite + React 18 + Tailwind)                     │
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │  Auth Service    │    │  PDV Service     │    │ Firestore    │ │
│  │  (JWT)           │    │  (Cart + Sales)  │    │ Service      │ │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬───────┘ │
└───────────┼───────────────────────┼────────────────────┼──────────┘
            │                       │                    │
            ▼                       ▼                    ▼
    ┌──────────────────┐   ┌───────────────┐   ┌──────────────────┐
    │ Quart Backend    │   │  Receipt Gen  │   │   Firestore      │
    │ (Port 3001)      │   │   (FPDF)      │   │   Database       │
    │                  │   │   (PyBarcode) │   │                  │
    │ • Auth Routes    │   │   (QR Code)   │   │ Collections:     │
    │ • JWT Validation │   │               │   │ • sweets         │
    │ • Sales Routes   │   │               │   │ • ingredients    │
    └──────────────────┘   └───────────────┘   │ • recipes        │
                                               │ • kitchenware    │
                                               │ • sales          │
                                               └──────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite | UI/UX, state management |
| **Frontend Build** | Tailwind CSS, Framer Motion | Styling, animations |
| **Backend** | Python 3.10+, Quart | Async web framework |
| **Auth** | JWT (quart-jwt-extended) | Token-based authentication |
| **Database** | Firebase Firestore | Real-time document store |
| **PDF Generation** | FPDF2 | Receipt generation |
| **Barcodes** | python-barcode | Code39 barcode creation |
| **QR Codes** | qrcode-python | Dynamic QR generation |
| **Security** | Werkzeug (password hashing) | scrypt password hashing |
| **CORS** | quart-cors | Cross-origin requests |
| **Server** | Quart (async) | Production-ready async WSGI |

---

## ✨ Key Features

### 📦 Inventory Management
- **Sweets**: Stock, pricing, expiry (color-coded), images, observations
- **Ingredients**: Purchase date, unit conversion, auto-calculated costs, expiry tracking
- **Kitchenware**: Quantity, condition badges, observations

### 💳 Point of Sale
- Real-time cart with Framer Motion animations
- Dynamic quantity controls
- QR code payment modal (extensible)
- PDF receipt generation (automatic or optional)
- Stock auto-decrement on sale finalization

### 📊 Financial Analytics
- Production cost calculation per sweet
- Profitability analysis (profit %, margin %)
- Inventory valuation (total stock value)
- Recharts visualizations

### 🔐 Authentication & Security
- **JWT-based** authentication (RS256 algorithm)
- **Scrypt password hashing** (Werkzeug)
- Email validation (email-validator)
- Username validation (3-50 chars)
- CORS protection with explicit origin whitelisting

### 🧾 Receipt Generation
- Dynamic PDF generation with transaction data
- Code39 barcode with payer info
- QR code linking to application
- Automatic file management
- Base64 PDF streaming to frontend

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ (frontend)
- **Python** 3.10+ (backend)
- **Firebase** project (Firestore enabled)
- Git

### Frontend Setup

```bash
cd app
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:3001" > .env.local

npm run dev
# Server at http://localhost:5173
```

### Backend Setup

```bash
cd app/server

# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install . (on pyproject.toml, i recommend installing uv instead of pip)

# Create RSA keys for JWT (if needed)
python -c "from cryptography.hazmat.primitives.asymmetric import rsa; from cryptography.hazmat.primitives import serialization; \
private_key = rsa.generate_private_key(65537, 2048); \
private_pem = private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption()); \
public_pem = private_key.public_key().public_bytes(encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo); \
print(private_pem.decode()); print(public_pem.decode())"

# Start server
python main.py
# Server at http://localhost:3001
```

### Environment Variables

**.env.local** (Frontend)
```env
VITE_API_URL=http://localhost:3001
VITE_LOG_LEVEL=info
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

**Backend** (RSA keys in `src/utils/.secret/`)
```
.secret/
├── private_key.pem  (RS256 private key)
└── public_key.pem   (RS256 public key)
```

---

## 🌐 API Documentation

### Base URL
```
http://localhost:3001
```

### CORS Configuration
```
Allowed Origins: http://localhost:3000, http://localhost:5173
Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
```

### Authentication Routes

#### **POST** `/api/auth/login`
Authenticate user with JWT token response.

**Request Body:**
```json
{
  "username": "Mari",
  "password": "123123"
}
```

**Success Response (200):**
```json
{
  "username": "Mari",
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "Mari",
    "email": "Mari@mari"
  }
}
```

**Error Response (401):**
```json
{
  "msg": "Invalid username or password."
}
```

---

#### **POST** `/api/auth/register`
Validate registration data (does not create user in this implementation).

**Request Body:**
```json
{
  "username": "novo_usuario",
  "email": "novo@email.com",
  "password": "SenhaForte123!@",
  "confirm_password": "SenhaForte123!@"
}
```

**Validation Requirements:**
- Username: 3-20 alphanumeric chars, starts with letter
- Email: Valid RFC format
- Password: Min 8 chars, uppercase, lowercase, digit, special char

**Success Response (200):**
```json
{
  "msg": "Valid data.",
  "valid": true,
  "timestamp": "2025-08-08 15:30:45"
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "errors": [
    {"username_error": "Invalid username."},
    {"password_error": "Passwords do not match."}
  ]
}
```

---

#### **GET** `/api/auth/dashboard`
Fetch authenticated user dashboard data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "Mari",
  "email": "Mari@mari"
}
```

**Error Response (401):**
```json
{
  "msg": "User not authenticated or invalid token."
}
```

---

### Sales Routes

#### **POST** `/api/sales/finish`
Generate and return PDF receipt for completed sale.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "qtd": 5,
  "value": 50.00,
  "payment_type": "PIX",
  "payer": "Cliente Nome",
  "receiver": "Walunys Doces",
  "description": "Brigadeiro Gourmet x5"
}
```

**Success Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="comprovante.pdf"
[PDF Binary Data]
```

**Error Response:**
- **400**: Invalid request data
- **401**: Unauthorized
- **500**: Internal server error (PDF generation failed)

---

## 🐍 Python Backend

### Project Structure

```
server/
├── main.py                          # Quart app entry point
├── requirements.txt                 # Python dependencies
└── src/
    ├── __init__.py
    ├── models/
    │   ├── __init__.py
    │   ├── user_model.py            # User dataclass with password hashing
    │   └── comprovante_model.py     # Receipt/voucher dataclass
    │
    ├── routes/
    │   ├── __init__.py
    │   ├── auth.py                  # Login, register, dashboard routes
    │   └── sales.py                 # Receipt generation & PDF download
    │
    ├── services/
    │   ├── __init__.py
    │   ├── auth_service.py          # User authentication logic
    │   ├── register_service.py      # Validation & timezone utilities
    │   ├── comprovante_service.py   # PDF & JSON serialization
    │   ├── generate_pdf.py          # QR code, barcode, HTML generation
    │   ├── key_service.py           # API key management (optional)
    │
    └── utils/
        ├── __init__.py
        ├── crypto.py                # RSA key loading for JWT
        ├── utils.py                 # File I/O, numeric ID generation
        └── .secret/
            ├── private_key.pem
            └── public_key.pem
```

### Core Modules

#### **User Model** (`models/user_model.py`)
```python
@dataclass
class User:
    id: int
    username: str
    email: Optional[str]
    password_hashed: str
    
    def set_password(self, password: str):
        """Hash with scrypt algorithm."""
    
    def check_password(self, password: str) -> bool:
        """Verify password hash."""
```

#### **Auth Service** (`services/auth_service.py`)
```python
async def authenticate(username: str, password: str) -> User | None:
    """Verify credentials against in-memory user database."""

async def get_user_by_id(user_id: int) -> User | None:
    """Fetch user by ID."""
```

#### **Comprovante Model** (`models/comprovante_model.py`)
```python
@dataclass
class Comprovante:
    qtd: int
    value: Decimal
    payment_type: MetodoPagamento  # PIX or DINHEIRO
    payer: Dict[str, Any]
    receiver: Dict[str, Any]
    description: Optional[str]
    
    transaction_id: uuid.UUID       # Auto-generated
    timestamp: str                  # São Paulo timezone
    barcode_str: str                # 13-digit numeric ID
```

#### **PDF Generation** (`services/generate_pdf.py`)
```python
def generate_qrcode(path: str) -> str:
    """Generate QR code image (PNG)."""

def generate_barcode(CODE: str, path: str) -> str:
    """Generate Code39 barcode image (PNG)."""

def generate_html(data: Comprovante, qrcode_func: str, barcode_func: str) -> str:
    """Generate HTML receipt template with transaction data."""
```

#### **Validation Services** (`services/register_service.py`)
```python
def validate_username(username: str) -> bool:
    """Regex: [a-zA-Z][a-zA-Z0-9_]{2,19}"""

def is_email_valid(email: str) -> tuple[bool, Exception | None]:
    """RFC email validation."""

def validate_password(password: str) -> bool:
    """Min 8 chars, uppercase, lowercase, digit, special char."""

def timestamp() -> str:
    """Return current time in São Paulo timezone."""
```

### Running the Server

#### Development Mode
```bash
python main.py
# Runs with debug=True, hot reload enabled
```

#### Production Mode (with Gunicorn)
```bash
pip install gunicorn
gunicorn --worker-class quart.worker.QuartWorker main:app --bind 0.0.0.0:3001
```

### Error Handling

All routes return JSON with consistent format:

**Success:**
```json
{
  "msg": "Operation successful",
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "msg": "Error description",
  "error_code": "ERROR_TYPE"
}
```

### Security Notes

⚠️ **Before Production:**
1. Generate RSA key pair and secure `.secret/` directory
2. Move user database to PostgreSQL/MongoDB
3. Implement rate limiting on auth routes
4. Add request validation/sanitization middleware
5. Use environment variables for secrets (not hardcoded)
6. Enable HTTPS only
7. Add request logging & monitoring

---

## 📊 Data Structure (Firestore Collections)

### `sweets`
```javascript
{
  id: string,
  name: string,
  stock: number,
  price: number,
  expiry_date: string,        // YYYY-MM-DD
  image?: string,
  observations?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  userId: string
}
```

### `ingredients`
```javascript
{
  id: string,
  name: string,
  brand?: string,
  purchaseDate: string,
  stockInBaseUnit: number,
  baseUnit: 'g' | 'ml',
  displayUnit: string,
  displayUnitFactor: number,
  displayUnitPrice: number,
  costPerBaseUnit: number,
  expiryDate?: string,
  observations?: string
}
```

### `recipes`
```javascript
{
  id: string,
  ingredients: [
    {
      ingredientId: string,
      quantityInBaseUnit: number
    }
  ]
}
```

### `kitchenware`
```javascript
{
  id: string,
  name: string,
  quantity: number,
  condition: 'Novo' | 'Bom' | 'Desgastado',
  observations?: string
}
```

### `sales`
```javascript
{
  date: string (ISO),
  timestamp: number (Unix),
  items: [
    {
      sweetId: string,
      quantity: number,
      priceAtSale: number,
      costAtSale: number,
      subtotal: number
    }
  ],
  totalAmount: number,
  totalCost: number,
  totalProfit: number,
  operatorId: string,
  operatorName: string,
  status: 'completed'
}
```

---

## 📁 Project Structure

```
Sweet Home/
├── app/                          # React Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.local
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Main router & state
│   │   ├── firebaseConfig.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SweetForm.jsx
│   │   │   ├── IngredientForm.jsx
│   │   │   ├── KitchenwareForm.jsx
│   │   │   ├── PDVPage.jsx
│   │   │   └── FinancePage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SweetCard.jsx
│   │   │   ├── IngredientCard.jsx
│   │   │   ├── KitchenwareCard.jsx
│   │   │   ├── PasswordStrengthMeter.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingPage.jsx
│   │   │   │
│   │   │   └── modals/
│   │   │       ├── QRCodeModal.jsx
│   │   │       ├── ReceiptModal.jsx
│   │   │       └── ObservationsModal.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── pdvApiService.js
│   │   │   ├── firestoreService.js
│   │   │   ├── costCalculationService.js
│   │   │   └── salesService.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useFirestore.js
│   │   │   └── useToast.js
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── logger.js
│   │   │   ├── sanitizer.js
│   │   │   └── passwordStrength.js
│   │   │
│   │   ├── constants/
│   │   │   ├── firebaseCollections.js
│   │   │   └── authConfig.js
│   │   │
│   │   └── styles/
│   │       └── global.css
│   │
│   └── package.json
│
└── server/                       # Python Backend
    ├── main.py
    ├── .env
    │
    └── src/
        ├── __init__.py
        │
        ├── models/
        │   ├── __init__.py
        │   ├── user_model.py
        │   └── comprovante_model.py
        │
        ├── routes/
        │   ├── __init__.py
        │   ├── auth.py
        │   └── sales.py
        │
        ├── services/
        │   ├── __init__.py
        │   ├── auth_service.py
        │   ├── register_service.py
        │   ├── comprovante_service.py
        │   ├── generate_pdf.py
        │   └── key_service.py
        │
        └── utils/
            ├── __init__.py
            ├── crypto.py
            ├── utils.py
            └── .secret/
                ├── private_key.pem
                └── public_key.pem
```

---


