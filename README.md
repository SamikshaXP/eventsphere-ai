# EventSphere AI 🎟️
### An Intelligent Event Operations Platform

EventSphere AI is a full-stack event management platform designed to simplify
event operations while turning event data into actionable insights.

Instead of treating event management as only event creation and registration,
EventSphere AI combines:

- Event Management
- Organization & Membership Management
- Registration & Ticketing
- Attendance
- Analytics
- AI-powered Insights
- Demand & Risk Analysis
- Personalized Recommendations

The goal is to help organizers manage events efficiently and make
data-driven decisions, while giving participants a simple way to discover
and interact with events.

## 🚀 Key Features

### 🔐 Authentication & Authorization

- User authentication using JWT
- Password hashing using bcrypt
- Protected routes
- Organization-based access control
- Role-based permissions
- Membership-based authorization

### 🏢 Organization Management

- Create and manage organizations
- Organization membership
- Role-based organization access
- Multi-organization user architecture

### 📅 Event Management

Organizers can manage the complete event lifecycle:

- Create events
- Update events
- View event details
- Manage event capacity
- Organization-specific events
- Event status and lifecycle management

### 🎟️ Registration & Ticketing

Participants can register for events and receive tickets.

The registration system includes:

- Event registration
- Registration validation
- Capacity checks
- Ticket generation
- Registration management

### 📊 Attendance

EventSphere AI includes an attendance management layer for tracking
participant check-ins and event participation.

### 📈 Analytics

Event data is transformed into useful operational metrics.

Analytics can help organizers understand:

- Registration trends
- Event participation
- Capacity utilization
- Attendance patterns
- Event performance

### 🤖 EventSphere Intelligence Engine (ESIE)

ESIE is the intelligence layer of EventSphere AI.

It processes event-related data to generate useful operational insights.

Current intelligence modules include:

- Event Risk Analysis
- Demand Prediction
- Organizer Insights
- Event Analytics
- Personalized Recommendations

The objective is to move from:

> Data → Information → Insight → Action

### 💡 AI Insights

Organizers can receive insights based on event data to identify potential
problems and opportunities.

Examples include:

- Low registration trends
- Capacity utilization concerns
- Event performance signals
- Potential operational risks

### 🎯 Personalized Recommendations

EventSphere AI also includes a recommendation layer designed to help
participants discover events that may be relevant to them.


# 🏗️ System Architecture

EventSphere AI follows a modular full-stack architecture.

                    EventSphere AI
                          │
              ┌───────────┴───────────┐
              │                       │
          Frontend                 Backend
        React + Vite             Node + Express
              │                       │
              │                  Controllers
              │                       │
              │                    Services
              │                       │
              │                    Models
              │                       │
              └────────── API ─────────┘
                                      │
                                  MongoDB


🛠️ Tech Stack
## Frontend
React
Vite
JavaScript
CSS
## Backend
Node.js
Express.js
REST APIs
Database
MongoDB
Mongoose
## Authentication & Security
JWT
bcrypt
Organization-based RBAC
Protected API routes
## AI & Intelligence
AI service architecture
Demand Prediction
Event Risk Analysis
Insight Generation
Recommendation Engine  

 ## Team

EventSphere AI is developed as a collaborative full-stack project.

Team Members
Samiksha
Sanya
Prachi

The project follows a modular development approach where different team
members contribute to frontend, backend, database, analytics and AI-related
modules.
