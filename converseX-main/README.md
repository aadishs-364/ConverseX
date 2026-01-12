# ConverseX 🎉

A community-based communication platform built with the MERN stack (MongoDB, Express, React, Node.js). The project focuses on creating spaces where users can connect through real-time messaging and video calls.

## ✨ Key Features

- **MERN Stack** - Built with MongoDB, Express.js, React, and Node.js
- **Communities/Servers** - Organize groups of users
- **Real-time Text Messaging** - Instant communication with Socket.IO
- **User Authentication** - Secure JWT-based auth system
- **Responsive Design** - Modern, user-friendly interface
- **Channel-based Communication** - Organized conversation spaces

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd converseX-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**

   **Frontend** - Create `.env` in the root directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

   **Backend** - Create `server/.env`:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/conversex
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:5173
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

6. **Run the application**

   **Option 1: Run both servers separately**
   
   Terminal 1 (Frontend):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   **Option 2: Or use the concurrently script (if installed)**
   ```bash
   npm start
   ```

7. **Open your browser**
   
   Navigate to: `http://localhost:5173`

## 📁 Project Structure

```
conversex-main/
├── public/              # Static assets
├── server/              # Backend server
│   ├── config/          # Database configuration
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── .env             # Backend environment variables
│   ├── package.json     # Backend dependencies
│   └── server.js        # Express server entry point
├── src/                 # Frontend React app
│   ├── components/      # React components
│   │   ├── ChatArea.jsx
│   │   ├── CreateCommunityModal.jsx
│   │   └── Sidebar.jsx
│   ├── context/         # React context (state management)
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── services/        # API & Socket services
│   │   ├── api.js
│   │   └── socket.js
│   ├── App.jsx          # Main app component
│   └── main.jsx         # React entry point
├── .env                 # Frontend environment variables
├── package.json         # Frontend dependencies
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool and dev server

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Communities
- `GET /api/communities` - Get all user communities
- `GET /api/communities/:id` - Get specific community
- `POST /api/communities` - Create new community
- `POST /api/communities/:id/join` - Join community
- `POST /api/communities/:id/leave` - Leave community
- `DELETE /api/communities/:id` - Delete community

### Channels
- `GET /api/channels/community/:communityId` - Get channels in community
- `GET /api/channels/:id` - Get specific channel
- `POST /api/channels` - Create new channel
- `DELETE /api/channels/:id` - Delete channel

### Messages
- `GET /api/messages/channel/:channelId` - Get messages in channel
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

## 🎮 Usage

1. **Register an Account**
   - Click "Sign Up" on the login page
   - Enter username, email, and password
   - You'll be automatically logged in

2. **Create a Community**
   - Click the "+" button in the community sidebar
   - Enter community name, description, and choose an icon
   - Your first channel "general" is created automatically

3. **Start Chatting**
   - Select a community from the left sidebar
   - Choose a channel
   - Type your message and hit Send or press Enter
   - Messages appear in real-time for all users

4. **Real-time Features**
   - See typing indicators when others are typing
   - Messages appear instantly without refreshing
   - Online status indicators

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check the MongoDB URI in `server/.env`
- Verify MongoDB is listening on port 27017

### Port Already in Use
- Frontend (5173): Change in `vite.config.js`
- Backend (5000): Change PORT in `server/.env`

### Socket Connection Errors
- Ensure backend server is running
- Check CORS settings in `server/server.js`
- Verify VITE_SOCKET_URL in `.env`

## 📝 License

This project is for educational purposes.

## 👨‍💻 Developer

Built with ❤️ as a college project

## 🙏 Acknowledgments

- Inspired by Discord and Slack
- Built for Web Technology course
- MERN Stack implementation

---

**Happy Chatting! 🎉**

