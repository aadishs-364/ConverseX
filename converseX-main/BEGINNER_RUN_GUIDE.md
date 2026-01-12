# 🚀 BEGINNER'S GUIDE TO RUN CONVERSEX

## 📖 What is this project?

ConverseX is a **chat application** (like Discord or WhatsApp) where you can:
- Create communities (groups)
- Chat in real-time with friends
- See when others are typing
- All messages appear instantly!

---

## 🛠️ Prerequisites (Things you need first)

### 1. Install Node.js
- Go to: https://nodejs.org/
- Download the **LTS version** (e.g., v20.x.x)
- Install it (just click Next > Next > Install)
- **To check if installed:** Open terminal and type:
  ```bash
  node --version
  ```
  You should see something like: `v20.10.0`

### 2. Install MongoDB
- Go to: https://www.mongodb.com/try/download/community
- Download MongoDB Community Server
- Install it (choose Complete installation)
- MongoDB will start automatically

**To check if MongoDB is running:**
```bash
mongosh
```
If you see `MongoDB shell version`, it's working! Type `exit` to quit.

---

## 📦 Step-by-Step Installation

### STEP 1: Open Project Folder
```bash
cd "c:\Users\aadis\OneDrive\Desktop\PES_COLLEGE\WEB_TECH_SEM_3\converseX-main\converseX-main"
```

### STEP 2: Install Frontend Dependencies
These are the libraries/packages that the React app needs:
```bash
npm install
```
Wait for it to finish... (might take 1-2 minutes)

### STEP 3: Install Backend Dependencies
Now install packages for the Node.js server:
```bash
cd server
npm install
cd ..
```
Wait for it to finish...

### STEP 4: Check Environment Files
The `.env` files are already created with correct settings:
- Root folder: `.env` (frontend settings)
- `server/.env` (backend settings)

**You don't need to change anything!** But if you want to know:
- Frontend connects to: `http://localhost:5173`
- Backend runs on: `http://localhost:5000`
- MongoDB database: `mongodb://localhost:27017/conversex`

---

## ▶️ HOW TO RUN THE APPLICATION

You need **2 terminals** (command prompts) open at the same time.

### Terminal 1: Start Backend Server

1. Open **first terminal** (PowerShell or Command Prompt)
2. Navigate to server folder:
   ```powershell
   cd "c:\Users\aadis\OneDrive\Desktop\PES_COLLEGE\WEB_TECH_SEM_3\converseX-main\converseX-main\server"
   ```
3. Start the server:
   ```powershell
   npm run dev
   ```
4. Wait for these messages:
   ```
   ✅ MongoDB connected successfully
   🚀 ConverseX Server Started!
   📡 Server running on port 5000
   ```

**KEEP THIS TERMINAL OPEN!** Don't close it.

---

### Terminal 2: Start Frontend (React App)

1. Open **second terminal** (PowerShell or Command Prompt)
2. Navigate to project root:
   ```powershell
   cd "c:\Users\aadis\OneDrive\Desktop\PES_COLLEGE\WEB_TECH_SEM_3\converseX-main\converseX-main"
   ```
3. Start the React app:
   ```powershell
   npm run dev
   ```
