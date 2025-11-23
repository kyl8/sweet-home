# 🍰 Sweet Home — Confectionery Management System

**Extensible inventory, POS, and financial analytics platform for confectioneries**

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Under%20Development-yellow?style=for-the-badge)](https://github.com)

**⚠️ Note:** _Currently on pause/partially abandoned due to side projects. This repository has a lot of experimental and unsafe/exploitable code; there will be a refactoring in the future._
---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Data Structure](#-data-structure)
- [Key Modules](#-key-modules)

---

## 🎯 Overview

A **lightweight React-based confectionery management system** designed for small businesses. Manage sweets inventory, ingredient costs, POS sales, and financial analytics with real-time Firebase Firestore sync.

**Perfect for:** 🧁 Bakeries • 🍪 Confectioneries • 🎂 Pastry shops • 🍬 Candy makers

> **Current Status:** Still under development and somewhat paused due to side projects. Treat as a prototype baseline—useful for reference and customization.

---

## ✨ Key Features

### 📦 Inventory Management
- **Sweets**: Stock, pricing, expiry tracking (color-coded status), optional images, observations
- **Ingredients**: Purchase metadata, unit conversion, auto-calculated cost per base unit (g/ml), stock tracking
- **Kitchenware**: Quantity tracking, condition badges (new/good/bad)

### 💳 Point of Sale (PDV)
- Animated product grid with images
- Real-time cart with quantity controls
- QR code payment modal (placeholder)
- Optional receipt generation modal
- **Status:** Missing sale persistence & stock decrement

### 📊 Financial Dashboard
- **Cost Breakdown:** Production cost per sweet (`recipe.ingredients × costPerBaseUnit`)
- **Profitability Analysis:** Per-sweet profit & margin % tables
- **Inventory Valuation:** Total stock value aggregation
- **Visual Charts:** Recharts bar graphs for quick insights

### 🔐 Authentication
- JWT-based login/register (local API at `localhost:3001`)
- Session persistence (localStorage)
- User-specific data association

### ⚡ Real-time Features
- Firestore listeners for live data sync
- Framer Motion animations (cards, modals, cart)
- Multiple loading page themes
- Reusable observations modal

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18+ (Hooks) |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Firebase Firestore |
| **Auth** | JWT (local API) |
| **State** | React `useState` (no global store) |

---

## 🏗 Architecture

```
src/
├── main.jsx                    # React root
├── App.jsx                     # State machine, Firestore init, routing
├── firebaseConfig.js           # Firebase setup
├── pages/
│   ├── Login.jsx               # JWT auth
│   ├── Register.jsx            # User creation
│   ├── Dashboard.jsx           # Tabbed inventory (sweets/ingredients/kitchenware)
│   ├── SweetForm.jsx           # Add/edit sweets
│   ├── IngredientForm.jsx      # Add/edit ingredients (with cost calc)
│   ├── KitchenwareForm.jsx     # Add/edit utensils
│   ├── PDVPage.jsx             # POS cart + modals
│   └── FinancePage.jsx         # Analytics + charts
│
├── components/
│   ├── SweetCard.jsx
│   ├── IngredientCard.jsx
│   ├── KitchenwareCard.jsx
│   ├── Header.jsx              # Navigation (PDV/Finance/Logout)
│   ├── Footer.jsx
│   ├── EmptyState.jsx
│   ├── LoadingPage.jsx         # Multiple themed loaders
│   │
│   └── modals/
│       ├── QRCodeModal.jsx
│       ├── ReceiptModal.jsx
│       └── ObservationsModal.jsx
│
└── styles/
    └── global.css              # Tailwind imports
```

### Data Flow
1. **App.jsx** boots Firebase listeners (`onSnapshot`)
2. State updates (`setSweets`, `setIngredients`, etc.) trigger re-renders
3. Pages consume state via props (manual routing via `currentPage`)
4. Forms call handlers (`handleAddSweet`, etc.) → Firestore write → listeners propagate
5. **FinancePage** derives profitability from `sweets` + `recipes` + `ingredients`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** LTS
- **Firebase** project with Firestore enabled
- *(Optional)* Local auth API at `http://localhost:3001/api/auth`

### Installation

```bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Configure Firebase
# Edit src/firebaseConfig.js with your Firebase credentials
# Example:
# export const firebaseConfig = {
#   apiKey: "YOUR_API_KEY",
#   projectId: "YOUR_PROJECT_ID",
#   ...
# };

# Start development server
npm start
```

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
  stockInBaseUnit: number,       // calculated: displayQuantity × displayUnitFactor
  baseUnit: 'g' | 'ml',
  displayUnit: string,           // e.g., "pacote", "lata"
  displayUnitFactor: number,     // e.g., 1000
  displayUnitPrice: number,      // cost per package
  costPerBaseUnit: number,       // auto: displayUnitPrice / displayUnitFactor
  expiryDate?: string,
  observations?: string
}
```

### `recipes`
```javascript
{
  id: string,                    // matches sweet.id
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

---

## 🔑 Key Modules

### Cost Calculation (`FinancePage.jsx`)
```javascript
calculateSweetCost(sweet, recipes, ingredients)
// 1. Find recipe by sweet.id
// 2. For each ingredient: quantityInBaseUnit × costPerBaseUnit
// 3. Sum = production cost
// 4. Profit = sweet.price − cost
// 5. Margin (%) = (profit / price) × 100
```

### POS Flow (`PDVPage.jsx`)
1. User selects sweets → adds to cart
2. Quantity controls (+/−)
3. Total computed: `Σ (item.price × quantity)`
4. Click "Efetuar Pagamento" → **QRCodeModal** (payment placeholder)
5. Confirm → **ReceiptModal** (ask for receipt)
6. Finalize: Alert summary *(missing: save sale, decrement stock)*
---

