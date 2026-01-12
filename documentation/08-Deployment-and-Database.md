

# Deployment and Database Integration Guide

This document provides instructions for deploying the Cheezious Connect application to a production server (Windows or Linux) and outlines the necessary steps to transition from browser-based storage to a real SQL database backend.

## 1. Deployment to a Server

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

Below are the complete `CREATE TABLE` queries for setting up your database in SQL Server. The tables are ordered to ensure that foreign key constraints are met.

```sql
-- Create Branches table first as Users depends on it
CREATE TABLE Branches (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    orderPrefix NVARCHAR(10) NOT NULL,
    dineInEnabled BIT NOT NULL DEFAULT 1,
    takeAwayEnabled BIT NOT NULL DEFAULT 1,
    deliveryEnabled BIT NOT NULL DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- Users table with a foreign key to Branches
CREATE TABLE Users (
    id NVARCHAR(255) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    branchId NVARCHAR(255),
    balance DECIMAL(18, 2) DEFAULT 0,
    stationName NVARCHAR(100),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

-- Create simple lookup tables
CREATE TABLE Floors (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL
);

CREATE TABLE Tables (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    floorId NVARCHAR(255),
    FOREIGN KEY (floorId) REFERENCES Floors(id) ON DELETE SET NULL
);

CREATE TABLE PaymentMethods (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    taxRate DECIMAL(5, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE DeliveryModes (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL
);

-- Menu-related tables
CREATE TABLE MenuCategories (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    icon NVARCHAR(255),
    stationId NVARCHAR(50)
);

CREATE TABLE SubCategories (
    id NVARCHAR(255) PRIMARY KEY,
    categoryId NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE CASCADE
);

CREATE TABLE Addons (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),
    prices NVARCHAR(MAX), -- For JSON object
    type NVARCHAR(50) DEFAULT 'standard'
);

CREATE TABLE MenuItems (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL,
    categoryId NVARCHAR(255),
    subCategoryId NVARCHAR(255),
    imageUrl NVARCHAR(MAX),
    availableAddonIds NVARCHAR(MAX), -- For JSON array of strings
    variants NVARCHAR(MAX), -- For JSON array of objects
    dealItems NVARCHAR(MAX), -- For JSON array of objects
    FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE SET NULL
);

-- Carts and CartItems tables for persistent shopping carts
CREATE TABLE Carts (
    id NVARCHAR(255) PRIMARY KEY,
    sessionId NVARCHAR(255) UNIQUE NOT NULL, -- Corresponds to browser session
    userId NVARCHAR(255), -- Nullable, for guest carts
    branchId NVARCHAR(255),
    orderType NVARCHAR(50),
    tableId NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (branchId) REFERENCES Branches(id)
);

CREATE TABLE CartItems (
    id NVARCHAR(255) PRIMARY KEY,
    cartId NVARCHAR(255) NOT NULL,
    menuItemId NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    selectedAddons NVARCHAR(MAX), -- Stored as JSON string
    selectedVariantName NVARCHAR(255),
    instructions NVARCHAR(MAX),
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(255),
    FOREIGN KEY (cartId) REFERENCES Carts(id) ON DELETE CASCADE
);


-- Orders and OrderItems tables
CREATE TABLE Orders (
    id NVARCHAR(255) PRIMARY KEY,
    orderNumber NVARCHAR(255) UNIQUE NOT NULL,
    branchId NVARCHAR(255),
    orderDate DATETIME NOT NULL,
    completionDate DATETIME,
    orderType NVARCHAR(50),
    status NVARCHAR(50),
    totalAmount DECIMAL(18, 2),
    subtotal DECIMAL(18, 2),
    taxRate DECIMAL(18, 2),
    taxAmount DECIMAL(18, 2),
    paymentMethod NVARCHAR(255),
    instructions NVARCHAR(MAX),
    placedBy NVARCHAR(255),
    completedBy NVARCHAR(255),
    floorId NVARCHAR(255),
    tableId NVARCHAR(255),
    deliveryMode NVARCHAR(255),
    customerName NVARCHAR(255),
    customerPhone NVARCHAR(50),
    customerAddress NVARCHAR(MAX),
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(255),
    discountType NVARCHAR(50),
    discountValue DECIMAL(18, 2),
    discountAmount DECIMAL(18, 2),
    originalTotalAmount DECIMAL(18, 2),
    cancellationReason NVARCHAR(MAX),
    FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE SET NULL
);

CREATE TABLE OrderItems (
    id NVARCHAR(255) PRIMARY KEY,
    orderId NVARCHAR(255) NOT NULL,
    menuItemId NVARCHAR(255),
    name NVARCHAR(MAX),
    quantity INT,
    itemPrice DECIMAL(18, 2),
    baseItemPrice DECIMAL(18, 2),
    selectedAddons NVARCHAR(MAX), -- Stored as JSON string
    selectedVariantName NVARCHAR(255),
    stationId NVARCHAR(50),
    isPrepared BIT DEFAULT 0,
    preparedAt DATETIME,
    isDispatched BIT DEFAULT 0,
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(255),
    instructions NVARCHAR(MAX),
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Log tables
CREATE TABLE ActivityLog (
    id NVARCHAR(255) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    [user] NVARCHAR(255),
    message NVARCHAR(MAX),
    category NVARCHAR(50)
);

CREATE TABLE CashierLog (
    id NVARCHAR(255) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    type NVARCHAR(50) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    cashierId NVARCHAR(255) NOT NULL,
    cashierName NVARCHAR(255),
    adminId NVARCHAR(255) NOT NULL,
    adminName NVARCHAR(255),
    notes NVARCHAR(MAX)
);

-- === INDEXES (for performance) ===

-- Add an index to ActivityLog to speed up fetching logs sorted by date.
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_ActivityLog_Timestamp')
BEGIN
    CREATE INDEX IDX_ActivityLog_Timestamp ON ActivityLog([timestamp] DESC);
END
GO

-- Add an index to CartItems to speed up fetching items for a specific cart.
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_CartItems_CartId')
BEGIN
    CREATE INDEX IDX_CartItems_CartId ON CartItems(CartId);
END
GO

-- Add an index to Carts to speed up fetching a cart by its session ID.
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_Carts_SessionId')
BEGIN
    CREATE INDEX IDX_Carts_SessionId ON Carts(sessionId);
END
GO
```

By completing this final step, your application will be a true full-stack, production-ready system running on your own server infrastructure.