4. Wait for this message:
   ```
   VITE v7.1.7  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

**KEEP THIS TERMINAL OPEN TOO!**

---

## 🌐 Open the App in Browser

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **http://localhost:5173**
3. You should see the ConverseX login page! 🎉

---

## 🎮 HOW TO USE THE APP

### 1. Register a New Account
- Click **"Sign Up"** on the login page
- Enter:
  - **Username** (e.g., "john_doe")
  - **Email** (e.g., "john@example.com")
  - **Password** (at least 6 characters)
  - **Confirm Password** (same as password)
- Click **"Sign Up"**
- You'll be automatically logged in!

### 2. Create Your First Community
- Look at the left sidebar
- Click the **"+"** button at the top
- Fill in:
  - **Name** (e.g., "Study Group")
  - **Description** (optional, e.g., "For homework help")
  - **Icon** (click any emoji you like)
  - Check **"Make this community public"**
- Click **"Create Community"**
- A "general" channel will be created automatically!

### 3. Start Chatting
- Click on the **"general"** channel in the sidebar
- Type your message in the box at the bottom
- Press **Enter** or click **"Send"**
- Your message appears instantly! 💬

### 4. Test Real-Time Features
Want to see the magic? Open the app in **2 browser windows**:

**Window 1:**
- Register as "Alice"
- Create a community "Fun Chat"

**Window 2 (Incognito/Private mode):**
- Register as "Bob"
- Join the same community
- Both can chat in real-time!
- Type slowly and you'll see "Alice is typing..." / "Bob is typing..."

---

## 🛑 HOW TO STOP THE APP

### Stop Frontend (Terminal 2):
Press `Ctrl + C` on your keyboard

### Stop Backend (Terminal 1):
Press `Ctrl + C` on your keyboard

### Stop MongoDB (Optional):
If you want to stop MongoDB completely:
```bash
net stop MongoDB
```

---

## 🐛 Common Problems & Solutions

### Problem 1: "npm is not recognized"
**Solution:** Node.js is not installed or not in PATH
- Reinstall Node.js from https://nodejs.org/
- Restart your computer

### Problem 2: "Port 5173 already in use"
**Solution:** Something is already using that port
- Close any other apps using that port
- Or the app is already running (check browser)

### Problem 3: "Cannot connect to MongoDB"
**Solution:** MongoDB is not running
```bash
# Start MongoDB (Windows)
net start MongoDB
```

### Problem 4: Backend says "MongoDB connection error"
**Solution:** 
- Check if MongoDB is installed
- Try this command: `mongosh`
- If it works, MongoDB is running!

### Problem 5: Frontend shows blank page
**Solution:**
- Check backend is running (Terminal 1)
- Check browser console (Press F12)
- Refresh the page (Press F5)

### Problem 6: "ENOENT" or "Module not found"
**Solution:** Dependencies not installed properly
```bash
# Delete node_modules and reinstall
npm install
cd server
npm install
```

---

## 📚 Understanding the Code Structure

### Backend (server folder)
```
server/
├── models/          <- Database structures (User, Community, Channel, Message)
├── routes/          <- API endpoints (auth, community, channel, message)
├── middleware/      <- Security check (auth.js)
├── config/          <- Database connection
└── server.js        <- Main file that starts everything
```

### Frontend (src folder)
```
src/
├── components/      <- Reusable UI parts (Sidebar, ChatArea, etc.)
├── pages/           <- Full pages (Login, Register, Dashboard)
├── context/         <- Global state (AuthContext)
├── services/        <- API calls (api.js, socket.js)
└── App.jsx          <- Main app file
```

---

## 🎯 What's Happening Behind the Scenes?

### When you register:
1. Frontend sends username, email, password to backend
2. Backend encrypts password (for security)
3. Backend saves user in MongoDB database
4. Backend creates a login token (JWT)
5. Frontend saves token in browser
6. You're logged in!

### When you send a message:
1. You type message and press Send
2. Frontend sends message to backend API
3. Backend saves message in MongoDB
4. Backend broadcasts message via Socket.IO
5. **All users** in that channel receive it instantly!
6. Message appears on everyone's screen in real-time!

---

## 🎓 Learning Resources

### Want to learn more?

**MERN Stack:**
- MongoDB: https://www.mongodb.com/docs/manual/tutorial/
- Express.js: https://expressjs.com/en/starter/hello-world.html
- React: https://react.dev/learn
- Node.js: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs

**Real-time with Socket.IO:**
- https://socket.io/get-started/chat

**YouTube Channels:**
- Traversy Media
- Web Dev Simplified
- Programming with Mosh

---

## ✅ Success Checklist

Before asking for help, make sure:
- [ ] Node.js is installed (`node --version` works)
- [ ] MongoDB is installed and running (`mongosh` works)
- [ ] You ran `npm install` in root folder
- [ ] You ran `npm install` in server folder
- [ ] Backend terminal shows "Server running"
- [ ] Frontend terminal shows "Local: http://localhost:5173"
- [ ] Browser opens http://localhost:5173
- [ ] Both terminals are still open

---

## 💡 Tips for Beginners

1. **Keep both terminals open** while using the app
2. **Don't close browser** while testing
3. **Check MongoDB is running** before starting backend
4. **Read error messages** - they often tell you what's wrong!
5. **Use browser's Developer Tools** (F12) to see errors
6. **Test with 2 users** to see real-time features

---

## 🎉 YOU DID IT!

Congratulations! You're now running a full-stack MERN application with:
- ✅ User authentication
- ✅ Real-time messaging
- ✅ Database storage
- ✅ Beautiful UI

**This is a complete, production-ready chat application!**

Now you can:
- Show it to friends and family
- Add it to your portfolio
- Modify the code and learn
- Deploy it to the internet (Render, Heroku, etc.)

---

**Happy Coding! 🚀**

If you have questions, check:
1. Terminal error messages
2. Browser console (F12)
3. This guide again
4. README.md file
5. SETUP_GUIDE.md file
