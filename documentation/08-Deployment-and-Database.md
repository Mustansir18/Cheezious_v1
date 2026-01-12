
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

## 2. Connecting to a SQL Database

The application is architecturally prepared to use a real SQL database. This section outlines the final implementation steps.

### 2.1. Configure Your Database Connection

-   **Update Environment Variables:** Open the `.env` file in the project root. Fill in the `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, and `DB_DATABASE` placeholders with your actual SQL Server credentials.
-   **Review Connection Logic:** A database connection file has been created at `src/lib/db.ts`. It uses the `mssql` package and is configured to read the variables from your `.env` file. If you are using a different database (like PostgreSQL or MySQL), you will need to install its driver (`npm install pg` or `npm install mysql2`) and update this file accordingly.
-   **Test Connection**: Run the application and navigate to the `/api/db-test` route in your browser to verify that the connection credentials are correct.

### 2.2. Implement Database Queries in API Routes

For each API route in `src/app/api/`, you must replace the placeholder data with a real database query.

**Example: Replacing Placeholder Data in `src/app/api/users/route.ts`**

This example shows how to use the connection pool from `src/lib/db.ts` to fetch users from your SQL Server database.

```typescript
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getConnectionPool, sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT * FROM Users');
    
    // The API should return an object with a key, e.g., { users: ... }
    return NextResponse.json({ users: result.recordset });

  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    // Return a 500 Internal Server Error response
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}
```

### 2.3. Apply This Pattern to All API Routes

You must apply this same pattern to all files in the `src/app/api/` directory, replacing the placeholder arrays with the appropriate `SELECT`, `INSERT`, `UPDATE`, or `DELETE` queries for your database.

-   `/api/menu/route.ts`: `SELECT * FROM MenuItems`, `SELECT * FROM MenuCategories`, etc.
-   `/api/orders/route.ts`:
    -   `GET`: `SELECT * FROM Orders WHERE OrderDate > ...`
    -   `POST`: `INSERT INTO Orders (...) VALUES (...)`
    -   `PUT`: `UPDATE Orders SET Status = @Status WHERE id = @id`
-   `/api/settings/route.ts`: Fetch data from your `Branches`, `Floors`, `Tables`, `PaymentMethods` tables.

## 3. Database Schema (SQL)

Below is an idempotent migration script for setting up your database in SQL Server. This script can be run safely multiple times; it will only create tables and columns that are missing.

```sql
-- idempotent migration for deployment: creates missing tables and columns used by the app
-- Run this file on the target DB to ensure required tables/columns exist

-- Ensure we're on the target DB
USE [CheeziousKiosk];
GO

-- Sessions table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Sessions (
    Id NVARCHAR(50) PRIMARY KEY,
    UserId NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ExpiresAt DATETIME2 NULL
  );
END
GO

-- Carts table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carts]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Carts (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    SessionId NVARCHAR(50) NOT NULL,
    BranchId NVARCHAR(50) NULL,
    OrderType NVARCHAR(50) NULL,
    FloorId NVARCHAR(50) NULL,
    TableId NVARCHAR(50) NULL,
    DeliveryMode NVARCHAR(50) NULL,
    CustomerName NVARCHAR(200) NULL,
    CustomerPhone NVARCHAR(50) NULL,
    CustomerAddress NVARCHAR(500) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Carts_SessionId ON dbo.Carts(SessionId);
END
GO

-- CartItems table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CartItems]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.CartItems (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    CartId UNIQUEIDENTIFIER NOT NULL,
    MenuItemId NVARCHAR(50),
    Quantity INT NOT NULL DEFAULT 1,
    Price DECIMAL(10,2) NULL,
    BasePrice DECIMAL(10,2) NULL,
    Name NVARCHAR(500) NULL,
    SelectedAddons NVARCHAR(MAX) NULL,
    SelectedVariant NVARCHAR(MAX) NULL,
    StationId NVARCHAR(50) NULL,
    IsPrepared BIT DEFAULT 0,
    IsDealComponent BIT DEFAULT 0,
    ParentDealCartItemId UNIQUEIDENTIFIER NULL,
    Instructions NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_CartItems_CartId ON dbo.CartItems(CartId);
END
GO

-- ActivityLog table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ActivityLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.ActivityLog (
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    [user] NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(50) NOT NULL
  );
END
GO

-- CashierLog table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CashierLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.CashierLog (
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    type NVARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    cashierId NVARCHAR(50) NOT NULL,
    cashierName NVARCHAR(100) NOT NULL,
    adminId NVARCHAR(50) NOT NULL,
    adminName NVARCHAR(100) NOT NULL,
    notes NVARCHAR(500)
  );
END
GO

-- Ensure Orders has required columns (non-destructive)
IF COL_LENGTH('dbo.Orders', 'customerAddress') IS NULL
BEGIN
  ALTER TABLE dbo.Orders ADD customerAddress NVARCHAR(500) NULL;
END
GO

PRINT 'Initial deployment migrations complete.';
GO
```
