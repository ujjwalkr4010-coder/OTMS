# 🎓 OTMS - Online Tuition Management System

A full-stack web application for managing online tuition with Student, Tutor, and Admin roles.

## 📁 Project Structure

```
otms/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── supabase.js       # Supabase client
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── routes/
│   │   ├── auth.js           # Login, Register, Me
│   │   ├── users.js          # User management
│   │   ├── courses.js        # Course CRUD + enrollment
│   │   ├── attendance.js     # Attendance tracking
│   │   ├── assignments.js    # Assignments + submissions
│   │   ├── payments.js       # Fee management
│   │   ├── chatbot.js        # Rule-based chatbot
│   │   └── analytics.js      # AI performance analysis
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Chatbot.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Assignments.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   ├── Payments.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   ├── tutor/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Courses.jsx
│   │   │   │   ├── Attendance.jsx
│   │   │   │   └── Assignments.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Users.jsx
│   │   │       └── Payments.jsx
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql            # Supabase PostgreSQL schema
│
└── README.md
```

---

## 🗄️ Step 1: Supabase Setup

### 1.1 Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `otms`
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait ~2 minutes for the project to be ready

### 1.2 Run the Database Schema
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of `database/schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### 1.3 Get Your API Keys
1. Go to **Settings → API** in your Supabase dashboard
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_KEY`
   
   ⚠️ Use the `service_role` key (NOT the `anon` key) for the backend

---

## ⚙️ Step 2: Environment Variables

### Backend `.env`
Create `backend/.env` (copy from `backend/.env.example`):

```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=my_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

### Frontend `.env`
Create `frontend/.env` (copy from `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Step 3: Run Locally

### Install Dependencies

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```
Backend runs at: http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

### Test the App
Open http://localhost:5173 in your browser.

**Demo Login Credentials:**
| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@otms.com     | admin123   |
| Tutor   | tutor@otms.com     | tutor123   |
| Student | student@otms.com   | student123 |

---

## 🌐 Step 4: Deploy on Render

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial OTMS commit"
git remote add origin https://github.com/yourusername/otms.git
git push -u origin main
```

### 4.2 Deploy Backend on Render

1. Go to [https://render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `otms-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add **Environment Variables**:
   ```
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   JWT_SECRET=your_production_jwt_secret
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.onrender.com
   ```
6. Click **"Create Web Service"**
7. Wait for deployment. Copy the URL (e.g., `https://otms-backend.onrender.com`)

### 4.3 Deploy Frontend on Render

1. Click **"New +"** → **"Static Site"**
2. Connect the same GitHub repo
3. Configure:
   - **Name**: `otms-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   ```
   VITE_API_URL=https://otms-backend.onrender.com/api
   ```
5. Click **"Create Static Site"**

### 4.4 Update Backend CORS
After frontend deploys, update `FRONTEND_URL` in backend env vars to your actual frontend URL.

---

## 🔌 API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Get current user | All |
| GET | /api/users | List all users | Admin |
| GET | /api/users/profile | Get own profile | All |
| GET | /api/courses | List all courses | All |
| POST | /api/courses | Create course | Tutor/Admin |
| POST | /api/courses/:id/enroll | Enroll in course | Student |
| GET | /api/courses/my/enrolled | My enrolled courses | Student |
| GET | /api/courses/my/teaching | My courses | Tutor |
| POST | /api/attendance | Mark attendance | Tutor/Admin |
| GET | /api/attendance/student/me | My attendance | Student |
| GET | /api/assignments/my | My assignments | Student |
| POST | /api/assignments | Create assignment | Tutor/Admin |
| POST | /api/assignments/:id/submit | Submit assignment | Student |
| POST | /api/payments/initiate | Start payment | Student |
| POST | /api/payments/:id/confirm | Confirm payment | Student |
| GET | /api/payments/my | My payments | Student |
| GET | /api/payments/all | All payments | Admin |
| POST | /api/chatbot/message | Chat with bot | All |
| GET | /api/analytics/student/me | AI performance | Student |
| GET | /api/analytics/admin/overview | Admin stats | Admin |

---

## ✨ Features

- **Authentication**: JWT-based login/register for Student, Tutor, Admin
- **Student Dashboard**: Enrolled courses, assignments, attendance overview
- **Tutor Dashboard**: Course management, mark attendance, grade assignments
- **Admin Dashboard**: User management, payment overview, system stats
- **Course Management**: Create, edit, enroll with Zoom/Meet links
- **Attendance Tracking**: Mark present/absent/late, view percentage
- **Assignment System**: Create, submit, grade with feedback
- **Fee Management**: Dummy card payment system with transaction history
- **AI Performance Analysis**: Score, grade, insights, recommendations
- **Rule-based Chatbot**: Answers common questions about the platform
- **Responsive UI**: Works on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| HTTP Client | Axios |
| Deployment | Render (backend + frontend) |
