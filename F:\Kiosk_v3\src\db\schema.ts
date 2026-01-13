
-- idempotent migration for deployment: creates missing tables and columns used by the app
-- Run this file on the target DB to ensure required tables/columns exist

-- Query_0: Ensure we're on the target DB
USE [CheeziousKiosk];
GO

-- Query_1: Branches table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Branches]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Branches (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    orderPrefix NVARCHAR(10) NOT NULL,
    dineInEnabled BIT NOT NULL DEFAULT 1,
    takeAwayEnabled BIT NOT NULL DEFAULT 1,
    deliveryEnabled BIT NOT NULL DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
  );
END
GO

-- Query_2: Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Users (
    id NVARCHAR(255) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    branchId NVARCHAR(255),
    balance DECIMAL(18, 2) DEFAULT 0,
    stationName NVARCHAR(100),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE SET NULL
  );
END
GO

-- Query_3: Sessions table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Sessions (
    Id NVARCHAR(50) PRIMARY KEY,
    UserId NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ExpiresAt DATETIME2 NULL,
    FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL
  );
END
GO

-- Query_4: Carts table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carts]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Carts (
    Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    SessionId NVARCHAR(50) NOT NULL,
    UserId NVARCHAR(255) NULL, -- This will now be correctly indexed
    BranchId NVARCHAR(50) NULL,
    OrderType NVARCHAR(50) NULL,
    FloorId NVARCHAR(50) NULL,
    TableId NVARCHAR(50) NULL,
    DeliveryMode NVARCHAR(50) NULL,
    CustomerName NVARCHAR(200) NULL,
    CustomerPhone NVARCHAR(50) NULL,
    CustomerAddress NVARCHAR(500) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE SET NULL
  );
END
GO

-- Drop old conflicting indexes if they exist
IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_Carts_SessionId' AND object_id = OBJECT_ID('dbo.Carts'))
BEGIN
    DROP INDEX IX_Carts_SessionId ON dbo.Carts;
END
GO
IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_Carts_UserId' AND object_id = OBJECT_ID('dbo.Carts'))
BEGIN
    DROP INDEX IX_Carts_UserId ON dbo.Carts;
END
GO

-- Create correct filtered unique indexes
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UQ_Carts_SessionId_Guest' AND object_id = OBJECT_ID('dbo.Carts'))
BEGIN
    CREATE UNIQUE INDEX UQ_Carts_SessionId_Guest ON dbo.Carts(SessionId) WHERE UserId IS NULL;
END
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UQ_Carts_UserId_User' AND object_id = OBJECT_ID('dbo.Carts'))
BEGIN
    CREATE UNIQUE INDEX UQ_Carts_UserId_User ON dbo.Carts(UserId) WHERE UserId IS NOT NULL;
END
GO


-- Query_5: CartItems table
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
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (CartId) REFERENCES Carts(Id) ON DELETE CASCADE
  );
END
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_CartItems_CartId')
BEGIN
    CREATE INDEX IX_CartItems_CartId ON dbo.CartItems(CartId);
END
GO


-- Query_6: Floors and Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Floors]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Floors ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(255) NOT NULL );
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tables]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Tables (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    floorId NVARCHAR(255),
    FOREIGN KEY (floorId) REFERENCES Floors(id) ON DELETE SET NULL
  );
END
GO

-- Query_7: Payment and Delivery Modes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PaymentMethods]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.PaymentMethods ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(255) NOT NULL, taxRate DECIMAL(5, 2) NOT NULL DEFAULT 0.00 );
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryModes]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.DeliveryModes ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(255) NOT NULL );
END
GO

-- Query_8: Menu Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MenuCategories]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.MenuCategories ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(255) NOT NULL, icon NVARCHAR(255), stationId NVARCHAR(50) );
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SubCategories]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.SubCategories ( id NVARCHAR(255) PRIMARY KEY, categoryId NVARCHAR(255) NOT NULL, name NVARCHAR(255) NOT NULL, FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE CASCADE );
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Addons]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Addons ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(255) NOT NULL, price DECIMAL(10, 2), prices NVARCHAR(MAX), type NVARCHAR(50) DEFAULT 'standard' );
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MenuItems]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.MenuItems ( id NVARCHAR(255) PRIMARY KEY, name NVARCHAR(MAX) NOT NULL, description NVARCHAR(MAX), price DECIMAL(10, 2) NOT NULL, categoryId NVARCHAR(255), subCategoryId NVARCHAR(255), imageUrl NVARCHAR(MAX), availableAddonIds NVARCHAR(MAX), variants NVARCHAR(MAX), dealItems NVARCHAR(MAX), FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE SET NULL );
END
GO

-- Query_9: Order Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Orders (
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
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OrderItems]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.OrderItems (
    id NVARCHAR(255) PRIMARY KEY,
    orderId NVARCHAR(255) NOT NULL,
    menuItemId NVARCHAR(255),
    name NVARCHAR(MAX),
    quantity INT,
    itemPrice DECIMAL(18, 2),
    baseItemPrice DECIMAL(18, 2),
    selectedAddons NVARCHAR(MAX),
    selectedVariant NVARCHAR(MAX),
    stationId NVARCHAR(50),
    isPrepared BIT DEFAULT 0,
    preparedAt DATETIME,
    isDispatched BIT DEFAULT 0,
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(255),
    instructions NVARCHAR(MAX),
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
  );
END
GO

-- Query_10: Log Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ActivityLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.ActivityLog ( id NVARCHAR(50) PRIMARY KEY, timestamp DATETIME NOT NULL, [user] NVARCHAR(100) NOT NULL, message NVARCHAR(MAX) NOT NULL, category NVARCHAR(50) NOT NULL );
END
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_ActivityLog_Timestamp')
BEGIN
    CREATE INDEX IDX_ActivityLog_Timestamp ON ActivityLog([timestamp] DESC);
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CashierLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.CashierLog ( id NVARCHAR(50) PRIMARY KEY, timestamp DATETIME NOT NULL, type NVARCHAR(50) NOT NULL, amount DECIMAL(18,2) NOT NULL, cashierId NVARCHAR(255) NOT NULL, cashierName NVARCHAR(255), adminId NVARCHAR(255) NOT NULL, adminName NVARCHAR(255), notes NVARCHAR(MAX) );
END
GO

-- Query_11: Ratings Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Ratings]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.Ratings (
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    rating INT NOT NULL,
    comment NVARCHAR(MAX)
  );
END
GO

PRINT 'Initial deployment migrations complete.';
GO
