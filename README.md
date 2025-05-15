Skill Exchange
Skill Exchange is a web platform that enables users to register, share their skills, request skills from others, and manage skill exchange requests. Built with a modern tech stack, it provides a user-friendly interface for skill sharing and collaboration.
Features

User Registration: Sign up with name, email, phone, location, bio, and password.
Dashboard: View profile, manage skills, and track sent/received skill requests.
Skill Management: Add skills with name, description, and category; delete skills (if no associated requests).
Request System: Create requests for others' skills and accept/complete received requests.
Request Protection: Skills with pending requests cannot be deleted, with UI feedback (hidden delete button).
Responsive UI: Built with Shadcn UI components for a polished, accessible experience.

Tech Stack

Frontend:
Next.js 14 (React, TypeScript)
Shadcn UI (Card, Tabs, Badge, Toast, Skeleton)
Tailwind CSS


Backend:
Flask (Python)
SQLite (persistent storage)


API: RESTful endpoints for user, skill, request, and transaction management.
Tools: npm, Python, curl (for testing).

Prerequisites

Node.js: v18 or higher
npm: v9 or higher
Python: 3.8 or higher
pip: Python package manager
Git: For cloning the repository
SQLite: Included with Python, no separate installation needed

Installation

Clone the Repository:
git clone https://github.com/dhnushshetty/skillExchange.git
cd skillExchange


Set Up Frontend:
cd frontend
npm install


Set Up Backend:
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-cors


Initialize Database:

The backend uses SQLite (skill_exchange.db).
Run app.py to create the database and tables automatically (see Running the Project).
Alternatively, use the provided schema (see Database Schema) to initialize manually.



Running the Project

Start the Backend:
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py


Runs on http://localhost:5000.
Creates skill_exchange.db if it doesn’t exist.


Start the Frontend:
cd frontend
npm run dev


Runs on http://localhost:3000.
Ensure the backend is running, as the frontend makes API calls to http://localhost:5000.


Access the App:

Open http://localhost:3000 in your browser.
Register a new user or log in with existing credentials.



Usage

Register:

Navigate to /register.
Enter name, email, phone, location, bio, and password.
Redirects to the dashboard (/dashboard).


Dashboard:

Profile: View name, location, skill count, and join date.
Skills: Add skills (via /create-skill) or delete them (red "X" button, hidden for skills with requests).
Requests: View sent/received requests in tabs; accept/complete received requests.


Skill Requests:

Browse skills at /skills.
Create a request for a skill (via /create-request).
Manage requests at /requests.


Testing APIs:

Use curl or Postman to test endpoints (see API Endpoints).
Example:curl -X POST -H "Content-Type: application/json" -d '{"email": "user@example.com", "password": "pass123"}' http://localhost:5000/login





Database Schema
The SQLite database (skill_exchange.db) includes the following tables:

User:
CREATE TABLE User (
    UserId INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Phone TEXT,
    Location TEXT,
    Bio TEXT,
    Password TEXT NOT NULL,
    DateJoining TEXT NOT NULL
);


Skill:
CREATE TABLE Skill (
    SkillId INTEGER PRIMARY KEY AUTOINCREMENT,
    SkillName TEXT NOT NULL,
    Description TEXT,
    Category TEXT,
    UserId INTEGER,
    FOREIGN KEY (UserId) REFERENCES User(UserId)
);


Request:
CREATE TABLE Request (
    RequestId INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER,
    SkillId INTEGER,
    TimeStamp TEXT NOT NULL,
    Status TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES User(UserId),
    FOREIGN KEY (SkillId) REFERENCES Skill(SkillId)
);


Transaction (for completed requests):
CREATE TABLE Transaction (
    TransactionId INTEGER PRIMARY KEY AUTOINCREMENT,
    RequestId INTEGER,
    CompletionDate TEXT,
    Status TEXT,
    FOREIGN KEY (RequestId) REFERENCES Request(RequestId)
);


Review (optional, for feedback):
CREATE TABLE Review (
    ReviewId INTEGER PRIMARY KEY AUTOINCREMENT,
    TransactionId INTEGER,
    Rating INTEGER,
    Comments TEXT,
    FOREIGN KEY (TransactionId) REFERENCES Transaction(TransactionId)
);



To inspect the database:
sqlite3 backend/skill_exchange.db
sqlite> .tables
sqlite> SELECT * FROM Skill;

API Endpoints
User

POST /register: Register a user.
Body: { "name", "email", "phone", "location", "bio", "password" }
Response: { "userId": number }


POST /login: Log in a user.
Body: { "email", "password" }
Response: { "userId": number }


GET /user/: Get user profile.
Response: { "userId", "name", "email", "phone", "location", "bio", "dateJoining" }


PUT /user/: Update user profile.
Body: { "name"?, "email"?, "phone"?, "location"?, "bio"? }



Skill

POST /create-skill: Add a skill.
Body: { "skillName", "description", "category", "userId" }


GET /skills?userId=&ownSkills=true: Get user’s skills.
Response: [{ "SkillId", "SkillName", "Description", "Category", "UserId" }, ...]


GET /skills: Get all skills (optional userId filter).
Response: [{ "SkillId", "SkillName", "Description", "Category", "UserId", "userName" }, ...]


DELETE /skill/: Delete a skill (fails if requests exist).
Body: { "userId" }
Response: { "success": boolean, "message": string }



Request

POST /create-request: Create a skill request.
Body: { "userId", "skillId" }


GET /requests?userId=: Get sent requests.
Response: [{ "RequestId", "UserId", "userName", "SkillId", "SkillName", "TimeStamp", "Status" }, ...]


GET /received-requests?userId=: Get received requests.
Response: [{ "RequestId", "UserId", "userName", "SkillId", "SkillName", "TimeStamp", "Status" }, ...]


POST /update-request: Update request status.
Body: { "requestId", "status" }
Response: { "success": boolean, "message": string }


POST /complete-request: Complete a request.
Body: { "requestId" }
Response: { "success": boolean, "message": string }



Transaction

GET /transactions/: Get user transactions.
Response: [{ "TransactionId", "RequestId", "SkillName", "CompletionDate", "Status", "Rating"?, "Comments"? }, ...]



Review

POST /submit-review: Submit a review.
Body: { "transactionId", "rating", "comments" }



Contributing

Fork the repository.
Create a branch: git checkout -b feature/your-feature.
Commit changes: git commit -m "Add your feature".
Push to the branch: git push origin feature/your-feature.
Open a pull request.

Please follow the code style (Prettier for frontend, PEP 8 for backend) and include tests for new features.
License
This project is licensed under the MIT License. See the LICENSE file for details.

Developed by: Dhnush Shetty GitHub: https://github.com/dhnushshettyDate: May 2025
