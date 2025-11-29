# Truck Management System

A comprehensive truck management system for tracking trucks, income, expenses, and managing due dates with alerts.

## 🎯 Quick Code Walkthrough

Our application uses a **clean separation** - each page is independent with its own HTML and JavaScript file:

```
📁 Authentication Layer
   ├── login.html + auth.js      → Phone & password authentication
   ├── signup.html + auth.js     → User registration with validation
   └── otp.html + auth.js        → 5-digit OTP with 30-second countdown

📁 Main Application
   ├── dashboard.html + dashboard.js  → Stats, charts, alerts
   ├── add-truck.html + truck.js      → Vehicle management
   ├── add-income.html + income.js    → Income tracking & payment list
   └── add-expense.html + expense.js  → Expense recording with categories

📁 Core Files
   ├── styles.css    → Responsive design (green for income, red for expense)
   └── server.js     → REST API with JWT authentication
```


**1. Smart Dashboard Statistics** (dashboard.js)
```javascript
const updateDashboardStats = () => {
    // Filters data by selected truck or shows all
    // Calculates: Total Income, Total Expense, Net Profit
    // Updates Chart.js bar chart with 6-month trends
    // Real-time updates as you add income/expense
}
```

**2. Auto Alert System** (dashboard.js)
```javascript
const checkDueAlerts = () => {
    // Scans all trucks for upcoming due dates
    // Critical alerts (≤3 days) → Red background
    // Warning alerts (4-7 days) → Yellow background
    // Checks: Insurance, Tax, Pollution, FC, Permit
}
```

**3. Form Validation** (All pages)
```javascript
// Real-time validation with visual feedback
input.addEventListener('input', () => {
    input.classList.remove('error');  // Removes red border on typing
});
// Shows red border + toast notification for errors
```

**4. Secure Authentication** (auth.js + server.js)
```javascript
// Frontend: Validates and stores JWT token
// Backend: Bcrypt password hashing + JWT verification
// Protected routes: Redirects to login if not authenticated
```


