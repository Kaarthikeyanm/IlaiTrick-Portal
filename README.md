# Ilaitrick Portal ⚡🔋

**Ilaitrick Portal** is a modern EV Charging Station management and booking platform designed for a seamless user and owner experience. This is a comprehensive full-stack application built for a final year project.

## 🚀 Key Features

- **User Dashboard**: Find charging stations using real-time maps, check availability, and book slots.
- **Owner Dashboard**: Manage charging stations, approve/reject bookings, and verify customer receipts.
- **Admin Panel**: Full control over users, stations, and system-wide monitoring.
- **Advanced Booking System**: Automatic slot management, 5-minute cancellation window, and secure receipt verification.
- **Modern Payments**: Integrated Stripe for credit cards and a custom **UPI / QR Code** payment simulation.
- **Branded Experience**: A professional, responsive UI with custom branding, logos, and automated email notifications.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Axios, Radix UI.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Authentication**: JWT-based secure login and registration.
- **Mailing**: Nodemailer for automated receipts and status updates.
- **Payment**: Stripe API (Card) + Custom QR simulation.

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/ilaitrick-portal.git
    cd ilaitrick-portal
    ```

2.  **Install Dependencies**:
    ```bash
    npm run install:all
    ```

3.  **Environment Variables**:
    Create a `.env` file in the `backend/` folder and add:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    MAIL_USER=your_email@gmail.com
    MAIL_PASS=your_app_password
    STRIPE_SECRET_KEY=your_stripe_secret
    ```

4.  **Build the Frontend**:
    ```bash
    npm run build
    ```

5.  **Start the Application**:
    ```bash
    npm start
    ```
    Access the site at: `http://localhost:5000`

## 👨‍💻 Admin Credentials (Demo)
- **Email**: `ilaitricprotal@gmail.com`
- **Password**: `thalapathy`

## 📄 License
This project is for educational purposes only.

---
*Created with ❤️ for Final Year Project Submission.*
