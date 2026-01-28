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

#### Verify OTP
- **POST** `/auth/verify-otp`
- Body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
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
  "mobile": "9876543210",
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

## Troubleshooting

### Server not responding / Route not found errors

1. **Check if backend is running:**
```bash
ps aux | grep node
```

2. **Check backend logs:**
```bash
cd /var/www/maggie-point/backend
node server.js
```

3. **Verify .env file exists in backend directory:**
```bash
ls -la /var/www/maggie-point/backend/.env
```

4. **Test direct backend access:**
```bash
curl http://localhost:3000/health
```

5. **Check NGINX is proxying correctly:**
```bash
curl https://maggiepoint.onessa.agency/api/health
```

### Start server automatically

Use the provided script:
```bash
cd /var/www/maggie-point/backend
chmod +x start-server.sh
./start-server.sh
```

Or run in background:
```bash
cd /var/www/maggie-point/backend
nohup node server.js > server.log 2>&1 &
```

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
