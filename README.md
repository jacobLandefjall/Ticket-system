# Ticketing System

## Introduction
This project is a ticketing system for managing support tickets. The system allows users to create, manage, and categorize tickets. It supports file uploads, comments, and ticket categorization based on content.

## Prerequisites
To get started with this project, you need the following installed on your machine:
- **Node.js** (version 14.x or later)
- **npm** (Node Package Manager, typically included with Node.js)
- **MariaDB/MySQL** (for database management)

## Step-by-step Installation and Startup

### 1. Clone the GitHub Repository

To download the project from the GitHub repository, open a terminal and run the following commands:

```bash
git clone https://github.com/jacobLandefjall/Ticket-system.git
cd Ticket-system

2.Install Dependencies

Once you have cloned the repository and navigated into the project directory, run the following command to install all necessary Node.js dependencies: npm install

3.Restore the Database
3.1 Create a New Database in MariaDB/MySQL

To test the application with the provided database, first create a new database in MariaDB or MySQL: CREATE DATABASE proj;

3.2Import the Backup File into the Database

Navigate to the project directory where the backup file is located and run the following command to restore the database:



mysql -u dbadm -p -h localhost proj < ticketing_system_backup.sql

Start the Application

To start the application, run the following command in the terminal:

4. Start the Application

npm start

If npm start doesn't work, you can try: node index.js

5.Access the Application

Open your web browser and go to: http://localhost:1337













This README file will now guide new users on how to clone your repo, install dependencies, restore the database backup, and run the application successfully.
