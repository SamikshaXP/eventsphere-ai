
# EventSphere AI 🎟️

## An Intelligent Event Operations Platform

EventSphere AI is a full-stack event management platform designed to help organizations manage events, registrations, attendance, and event data from a single platform.

The platform goes beyond basic event management by using analytics and AI-powered intelligence to help organizers understand event performance, identify potential risks, and make better decisions.

## 🚀 Key Features

- 🔐 User Authentication & Authorization
- 🏢 Organization & Membership Management
- 📅 Event Creation & Management
- 🎟️ Event Registration & Ticketing
- 📊 Event Analytics
- 🤖 AI-Powered Event Insights
- ⚠️ Event Risk Analysis
- 📈 Demand Prediction
- 💡 Personalized Event Recommendations
- 👥 Attendance Management


## 🧠 EventSphere Intelligence Engine (ESIE)

The **EventSphere Intelligence Engine (ESIE)** is the intelligence layer of the platform.

It uses event-related data to provide useful insights for organizers and participants.

The current intelligence layer includes:

- Event Analytics
- Event Risk Analysis
- Demand Prediction
- Organizer Insights
- Personalized Recommendations

The overall idea is:
```text
Event Data
    ↓
Analytics
    ↓
AI / Intelligence
    ↓
Insights
    ↓
Recommendations
    ↓
Better Decisions
````


## 🏗️ System Architecture

EventSphere AI follows a modular full-stack architecture.

```text
                    EventSphere AI
                          │
              ┌───────────┴───────────┐
              │                       │
          Frontend                 Backend
              │                       │
       React + Vite             Node.js + Express
                                      │
                              ┌───────┴───────┐
                              │               │
                         Controllers       Services
                              │               │
                            Models          Routes
                              │
                           MongoDB


The core application flow is:

```text
Organization
      ↓
    Events
      ↓
 Registrations
      ↓
   Tickets
      ↓
  Attendance
      ↓
   Analytics
      ↓
     ESIE
      ↓
Insights & Recommendations
```


## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* MongoDB
* Mongoose

### Authentication & Security

* JWT
* bcrypt
* Protected Routes
* Role-Based Access Control
* Organization-Based Authorization

### Intelligence

* Analytics Services
* Demand Prediction
* Event Risk Analysis
* AI Insights
* Recommendation Engine


## 📁 Project Structure

```text
EventSphere-AI/
│
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── api.js
│       ├── main.js
│       └── style.css
│
├── docs/
├── assets/
├── scripts/
│
├── .env.example
└── README.md
```


## 💻 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* MongoDB / MongoDB Atlas
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/SamikshaXP/eventsphere-ai.git
cd eventsphere-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file and add the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the local Vite development server.

---

## 🔒 Environment Variables

Sensitive information such as database credentials and authentication secrets should be stored in environment variables.

Do not commit the actual `.env` file to GitHub.

Use `.env.example` as a reference for the required configuration.

---

## 📌 Current Project Status

### Implemented

* [x] Project Foundation
* [x] Express Backend
* [x] MongoDB & Mongoose
* [x] User Authentication
* [x] Organization Management
* [x] Membership & Role-Based Access
* [x] Event Management
* [x] Event Registration
* [x] Ticketing
* [x] Attendance Backend
* [x] Analytics Foundation
* [x] AI / Intelligence Services
* [x] Event Risk Analysis
* [x] Demand Prediction
* [x] Organizer Insights
* [x] Recommendation System
* [x] React Frontend

### Planned / Future Improvements

* [ ] Complete end-to-end integration testing
* [ ] QR-based attendance refinement
* [ ] Payment Integration
* [ ] Email & Notification System
* [ ] Certificate Generation
* [ ] Advanced Testing
* [ ] Production Deployment


## 👥 Team

EventSphere AI is developed as a collaborative project by:

* **Samiksha**
* **Sanya**
* **Prachi**


## 🎯 Project Vision

Traditional event management usually focuses on:

```text
Create Event → Register Participants → Conduct Event
```

EventSphere AI aims to extend this workflow:

```text
Create
  ↓
Manage
  ↓
Register
  ↓
Track
  ↓
Analyze
  ↓
Predict
  ↓
Understand
  ↓
Take Action
```

The long-term vision is to build an intelligent event operations platform that helps organizations improve event planning, execution, and decision-making through data and AI.


## 📄 Repository

**GitHub:**
[https://github.com/SamikshaXP/eventsphere-ai](https://github.com/SamikshaXP/eventsphere-ai)


### EventSphere AI

**An Intelligent Event Operations Platform**
```
