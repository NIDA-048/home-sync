# HomeSync

### Smart Household Task Management & Fairness Platform

HomeSync is a full-stack household task management platform designed to make shared responsibilities more organized, transparent, and balanced.

It allows household members to manage recurring and temporary tasks, automatically distribute responsibilities, track task progress, submit completion evidence, monitor workload, and share anonymous feedback.

---

## Overview

Managing household chores among multiple people can become difficult when responsibilities are unclear or repeatedly assigned to the same person.

HomeSync addresses this problem by providing a centralized platform where household members can:

* Create or join a household
* Add and manage household tasks
* Create recurring tasks with flexible frequencies
* Automatically rotate recurring task assignments
* View personal and household-wide tasks
* Track task progress in real time
* Submit photo evidence when completing tasks
* Review task history
* Monitor workload distribution
* Receive task and activity notifications
* Submit anonymous household feedback
* Manage their profile and account settings

The goal is to provide a simple and transparent system for sharing household responsibilities.

---

## Key Features

### Authentication

* User registration and login
* Secure password hashing
* Cookie-based authentication
* Protected dashboard routes
* User session management
* Logout functionality

### Household Management

* Create a household
* Join an existing household using an invitation code
* View household members
* Identify household owner and members
* View member profile pictures
* Monitor household workload

### Task Management

HomeSync supports multiple task types:

* Daily Tasks
* Temporary Tasks
* Permanent Tasks

Users can:

* Create tasks
* Edit tasks
* Delete tasks
* Assign tasks to household members
* View task details
* Track task status
* View today's tasks
* View household tasks
* Review task history

### Recurring Tasks

Recurring tasks can be configured with different frequencies:

* Daily
* Every 2 Days
* Every 3 Days
* Weekly
* Every 2 Weeks
* Custom Weekdays

Recurring assignments are automatically rotated between household members to help distribute responsibilities fairly.

### Task Progress Tracking

Each assigned task can move through different stages:

```text
To Do → Pending → In Progress → Done
```

When a member starts a task, HomeSync tracks the task progress and time taken.

Task completion requires completion evidence through a photo.

### Workload Tracking

HomeSync provides household-level workload information including:

* Total assigned tasks
* Pending tasks
* Completed tasks
* Member workload
* Today's progress
* Task distribution

This helps household members understand how responsibilities are distributed.

### Anonymous Feedback

Household members can submit anonymous feedback.

Feedback:

* Does not display the sender's name
* Is visible to household members
* Helps identify household concerns
* Encourages open communication

### Notifications

HomeSync provides notifications for household activity such as:

* Task assignments
* Task reminders
* Task completion
* Task reassignment
* Feedback activity
* Personal reminders

Unread notifications are highlighted in the interface and can be marked as read or deleted.

### Calendar

The calendar provides a date-based view of household activities and tasks.

Users can navigate through dates and review scheduled household responsibilities.

### Profile & Settings

Users can manage:

* Profile picture
* Name
* Email
* Password settings
* Notification preferences
* Household access
* Account logout

Profile pictures are stored and displayed across the household member interface.

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router
* Lucide React
* GSAP
* Recharts

### Backend

* Next.js API Routes
* Prisma ORM
* PostgreSQL
* Zod
* bcryptjs
* jose

### Development Tools

* Node.js
* npm
* Git
* GitHub

---

## Project Architecture

```text
home-sync/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── household/
│   │   │   ├── notifications/
│   │   │   └── tasks/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── calendar/
│   │   │   ├── feedback/
│   │   │   ├── members/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   └── tasks/
│   │   │
│   │   ├── login/
│   │   ├── register/
│   │   └── landing/
│   │
│   ├── components/
│   └── lib/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Task Workflow

```text
Create Task
     ↓
Assign Members
     ↓
Task Appears on Dashboard
     ↓
Member Starts Task
     ↓
In Progress
     ↓
Complete Task
     ↓
Upload Completion Evidence
     ↓
Task Marked as Done
     ↓
Task History Updated
```

---

## Recurring Task Workflow

```text
Create Recurring Task
        ↓
Select Frequency
        ↓
Select Assigned Members
        ↓
Generate Task Occurrence
        ↓
Automatic Member Rotation
        ↓
Next Occurrence
        ↓
Continue Rotation
```

---

## Dashboard

The HomeSync dashboard provides a centralized overview of household responsibilities.

It includes:

* Welcome section
* Household members
* Member workload
* Personal task board
* Task status
* Workload analytics
* Today's progress
* Quick actions
* Notifications

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd home-sync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your-postgresql-database-url"
JWT_SECRET="your-secure-secret"
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migration

```bash
npx prisma migrate dev
```

### 6. Start the Development Server

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## Database

HomeSync uses PostgreSQL with Prisma ORM.

The database manages important entities such as:

* Users
* Households
* Household Members
* Tasks
* Task Assignments
* Task Occurrences
* Notifications
* Feedback

Prisma provides type-safe database access throughout the application.

---

## Authentication Flow

```text
User
 ↓
Register / Login
 ↓
Credentials Verified
 ↓
Password Checked
 ↓
Authentication Token Created
 ↓
Secure Cookie Stored
 ↓
Protected Dashboard Access
```

Passwords are securely hashed before being stored.

---

## Task Status

HomeSync uses the following task statuses:

| Status      | Description                            |
| ----------- | -------------------------------------- |
| To Do       | Task is available but has not started  |
| Pending     | Task is waiting to be completed        |
| In Progress | Member has started working on the task |
| Done        | Task has been completed with evidence  |

---

## Task Types

| Type      | Description                      |
| --------- | -------------------------------- |
| Daily     | Regular household task           |
| Temporary | Short-term or guest-related task |
| Permanent | Long-term household task         |

---

## Project Goals

HomeSync is designed to achieve the following goals:

1. Improve household task organization.
2. Reduce confusion about task ownership.
3. Distribute recurring responsibilities systematically.
4. Provide transparency in household workload.
5. Track task completion and evidence.
6. Maintain a history of household responsibilities.
7. Encourage communication through anonymous feedback.
8. Provide a centralized household management experience.

---

## Future Enhancements

Potential future improvements include:

* Advanced workload fairness analytics
* Smart task recommendations
* AI-assisted task scheduling
* Mobile application
* Real-time notifications
* Push notifications
* Advanced household reports
* Task priority management
* More detailed productivity analytics

---

## Project Status

**Development Status:** Active Development

HomeSync is being developed as a full-stack academic/FYP project with a focus on real-world household task management and responsibility distribution.

---

## License

This project is developed for educational and academic purposes.

---

## Author

**Nida**

BS Computer Science
University of Gujrat
