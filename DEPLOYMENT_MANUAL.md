# Cheezious Connect: Deployment Manual for Windows Server

This document provides a comprehensive guide for deploying the Cheezious Connect Next.js application on a Windows Server machine for integration with Microsoft Dynamics 365.

## 1. Prerequisites

Before you begin, ensure your Windows Server (2019, 2022, or newer recommended) has the following software installed:

### 1.1. Node.js and npm
The application is built on Node.js.
- **Download:** Get the latest LTS version from the [official Node.js website](https://nodejs.org/).
- **Installation:** Run the installer and follow the on-screen instructions. The installer includes `npm` (Node Package Manager).
- **Verification:** Open PowerShell or Command Prompt and run the following commands to ensure installation was successful:
  ```powershell
  node -v
  npm -v
  ```

### 1.2. IIS (Internet Information Services)
IIS will act as a reverse proxy, directing incoming web traffic to the running Node.js application.
- **Installation:**
  1. Open **Server Manager**.
  2. Go to **Manage** > **Add Roles and Features**.
  3. Select "Role-based or feature-based installation".
  4. Select your server.
  5. Under "Server Roles", check **Web Server (IIS)**.
  6. Proceed with the default features and complete the installation.

### 1.3. IIS Modules: URL Rewrite and ARR
These modules are essential for IIS to function as a reverse proxy.
- **URL Rewrite:** Allows IIS to modify request URLs. Download and install it from [here](https://www.iis.net/downloads/microsoft/url-rewrite).
- **Application Request Routing (ARR):** Enables request forwarding. Download and install it from [here](https://www.iis.net/downloads/microsoft/application-request-routing). After installation, open IIS Manager, click your server name, find "Application Request Routing Cache," open it, and under "Actions" on the right, click **Server Proxy Settings...** and check **Enable proxy**.

### 1.4. PM2 (Process Manager)
PM2 is a production process manager for Node.js applications. It will keep your application running continuously and restart it if it crashes.
- **Installation:** Open PowerShell or Command Prompt and install it globally:
  ```powershell
  npm install pm2 -g
  ```

## 2. Deployment Steps

Follow these steps to deploy the application on your server.

### Step 2.1: Prepare the Application
1. **Copy Files:** Transfer the entire application folder to a directory on your server (e.g., `C:\inetpub\wwwroot\cheezious-connect`).
2. **Install Dependencies:** Navigate to the application directory in PowerShell or Command Prompt and run:
   ```powershell
   npm install
   ```
3. **Configure Environment Variables:**
   - Create a new file named `.env.production.local` in the root of the application folder.
   - Open the file and add the following line, replacing the URL with your actual Dynamics 365 Retail Server endpoint for creating customer orders:
     ```
     DYNAMICS_RSSU_API_ENDPOINT=https://your-d365-environment.dynamics.com/Commerce/customerorders
     ```
   - **Important:** Ensure this endpoint is correct and accessible from your server. This is the URL the application will `POST` new order data to.

4. **Build the Application:** Run the production build command. This compiles the application into an optimized set of files.
   ```powershell
   npm run build
   ```

### Step 2.2: Run the Application with PM2
1. **Start the App:** In the application directory, start the Next.js application using PM2. This command will start the app, name it `cheezious-connect`, and listen on port `9002`.
   ```powershell
   pm2 start npm --name "cheezious-connect" -- start -p 9002
   ```
2. **Verify App is Running:** Check the status of your app:
   ```powershell
   pm2 list
   ```
   You should see `cheezious-connect` with a status of `online`.

3. **Enable Startup on Reboot:** To ensure the app restarts automatically if the server reboots, run:
   ```powershell
   pm2 startup
   pm2 save
   ```
   This will generate a command you need to run to register PM2 as a startup service.

### Step 2.3: Configure IIS as a Reverse Proxy
1. **Create a New Website:**
   - Open IIS Manager.
   - In the "Connections" pane, right-click on "Sites" and select "Add Website".
   - **Site name:** `Cheezious Connect`
   - **Physical path:** Point this to your application folder (e.g., `C:\inetpub\wwwroot\cheezious-connect`).
   - **Binding:** Set the hostname (e.g., `cheezious.yourdomain.com`) and choose port `80` (or `443` if you have an SSL certificate configured).
   - Click "OK".

2. **Create the Rewrite Rule:**
   - Select your newly created site in IIS Manager.
   - In the main panel, double-click **URL Rewrite**.
   - In the "Actions" pane on the right, click **Add Rule(s)...** and select **Reverse Proxy**. Click "OK". (If you get a warning about enabling the proxy, click "OK".)
   - In the "Inbound Rules" server field, enter the address where your Next.js app is running: `localhost:9002`.
   - Click "OK".

Your `web.config` file in the application's root directory should now contain a rule similar to this:
```xml
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:9002/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

## 3. Real-time Order Sync with Dynamics 365

The application is configured to send order data to the endpoint specified in your `DYNAMICS_RSSU_API_ENDPOINT` environment variable.

- **Data Flow:** When a customer places an order, the `syncOrderToExternalSystem` function in `src/ai/flows/sync-order-flow.ts` is triggered.
- **Payload:** It sends a `POST` request with a JSON body containing the complete order details (`SyncOrderInput` type from `src/lib/types.ts`).
- **Authentication:** The current flow does **not** include authentication. For a production Dynamics 365 environment, you must implement an OAuth 2.0 client credentials flow to acquire a bearer token from Azure Active Directory. This token must then be included in the `Authorization` header of the request. The code contains a commented-out placeholder for this logic.

## 4. Final Verification

- Open a web browser and navigate to the hostname you configured in IIS (e.g., `http://cheezious.yourdomain.com`).
- The Cheezious Connect homepage should load.
- Place a test order and monitor the `pm2` logs to confirm the order is being sent to your Dynamics 365 endpoint. You can view logs with:
  ```powershell
  pm2 logs cheezious-connect
  ```

Your deployment is now complete. The application will run as a service on your Windows Server, proxied through IIS, and will send order data to your Dynamics 365 instance.
