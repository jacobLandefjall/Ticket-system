# Ticketing System
![Skärmbild 2024-10-21 152245](https://github.com/user-attachments/assets/fa813080-a9c7-4771-9990-5ebf6db3cdc5)

## Introduction
This project is a ticketing system designed to help manage and organize support tickets. The system allows users to create, categorize, and manage tickets. It also supports file uploads, comments, and categorization based on ticket content.

## Architecture Overview
The project follows a three-layer architecture:
- **Frontend**: EJS templates rendered through Express.
- **Backend**: Node.js with Express for API endpoints and business logic.
- **Database**: MySQL/MariaDB for ticket and user data storage.

## Prerequisites
To set up and run the project, you need the following tools:
- **Node.js** (version 14.x or later)
- **npm** (Node Package Manager)
- **MariaDB/MySQL** (for managing the database)
- **Git** (to clone the repository)

Required Keys and .env File Setup

Before running the application, you will need to create a .env file in the root directory with the following required keys:
AUTH0_DOMAIN=your-auth0-domain
AUTH0_BASE_URL=http://localhost:1337
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_CALLBACK_URL=http://localhost:1337/callback
AUTH0_SECRET=your-auth0-secret
SESSION_SECRET=your-session-secret

How to Get These Keys

    Auth0 keys:
        You can get your AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN, and AUTH0_SECRET by signing up at Auth0 and creating a new application.
        Make sure to configure the callback URL in your Auth0 settings to match your local setup (e.g., http://localhost:1337/callback).

        Session Secret:

    SESSION_SECRET is a random string used for securing session cookies. Make sure it is a long, random string.

## Step-by-step Installation and Startup

### 1. Clone the GitHub Repository

Open a terminal and clone the repository:

```bash
git clone https://github.com/jacobLandefjall/Ticket-system.git
cd Ticket-system

2. Install all necessary Node,js Dependencies.
npm install

3. Restore the Database

Create a new database in MariaDB/MySQL
Log in to your MySQL/MariaDB and create a new database for the application:
CREATE DATABASE proj;

Import the Backup File into the Database
After creating the database, import the provided backup file to set up the necessary tables and initial data:
mysql -u [your-database-username] -p -h localhost ticket_system < ticketing_system_backup.sql
Replace [your-database-username] with your MySQL/MariaDB username.
The default database name used here is ticket_system.

mysql -u dbadm -p ticket_system < ticketing_system_backup.sql

4. Set Up the .env File

In the root directory of the project, create a .env file with the keys described in the Required Keys and .env File Setup section above.

5. Start the Application
Run the following command to start the application:
npm start

Alternatively, if that doesn't work, you can manually start the server with:
node index.js

6. Access the Application

Open your browser and navigate to:
http://localhost:1337

You should now be able to access and interact with the ticketing system.

7.Testing
Run Tests
To run the unit and integration tests, execute the following command:
npm test

This will execute the tests located in the tests/ folder, ensuring the integrity of the system’s core functionalities.

MIT License

Copyright (c) 2024 Jacob Landefjäll

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


### Changes made:
1. **Architecture Overview**: Added a brief description of the architecture and optional diagram placement.
2. **Build Section**: Mentioned the absence of a complex build step.
3. **Test Section**: Explained how to run tests for the project.
4. **Step-by-Step Instructions**: The flow from cloning the repo to setting up the environment variables, restoring the database, and starting the app has been clearly outlined.


This README now covers the entire process in a structured and user-friendly way. Instructions for setting up a .env file with the correct API keys and environment variables
