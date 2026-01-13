# Deployment and Database Integration Guide

This document provides instructions for deploying the Cheezious Connect application to a production server (Windows or Linux) and outlines the necessary steps to transition from browser-based storage to a real SQL database backend.

## 1. Deployment to a Server

The application is a standard Next.js project and can be deployed to any environment that supports Node.js.

### 1.1. Windows Server Deployment

For a detailed, step-by-step guide on deploying to a Windows Server, please refer to the `DEPLOYMENT_MANUAL.md` file located in the root of this project.

The manual covers:
-   **Prerequisites:** Installing Node.js, IIS (with URL Rewrite and ARR modules), and the PM2 process manager.
-   **Application Setup:** Building the app for production (`npm run build`).
-   **Running with PM2:** Using PM2 to run the application as a background service and ensure it restarts on server reboots.
-   **IIS as a Reverse Proxy:** Configuring IIS to serve the Next.js application to the web.

### 1.2. Linux Server Deployment (High-Level Guide)

Deploying on a Linux server (like Ubuntu or CentOS) follows a similar pattern, typically using Nginx as the reverse proxy.

1.  **Prerequisites:**
    -   Install `Node.js` (latest LTS version) and `npm`.
    -   Install `Nginx` (`sudo apt-get install nginx`).
    -   Install `PM2` globally (`npm install pm2 -g`).

2.  **Application Setup:**
    -   Copy the application files to a directory (e.g., `/var/www/cheezious-connect`).
    -   Install dependencies: `npm install`.
    -   Build the app: `npm run build`.

3.  **Run with PM2:**
    -   Start the app on a specific port: `pm2 start npm --name "cheezious-connect" -- start -p 9002`.
    -   Ensure it starts on reboot: `pm2 startup` and `pm2 save`.

4.  **Configure Nginx:**
    -   Create a new Nginx configuration file in `/etc/nginx/sites-available/cheezious-connect`.
    -   Configure it to act as a reverse proxy, forwarding requests to the port PM2 is using (e.g., `http://localhost:9002`).

    ```nginx
    server {
        listen 80;
        server_name your_domain.com;

        location / {
            proxy_pass http://localhost:9002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    -   Enable the site: `sudo ln -s /etc/nginx/sites-available/cheezious-connect /etc/nginx/sites-enabled/` and restart Nginx.

## 2. Setting Up the SQL Database

The application is now fully integrated with a SQL Server database. Follow these steps to set it up.

### 2.1. Configure Database Connection

-   **Update Environment Variables:** Open the `.env` file in the project root. Fill in the `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE`, and `DB_PORT` placeholders with your actual SQL Server credentials.
-   **Test Connection**: Run the application (`npm run dev`) and navigate to `http://localhost:3000/api/db-test` in your browser. You should see a success message. If not, double-check your credentials in the `.env` file.

### 2.2. Create Database Schema

-   **Run the Migration Script**: The simplest way to create all the necessary tables is to use the built-in data migration tool.
    1.  Run the application (`npm run dev`).
    2.  Navigate to `http://localhost:3000/admin/migrate-data`.
    3.  Click the "Start Migration" button. This will execute the SQL commands from `src/db/schema.ts` to create and configure all required tables in your database.
    
-   **Manual Schema Creation**: Alternatively, you can manually run the SQL script. The complete, idempotent migration script for setting up your database in SQL Server can be found in the file `src/db/schema.ts`. Copy its contents and run it against your target database using a tool like SQL Server Management Studio.

### 2.3. Data Persistence

Once the database is set up, all data management (for users, orders, settings, menu items, etc.) is handled automatically through API routes. The application no longer relies on `localStorage` for primary data storage, ensuring that all data is centralized and consistent across all devices.
