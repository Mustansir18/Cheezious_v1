
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

## 2. Transitioning to a SQL Database

The current application uses the browser's `localStorage` and `sessionStorage` for data persistence. This is for demonstration purposes only. For a real production environment where data must be centralized and shared, you must connect the application to a database.

### 2.1. The Strategy: API-Driven Data

The fundamental change is to **stop reading from and writing to `localStorage`** within the React Context providers (`src/context/*.tsx`). Instead, these providers must be modified to fetch data from and send data to a backend API that you will build. This API will be the only part of your system that communicates directly with your SQL database.

**Data Flow:**
`React Component` -> `Context Hook (e.g., useOrders)` -> `API Route (e.g., /api/orders)` -> `Database (e.g., SQL Server)`

### 2.2. Step-by-Step Code Adaptation Plan

#### Step 1: Set Up Your Database and API
-   **Create Database Tables:** Set up a SQL database (e.g., SQL Server, PostgreSQL, MySQL) with tables that match the schemas defined in `src/db/schema.ts`.
-   **Build Backend API Endpoints:** Create API Routes within Next.js in the `src/app/api/` directory. These will contain your database queries.
    -   `GET /api/orders`: Fetch all orders.
    -   `POST /api/orders`: Create a new order.
    -   `PUT /api/orders/:id`: Update an order's status.
    -   `GET /api/menu`: Fetch all menu items and categories.
    -   `GET /api/settings`: Fetch all restaurant settings.
    -   ...and so on for all data types.
-   **Status:** The first placeholder API endpoint has been created at `src/app/api/users/route.ts`. Your next task is to replace the placeholder data in that file with a real database query to your SQL server.

#### Step 2: Modify the React Contexts
You will need to go through each file in `src/context/` and replace the `localStorage` logic with API calls using `fetch`.

**Example: Modifying `OrderContext.tsx`**

**BEFORE (Current State):**
```typescript
// src/context/OrderContext.tsx

// Reads from sessionStorage on mount
useEffect(() => {
    const storedOrders = sessionStorage.getItem('cheeziousOrders');
    if (storedOrders) setOrders(JSON.parse(storedOrders));
    setIsLoading(false);
}, []);

// Writes to sessionStorage on every change
useEffect(() => {
    sessionStorage.setItem('cheeziousOrders', JSON.stringify(orders));
}, [orders]);

const addOrder = (order) => {
    setOrders(prev => [...prev, order]); // Just adds to local state
};
```

**AFTER (With API Integration):**
```typescript
// src/context/OrderContext.tsx

// Fetches from the database via your API on mount
useEffect(() => {
    fetch('/api/orders')
        .then(res => res.json())
        .then(data => setOrders(data.orders))
        .catch(err => console.error("Failed to fetch orders", err))
        .finally(() => setIsLoading(false));
}, []);

// No longer needs to write to sessionStorage.

const addOrder = async (order) => {
    // 1. Send the new order to the API
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    const newOrder = await response.json();

    // 2. Add the confirmed order from the API to the local state
    setOrders(prev => [...prev, newOrder]);
};
```

#### Step 3: Apply This Pattern to All Contexts

This same pattern must be applied to all contexts that manage data:
-   `AuthContext.tsx`: Fetch users from the `/api/users` endpoint. The `login` function should send credentials to an `/api/login` endpoint for verification against the database.
-   `MenuContext.tsx`: Fetch items, categories, and addons from `/api/menu`.
-   `SettingsContext.tsx`: Fetch branches, floors, tables, etc., from `/api/settings`.
-   ...and so on for `DealsContext`, `RatingContext`, etc.

By completing this transition, your application will be a true full-stack, production-ready system running on your own server infrastructure.
