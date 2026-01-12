# ConverseX Setup Guide 🚀

## Step-by-Step Setup Instructions

### ✅ Prerequisites Checklist

Before starting, make sure you have:
- [ ] Node.js (v16+) installed
- [ ] MongoDB installed and running
- [ ] npm package manager

---

## 🔧 Installation Steps

### Step 1: Install MongoDB

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Select "Run service as Network Service user"
5. Install MongoDB Compass (GUI tool)
6. Start MongoDB service: `net start MongoDB`

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### Step 2: Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongo --version

# Connect to MongoDB shell
mongosh
```

---

### Step 3: Install Project Dependencies

**Frontend Dependencies:**
```bash
cd converseX-main
npm install
```

**Backend Dependencies:**
```bash
cd server
npm install
cd ..
```

---

### Step 4: Configure Environment Variables

**Frontend `.env` (in root directory):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Backend `server/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/conversex
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:5173
```

---

### Step 5: Run the Application

**Option 1: Run servers in separate terminals (Recommended)**

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

**Option 2: Run both together (requires concurrently)**
```bash
npm install concurrently --save-dev
npm start
```

---

### Step 6: Access the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. Register a new account
4. Start chatting!

---

## 🎯 First Time User Guide

### Creating Your First Community

1. **Register/Login**
   - Click "Sign Up" if you're new
   - Enter username, email, and password
   - You'll be redirected to the dashboard

2. **Create a Community**
   - Click the **+** button in the left sidebar
   - Enter community name (e.g., "My Study Group")
   - Add a description
   - Choose an icon 🎮💻📚
   - Click "Create Community"

3. **Start Chatting**
   - A default "general" channel is created automatically
   - Click on the channel to open it
   - Type your message in the input box at the bottom
   - Press Enter or click "Send"

4. **Real-time Features**
   - Your messages appear instantly
   - See when others are typing
   - All connected users receive messages in real-time

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to MongoDB"
**Solution:**
- Verify MongoDB is running: `mongosh`
- Check MongoDB URI in `server/.env`
- Try: `mongodb://127.0.0.1:27017/conversex` instead of localhost

### Issue 2: "Port 5173 already in use"
**Solution:**
- Kill the process using port 5173
- Or change the port in `vite.config.js`:
```js
export default defineConfig({
  server: { port: 3000 }
})
```

### Issue 3: "Port 5000 already in use"
**Solution:**
- Change PORT in `server/.env` to another port (e.g., 5001)
- Update `VITE_API_URL` in frontend `.env` accordingly

### Issue 4: "Socket connection failed"
**Solution:**
- Make sure backend server is running
- Check firewall settings
- Verify CORS settings in `server/server.js`

### Issue 5: "npm ERR! ENOENT"
**Solution:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## 📝 Development Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Scripts
```bash
npm start            # Start server
npm run dev          # Start with nodemon (auto-reload)
```

---

## 🌐 Testing the Application

### Test Real-time Messaging
1. Open two browser windows
2. Register two different accounts
3. Create a community with first account
4. Have second account join the community
5. Send messages between users
6. Observe real-time delivery!

---

## 🔐 Security Notes

**Important for Production:**
1. Change JWT_SECRET to a random, secure string
2. Use environment-specific MongoDB URIs
3. Enable HTTPS
4. Add rate limiting
5. Implement input validation and sanitization
6. Add user permissions and roles

---

## 📊 Database Structure

### Collections Created:
- **users** - User accounts
- **communities** - Community/server data
- **channels** - Channel information
- **messages** - Chat messages

### To View Database:
```bash
mongosh
use conversex
db.users.find()
db.communities.find()
db.channels.find()
db.messages.find()
```

---

## 🎨 Customization

### Change Theme Colors
Edit CSS files in:
- `src/App.css`
- `src/pages/Auth.css`
- `src/components/Sidebar.css`
- `src/components/ChatArea.css`

### Add New Features
- Add voice channels
- Implement file uploads
- Add emoji picker
- Create user profiles
- Add friend system
- Implement notifications

---

## 📚 Technologies Used

| Technology | Purpose |
|------------|---------|
| React 19 | Frontend UI |
| Vite | Build tool |
| Express.js | Backend API |
| MongoDB | Database |
| Socket.IO | Real-time communication |
| JWT | Authentication |
| Axios | HTTP requests |
| React Router | Navigation |

---

## 🤝 Need Help?

If you encounter issues:
1. Check the console for errors (F12 in browser)
2. Check terminal logs for backend errors
3. Verify all environment variables are set
4. Ensure MongoDB is running
5. Check network tab for API request failures

---

## ✨ Next Steps

After successful setup:
- [ ] Test registration and login
- [ ] Create your first community
- [ ] Send messages
- [ ] Test real-time features
- [ ] Invite friends to test
- [ ] Explore the codebase
- [ ] Add custom features

---

**Congratulations! Your ConverseX application is ready! 🎉**

Happy coding and chatting! 💬
