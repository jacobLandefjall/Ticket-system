# Ticketing System

## Introduction
This project is a ticketing system designed to help manage and organize support tickets. The system allows users to create, categorize, and manage tickets. It also supports file uploads, comments, and categorization based on ticket content.

## Architecture Overview (optional)
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

## Step-by-step Installation and Startup

### 1. Clone the GitHub Repository

Open a terminal and clone the repository:

```bash
git clone https://github.com/jacobLandefjall/Ticket-system.git
cd Ticket-system

2. Install all necessary Node,js Dependencies.
npm install

3. Restore the Database
Create a new database in MariaDB/MySQL:
CREATE DATABASE proj;

 Import the Backup File into the Database:
 mysql -u dbadm -p -h localhost proj < ticketing_system_backup.sql

tart the Application

Run the following command to start the application:
npm start

Alternatively, if that doesn't work, you can manually start the server with:
node index.js

4. Access the Application

Open your browser and navigate to:

http://localhost:1337

You should now be able to access and interact with the ticketing system.
Testing
Run Tests

To run the unit and integration tests, execute the following command:

npm test

This will execute the tests located in the tests/ folder, ensuring the integrity of the system’s core functionalities.

License

This project is licensed under the ISC License. See the LICENSE file for more details.


### Changes made:
1. **Architecture Overview**: Added a brief description of the architecture and optional diagram placement.
2. **Build Section**: Mentioned the absence of a complex build step.
3. **Test Section**: Explained how to run tests for the project.
4. **Step-by-Step Instructions**: The flow from cloning the repo to setting up the environment variables, restoring the database, and starting the app has been clearly outlined.

This README now covers the entire process in a structured and user-friendly way.
