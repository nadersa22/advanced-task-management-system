# My TODO App

A simple full-stack TODO application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- Add new todos
- Mark todos as complete/incomplete
- Delete todos
- Filter todos (All/Active/Completed)
- Clear all completed todos
- Real-time statistics

## Setup Instructions

1. Clone this repository
2. Navigate to backend folder: `cd backend`
3. Install dependencies: `npm install`
4. Create `.env` file with your MongoDB connection string
5. Start server: `npm run dev`
6. Open `frontend/index.html` in your browser

## Technologies Used

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Database:** MongoDB Atlas

## API Endpoints

- GET /todos - Get all todos
- POST /todos - Create new todo
- PUT /todos/:id - Update todo
- DELETE /todos/:id - Delete todo