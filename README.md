[README.md](https://github.com/user-attachments/files/34928321/README.md)
# 🎬 Cinema Booking App

A full-stack movie ticket booking website. Customers browse movies, pick a showtime, choose seats on a live seat map and receive an e-ticket with a QR code. Admins run the cinema from a dashboard: movies, genres, cinemas, rooms, seat types, showtimes, bookings and user accounts.

The backend is a REST API built with **Express 5, TypeScript, Prisma and MySQL**. The frontend is a **React 19 + Vite** single-page app.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

<!--
## Screenshots
Add 2–3 screenshots to docs/screenshots/ and remove this comment, for example:
![Seat selection](docs/screenshots/seat-map.png)
![Admin dashboard](docs/screenshots/dashboard.png)
-->

## Features

### Customers
- Browse movies that are now showing or coming soon, search by title and filter by genre
- See showtimes by date and cinema
- Choose seats on a seat map that shows free, held and booked seats, with each seat type and price
- Selected seats are **held for 5 minutes** during checkout, with a countdown timer (up to 8 seats per booking)
- Online sales close 15 minutes before the showtime starts
- Simulated QR payment, then an **e-ticket** with a booking code and QR code
- Booking history, profile and password change

### Admins
- **Dashboard**: revenue today and this month, revenue per day for the last 30 days, top 5 movies of the last 7 days, today's showtimes and the latest bookings
- Manage movies, genres, cinemas, seat types (ticket prices) and individual seats
- Create a room by entering rows × columns: all its seats are generated automatically (up to 26 × 30)
- Schedule showtimes with conflict checks (see below)
- View all bookings, lock or unlock user accounts
- Movie status (coming soon → now showing → ended) updates itself from the release and end dates

## Technical highlights

### No double booking, even under concurrent requests

When a showtime is created, the system creates one `Ticket` row for every seat in the room. Holding seats is then a single **conditional `UPDATE` inside a transaction**: it only touches tickets that are free, or whose previous hold has expired.

```ts
// backend/src/modules/booking/bookingService.ts (simplified)
await prisma.$transaction(async (tx) => {
  const { count } = await tx.ticket.updateMany({
    where: {
      showtimeId,
      seatId: { in: seatIds },
      OR: [{ status: 'available' }, { status: 'locked', lockedUntil: { lte: now } }],
    },
    data: { status: 'locked', lockedByUserId: userId, lockedUntil },
  });

  // Fewer rows than requested: someone else got a seat first -> roll everything back
  if (count !== seatIds.length) throw new AppError(SEATS_TAKEN_MESSAGE, 409);
});
```

If two customers click the same seat at the same moment, MySQL (InnoDB) locks the ticket row for the first transaction. The second one waits, then sees the seat is already held, updates fewer rows and is rolled back with **HTTP 409**.

```mermaid
sequenceDiagram
    participant A as Customer A
    participant B as Customer B
    participant API as Booking API
    participant DB as MySQL (InnoDB)
    A->>API: Hold seat C5
    B->>API: Hold seat C5
    API->>DB: UPDATE ticket for A (seat free?)
    API->>DB: UPDATE ticket for B (waits for A's row lock)
    DB-->>API: A: 1 row updated, commit
    API-->>A: 200, seat held for 5 minutes
    DB-->>API: B: 0 rows updated, rollback
    API-->>B: 409, seat already taken
```

Checkout works the same way: in one transaction, held tickets become booked only where the customer **still holds an unexpired lock**, so a seat whose hold expires at the last second can never be sold twice. The ticket price is saved on each ticket at payment time (`priceAtBooking`), so later price changes don't affect old bookings.

Other booking rules:
- Expired holds are released automatically whenever the seat map is read, with no cron job
- A customer can hold seats in only one showtime at a time
- Changing the selected seats keeps the original 5-minute deadline, so the timer can't be reset forever
- Booking codes (e.g. `CB7K2M9QXA`) come from `crypto.randomInt` and skip look-alike characters (0/O, 1/I/L), with a retry on the rare duplicate

### Showtime scheduling
A new showtime is rejected if it:
- is in the past, or ends after midnight
- falls outside the movie's release and end dates
- uses a room that is inactive
- overlaps another showtime in the same room, including a **15-minute cleaning break**

A showtime that already has bookings can't be edited.

### Security
- Passwords are hashed with **bcrypt**, and the password hash is never returned by the API
- **JWT** authentication (7-day tokens). The user is read again from the database on every request, so a locked account or a role change takes effect immediately
- Login returns the same message for a wrong email or a wrong password, so it doesn't reveal which emails are registered
- Duplicate emails are blocked by a unique constraint, which avoids a check-then-insert race
- Customers can only open their own bookings: other booking IDs return 404
- Every request body is validated with **Zod**, `helmet` sets secure HTTP headers, and all errors go through one central error handler

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM 6, MySQL, Zod, JSON Web Token, bcrypt, helmet |
| Frontend | React 19, TypeScript, Vite, React Router 7, Tailwind CSS 4, React Hook Form, Axios, qrcode.react |
| Database tooling | Prisma Migrate (versioned migrations) and a seed script |

## Project structure

```
Cinema-Booking-App/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # 11 models
│   │   ├── migrations/        # Prisma Migrate history
│   │   └── seed.ts            # default seat type + admin account
│   └── src/
│       ├── app.ts             # Express app, routes, error handler
│       ├── config/            # Prisma client, business constants
│       ├── middlewares/       # authenticate, requireAdmin, validate (Zod), errorHandler
│       ├── modules/           # one folder per feature (11 modules)
│       │   └── booking/       # bookingRoute → bookingController → bookingService, bookingValidator
│       └── utils/             # JWT, AppError, date and time helpers
└── frontend/
    └── src/
        ├── api/               # one Axios module per resource
        ├── pages/             # customer pages, account/ and admin/
        ├── components/
        ├── context/           # authentication state
        └── hooks/
```

Each backend module follows the same layers: **route** (URL and middlewares) → **controller** (HTTP in/out) → **service** (business rules and database access), with a **validator** holding its Zod schemas.

## Database

```mermaid
erDiagram
    CINEMA ||--o{ ROOM : has
    ROOM ||--o{ SEAT : contains
    SEAT_TYPE ||--o{ SEAT : "sets price of"
    ROOM ||--o{ SHOWTIME : hosts
    MOVIE ||--o{ SHOWTIME : "is shown in"
    MOVIE ||--o{ MOVIE_GENRE : has
    GENRE ||--o{ MOVIE_GENRE : groups
    SHOWTIME ||--o{ TICKET : "one per seat"
    SEAT ||--o{ TICKET : "sold as"
    BOOKING |o--o{ TICKET : includes
    USER ||--o{ BOOKING : makes
    SHOWTIME ||--o{ BOOKING : "booked for"
    USER |o--o{ TICKET : "holds (locked)"
```

Key constraints: one ticket per seat per showtime (`@@unique([showtimeId, seatId])`), unique seat positions in a room, unique room names within a cinema, and indexes for the most frequent queries (movies by status and title, showtimes by movie and date).

## API overview

Base URL: `http://localhost:3000/api`. 🔒 login required, 👑 admin only.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Public | Create an account, log in (returns a JWT) |
| GET, PUT | `/auth/me` | 🔒 | Read or update your profile |
| PUT | `/auth/password` | 🔒 | Change password |
| GET | `/movies?status=&search=&genreId=` | Public | List movies with filters |
| GET | `/movies/:id` | Public | Movie details |
| GET | `/showtimes?movieId=&cinemaId=&date=` | Public | List showtimes |
| GET | `/cinemas`, `/cinemas/:cinemaId/rooms`, `/genres`, `/seat-types` | Public | Reference data |
| GET | `/showtimes/:showtimeId/seats` | Public | Seat map with the status of each seat |
| POST | `/showtimes/:showtimeId/seats/lock` | 🔒 | Hold seats for 5 minutes (empty list releases them) |
| POST | `/bookings` | 🔒 | Pay for the held seats and create the booking |
| GET | `/bookings/me`, `/bookings/:id` | 🔒 | Your booking history, one booking (e-ticket) |
| GET | `/bookings` | 👑 | All bookings |
| GET | `/dashboard` | 👑 | Dashboard statistics |
| POST, PUT, DELETE | `/movies`, `/genres`, `/cinemas`, `/rooms`, `/seat-types`, `/showtimes` | 👑 | Manage data |
| GET, PUT | `/rooms/:roomId/seats`, `/seats/:id` | 👑 | View and change the seats of a room |
| GET, PUT | `/users`, `/users/:id/status` | 👑 | List users, lock or unlock an account |

## Getting started

### Prerequisites
- Node.js 20.19+ or 22.12+
- MySQL 8

### 1. Clone and install

```bash
git clone https://github.com/NguyenDacTheDuc/Cinema-Booking-App.git
cd Cinema-Booking-App
npm install                  # runs backend and frontend together
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

Create an empty MySQL database (for example `cinema_booking`), then create `backend/.env`:

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/cinema_booking"
JWT_SECRET="a-long-random-string"
PORT=3000

# Admin account created by the seed script
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
```

### 3. Create the tables and seed data

```bash
cd backend
npx prisma migrate deploy    # create all tables
npx prisma generate          # generate the Prisma client
npx prisma db seed           # default seat type + admin account
cd ..
```

### 4. Run

```bash
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:3000/api

Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` to open the admin area at `/admin`.
The frontend calls `http://localhost:3000/api` by default. If the API runs elsewhere, set `VITE_API_URL` in `frontend/.env`.

## Author

[NguyenDacTheDuc](https://github.com/NguyenDacTheDuc)
