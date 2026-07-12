# 🍽️ KEC FoodCourt Management System

A full-stack Smart FoodCourt Management Platform built with the **MERN stack**, featuring three delivery modes, Razorpay payment integration, a real-time table reservation system with concurrency control, and a comprehensive admin analytics dashboard.

📁 **GitHub:** [github.com/hemalekha28/foodcourt-mgmt-system](https://github.com/hemalekha28/foodcourt-mgmt-system)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Delivery Modes](#-delivery-modes)
- [Table Reservation System](#-table-reservation-system)
- [Admin Dashboard & Analytics](#-admin-dashboard--analytics)
- [Payment Integration](#-payment-integration)

---

## ✨ Features

### 👤 User Features
- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Food Ordering** — Browse menu, add to cart, place orders
- **3 Delivery Modes** — Classroom Delivery, Pick Up, Table Reservation
- **Razorpay Checkout** — Secure payment gateway with server-side verification
- **Table Reservation** — Book a table by date, time slot, and number of seats
- **Real-time Availability** — Live table status updates via Socket.io
- **Email & SMS Notifications** — Booking confirmation and cancellation alerts
- **Order Tracking** — Track order status in user dashboard

### 🛠️ Admin Features
- **Admin Dashboard** — Overview of total orders, revenue, users, and reservations
- **Sales Tracking** — Revenue and order count for the last 30 days
- **Per-Item Analytics** — Sales breakdown for each food item over last 30 days
- **Daily Order Analytics** — Day-by-day food order trends
- **User Analytics** — New user registrations and active users over time
- **Reservation Analytics** — Reservation trends, peak hours, table utilisation, status breakdown
- **Order Management** — View and update order status across all users
- **Menu Management** — Add, update, and delete food items
- **Table Management** — Manage tables and monitor real-time status

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js + Vite | UI framework and build tool |
| React Router DOM | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client with JWT interceptor |
| Chart.js + react-chartjs-2 | Analytics charts and graphs |
| Socket.io-client | Real-time table availability updates |
| React Context API | Global state (Auth, Cart, Notification) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database and ODM |
| JSON Web Token (JWT) | Authentication and authorisation |
| bcryptjs | Password hashing |
| Razorpay | Payment gateway with HMAC-SHA256 verification |
| Socket.io | Real-time bidirectional communication |
| Nodemailer | Transactional confirmation/cancellation emails |
| Twilio | SMS notifications |
| node-cron | Scheduled tasks and lock cleanup |

---

## 🏗️ Architecture

```
Browser
  │
  ▼
React + Vite Frontend
  │   (REST API + JWT)          (Socket.io)
  ▼                                  ▼
Express API (Node.js)  ←────  Socket.io Server
  │
  ├── MongoDB
  │     ├── Users
  │     ├── Foods / Menu
  │     ├── Orders
  │     ├── Tables
  │     └── Reservations
  │
  ├── Razorpay API       ← Payment gateway
  ├── Nodemailer / SMTP  ← Email notifications
  └── Twilio             ← SMS notifications
```

### Delivery Flow
```
User selects items
        │
        ▼
   Choose Delivery Mode
   ┌────────────────────────────────────┐
   │                                    │
   ▼              ▼                     ▼
Classroom      Pick Up           Table Reservation
Delivery     (self collect)    (atomic lock → confirm)
   │              │                     │
   └──────────────┴─────────────────────┘
                  │
                  ▼
          Razorpay Checkout
                  │
                  ▼
         Order Confirmed + Email/SMS
```

---

## 📁 Project Structure

```
foodcourt-mgmt-system/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── foodController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── reservationController.js  # Atomic concurrency control
│   │   ├── tableController.js
│   │   ├── userController.js
│   │   └── analyticsController.js    # MongoDB Aggregation Pipelines
│   ├── middlewares/
│   │   └── auth.js                   # JWT protect + admin role check
│   ├── models/
│   │   ├── User.js
│   │   ├── Food.js
│   │   ├── Order.js
│   │   ├── Table.js                  # lockedUntil, lockedBy for concurrency
│   │   └── Reservation.js            # confirmationCode, sessionId
│   ├── routes/
│   │   ├── auth.js
│   │   ├── foods.js
│   │   ├── orders.js
│   │   ├── payment.routes.js
│   │   ├── reservation.routes.js
│   │   ├── tables.js
│   │   ├── users.js
│   │   └── analytics.routes.js
│   ├── utils/
│   │   ├── mailer.js                 # Nodemailer email templates
│   │   └── sms.js                    # Twilio SMS
│   ├── Dockerfile
│   └── server.js                     # Socket.io setup
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── authContext.jsx
│   │   │   ├── cartContext.jsx
│   │   │   └── notificationContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx          # Delivery mode selector + Razorpay
│   │   │   ├── ReservationPage.jsx   # 3-step booking form
│   │   │   ├── UserDashboard.jsx     # Order history + tracking
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx    # Full analytics dashboard
│   │   │   ├── OrderManagement.jsx
│   │   │   ├── MenuManagement.jsx
│   │   │   └── AdminReservations.jsx
│   │   ├── components/
│   │   │   └── TableAvailabilityGrid.jsx  # Real-time Socket.io grid
│   │   ├── utils/
│   │   │   ├── api.jsx               # Axios instance with JWT interceptor
│   │   │   └── socket.js             # Socket.io client singleton
│   │   └── App.jsx
│   ├── nginx.conf
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas URI)
- Razorpay account
- Twilio account (for SMS)
- Gmail SMTP (for emails)

### 1. Clone the repository

```bash
git clone https://github.com/hemalekha28/foodcourt-mgmt-system.git
cd foodcourt-mgmt-system
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `.env` in `/backend` (see [Environment Variables](#-environment-variables))

```bash
npm run dev        # Start with nodemon
npm start          # Production
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `.env` in `/frontend`:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

```bash
npm run dev        # Vite dev server
npm run build      # Production build
```

### 4. Run with Docker Compose

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |

---

## 🔐 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Nodemailer (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=your_email@gmail.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### Foods / Menu
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/foods` | Public |
| GET | `/api/foods/:id` | Public |
| POST | `/api/foods` | Admin |
| PUT | `/api/foods/:id` | Admin |
| DELETE | `/api/foods/:id` | Admin |

### Orders
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/orders` | User |
| GET | `/api/orders/myorders` | User |
| GET | `/api/orders` | Admin |
| PUT | `/api/orders/:id/status` | Admin |

### Payments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/payments/create-order` | User |
| POST | `/api/payments/verify` | User |

### Tables
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/tables` | Public |
| POST | `/api/tables` | Admin |
| PUT | `/api/tables/:id` | Admin |

### Reservations
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/reservations/availability` | Public |
| POST | `/api/reservations` | Public |
| POST | `/api/reservations/cancel` | Public |
| GET | `/api/reservations` | Admin |
| PUT | `/api/reservations/:id/status` | Admin |

### Analytics (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/sales-last-30-days` | Daily revenue for last 30 days |
| GET | `/api/analytics/food-sales-last-30-days` | Per food item sales last 30 days |
| GET | `/api/analytics/daily-orders` | Daily order count trend |
| GET | `/api/analytics/user-stats` | New users and active users |
| GET | `/api/analytics/order-status-breakdown` | Orders grouped by status |
| GET | `/api/analytics/reservations-by-day` | Reservations per day |
| GET | `/api/analytics/reservations-by-timeslot` | Peak booking time slots |
| GET | `/api/analytics/table-utilisation` | Most booked tables |
| GET | `/api/analytics/reservation-status-breakdown` | Reservation status pie chart |

---

## 🚚 Delivery Modes

The system supports **3 delivery modes**, selectable at checkout:

### 1. 🏫 Classroom Delivery
- User enters their classroom/block number at checkout
- Order is delivered to the specified location
- Admin sees classroom details in order management

### 2. 🛍️ Pick Up
- User places order and receives a pickup token
- User collects order from the foodcourt counter
- Admin marks order as ready for pickup

### 3. 🪑 Table Reservation
- User books a table as part of the checkout flow
- Links the reservation to the order
- Food is served directly at the reserved table

---

## 🪑 Table Reservation System

### Concurrency Control — Preventing Double Booking

The reservation system uses **atomic MongoDB `findOneAndUpdate`** to handle simultaneous booking attempts:

**Phase 1 — Acquire Lock (30-second TTL):**
```js
Table.findOneAndUpdate(
  {
    _id: tableId,
    currentStatus: "available",
    $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date() } }]
  },
  { $set: { lockedUntil: new Date(Date.now() + 30000), lockedBy: sessionId } },
  { new: true }
)
```
If this returns `null` → table was grabbed by another user → respond **409 Conflict**.

**Phase 2 — Confirm Booking:**
- Create Reservation document with `status: "confirmed"`
- Update Table `currentStatus: "reserved"`, clear lock fields
- Emit `tableUpdated` via Socket.io to all connected clients
- Send confirmation email 

**If Phase 2 fails** → lock is released automatically so the table becomes available again.

### 3-Step Booking Flow
```
Step 1: Select date, time slot, number of seats → Check availability
Step 2: Enter name, email, phone number → Confirm booking
Step 3: View confirmation code + table details → Option to cancel
```

### Real-Time Updates
- `TableAvailabilityGrid.jsx` connects to Socket.io on mount
- Listens for `tableUpdated` events
- Updates the specific table card's status instantly — no page refresh needed

---

## 📊 Admin Dashboard & Analytics

All analytics are built using **MongoDB Aggregation Pipelines** (`$match`, `$group`, `$lookup`, `$sort`, `$project`).

### Sales Dashboard
- **Last 30 Days Revenue** — Line chart of daily revenue using `$group` by date + `$sum` of order totals
- **Per Food Item Sales** — Bar chart of total quantity sold per food item using `$unwind` on order items + `$group` by foodId + `$lookup` to Food collection
- **Daily Order Count** — Area chart of how many orders were placed each day

### Order Analytics
- **Order Status Breakdown** — Pie chart (pending / confirmed / preparing / delivered / cancelled)
- **Top Selling Items** — Ranked list by total quantity sold over last 30 days

### User Analytics
- **New Registrations** — Daily new user count for last 30 days
- **Total Active Users** — Users who placed at least one order

### Reservation Analytics
- **Reservations by Day** — Line chart of bookings per day
- **Peak Booking Hours** — Bar chart of most booked time slots
- **Table Utilisation** — Horizontal bar of confirmed bookings per table
- **Reservation Status Breakdown** — Pie chart (confirmed / cancelled / pending / completed)

---

## 💳 Payment Integration

Razorpay is integrated with **server-side HMAC-SHA256 signature verification** to prevent fraudulent payment claims.

### Payment Flow
```
1. User clicks "Pay" at checkout
2. Backend creates a Razorpay order → returns orderId to frontend
3. Frontend opens Razorpay checkout widget
4. User completes payment
5. Razorpay returns: razorpay_order_id, razorpay_payment_id, razorpay_signature
6. Backend verifies:
   expected = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)
   if expected === razorpay_signature → mark order as PAID
   else → reject with 400 (payment tampered)
```

This ensures **no client can fake a successful payment** by directly calling the confirm endpoint.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ by <a href="https://github.com/hemalekha28">Hemalekha</a></p>