✅ **Color Coding**: Green (#28a745) = Income | Red (#dc3545) = Expense  
✅ **User Feedback**: Toast notifications for every action  
✅ **Loading States**: Spinners during async operations  
✅ **Responsive**: Mobile-first with 768px/480px breakpoints  
✅ **Modular**: Each page is self-contained and independent  


1. **Start**: Show login → signup → OTP (auto-focus, timer countdown)
2. **Dashboard**: Point out greeting, empty stats, chart, alerts
3. **Add Truck**: Fill form → set insurance due date 5 days from now
4. **See Alert**: Return to dashboard → alert appears automatically
5. **Add Income**: ₹50,000 → watch stats update instantly
6. **Add Expense**: ₹15,000 fuel → stats recalculate
7. **Final View**: Chart shows bars, profit calculated, filter by truck

---

## Features

### Authentication
- **Login**: Secure login with phone and password
- **Signup**: Complete registration with user details
- **OTP Verification**: 5-digit OTP verification with 30-second timer
- **JWT Authentication**: Secure token-based authentication

### Dashboard
- **Personalized Greeting**: Time-based welcome message
- **Statistics Cards**: 
  - Total Income (Green)
  - Total Expense (Red)
  - Net Profit
- **Truck Filter**: Filter data by specific truck or view all
- **Chart.js Visualization**: Bar chart showing 6-month income vs expense trends
- **Quick Actions**: Add Income, Expense, or Truck buttons
- **Due Alerts**: Automatic alerts for dates within 7 days

### Truck Management
- Add truck with complete details:
  - Vehicle Number
  - Model (predefined dropdown)
  - Tyre Count
  - Diesel Quantity
  - Owner Name
  - Due Date applicability
  - Important dates (Due, Pollution, Tax, Insurance, FC, Permit)
  - EMI and Loan Provider
  - Document Upload
- **Automatic Alerts**: System alerts for dates due within 7 days
- Critical alerts for dates within 3 days

### Income Management
- Track income per vehicle
- Payment status (Paid/Unpaid)
- Payer company and mobile
- Notes and documentation
- File upload with preview and timestamps
- Payment list with filters:
  - All payments
  - Paid only
  - Unpaid only
  - Last 3 months
- Send notification to payer

### Expense Management
- Track expenses per vehicle
- 11 predefined categories:
  1. Fuel
  2. Maintenance
  3. Tyre
  4. Insurance
  5. Tax
  6. Permit
  7. Pollution
  8. FC
  9. Repair
  10. Driver Salary
  11. Other
- Required document upload with preview
- Detailed description and notes

## Design Features

- **Color Scheme**:
  - Income: Green (#28a745)
  - Expense: Red (#dc3545)
  - Primary: Blue (#007bff)
  
- **UI/UX**:
  - Clean and modern design
  - Gradient backgrounds
  - Smooth animations and transitions
  - Toast notifications for all actions
  - Loading spinners for async operations
  - Form validation with red error borders
  - Hover effects on interactive elements

- **Responsive Design**:
  - Mobile-first approach
  - Breakpoints at 768px and 480px
  - Flexible grid layouts
  - Touch-friendly buttons

## Technology Stack

### Frontend
- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- Chart.js for data visualization
- LocalStorage for client-side data persistence

### Backend
- Node.js
- Express.js
- JWT for authentication
- Bcrypt.js for password hashing
- Multer for file uploads
- CORS enabled
- Body-parser for JSON parsing

## Installation

1. **Install Dependencies**:
```bash
npm install
```

2. **Configure Environment**:
Edit `.env` file and update:
```
PORT=3000
JWT_SECRET=your_secure_secret_key
NODE_ENV=development
```

3. **Start the Server**:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. **Access the Application**:
Open your browser and navigate to:
```
http://localhost:3000
```

## File Structure

```
truck-management-system/
├── index.html          # Main HTML file with all pages
├── styles.css          # Complete styling and responsive design
├── app.js              # Frontend JavaScript logic
├── server.js           # Backend Express server
├── package.json        # Node.js dependencies
├── .env                # Environment variables
└── uploads/            # Directory for uploaded files (auto-created)
```

## Usage Guide

### First Time Setup
1. Open the application in your browser
2. Click "Sign Up" to create a new account
3. Fill in all required details
4. Verify OTP (in development, OTP is shown in console)
5. Login with your credentials

### Adding a Truck
1. Click "Add Truck" button on dashboard
2. Fill in vehicle details
3. Set important due dates
4. Upload relevant documents
5. Submit the form

### Recording Income
1. Click "Add Income" button
2. Select vehicle from dropdown
3. Enter amount and payer details
4. Set payment status
5. Upload supporting documents
6. Optionally send notification to payer

### Recording Expense
1. Click "Add Expense" button
2. Select vehicle and category
3. Enter amount and description
4. Upload required documents (mandatory)
5. Submit the form

### Viewing Statistics
- Use the truck filter dropdown to view specific truck data
- Click on truck buttons for quick filtering
- View the chart for 6-month trends
- Check alerts section for upcoming due dates

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - Login user

### Trucks
- `GET /api/trucks` - Get all trucks
- `POST /api/trucks` - Add new truck
- `PUT /api/trucks/:id` - Update truck
- `DELETE /api/trucks/:id` - Delete truck

### Income & Expense
- `GET /api/incomes` - Get all incomes
- `POST /api/incomes` - Add income
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add expense

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/alerts` - Get due alerts
- `POST /api/notify` - Send notification

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation
- File type validation for uploads
- File size limits (5MB)
- CORS configuration
- Environment variable protection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Production Deployment

For production deployment:

1. Update `.env`:
   - Change `NODE_ENV` to `production`
   - Use a strong `JWT_SECRET`
   
2. Use a proper database (MongoDB, PostgreSQL, etc.)

3. Integrate SMS service for OTP (Twilio, MSG91, etc.)

4. Use cloud storage for file uploads (AWS S3, Google Cloud Storage)

5. Add HTTPS with SSL certificate

6. Configure proper CORS settings

7. Add rate limiting and security headers

8. Set up logging and monitoring

## Notes

- Current implementation uses in-memory storage for demonstration
- In production, replace with a proper database
- OTP is logged to console in development mode
- File uploads are stored locally (use cloud storage in production)
- SMS integration needs to be implemented for production use

## Support

For issues or questions, please contact the development team.

## License

ISC
