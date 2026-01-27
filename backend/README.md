# Maggie Point Backend API

Backend API for Maggie Point - Hostel Food Delivery System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` file in the root directory with:
```
MONGODB_URI=your_mongodb_connection_string
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_secret_key
PORT=3000
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
- **GET** `/health` - Check if API is running (Proxied via `/api/health`)

### Authentication

#### Send OTP
- **POST** `/auth/send-otp`
- Body:
```json
{
  "email": "user@example.com",
  "firstName": "John"
}
```

#### Signup
- **POST** `/auth/signup`
- Body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "otp": "123456",
  "floor": 3,
  "room": "305",
  "password": "securepassword"
}
```

#### Login
- **POST** `/auth/login`
- Body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get All Users
- **GET** `/auth/users` - View all registered users (for admin/testing)

## Email Templates

The API sends beautiful HTML emails for:
1. **OTP Verification** - When user requests OTP
2. **Welcome Email** - After successful signup
3. **Login Email** - After successful login

## Database Models

### User
- firstName, lastName, email, password (hashed)
- floor (1-9), room
- isVerified, isAdmin
- timestamps

### OTP
- email, otp
- Auto-expires after 5 minutes

## Notes

- OTP is valid for 5 minutes
- Passwords are hashed with bcrypt
- JWT tokens expire in 30 days
- Email verification is required for signup
