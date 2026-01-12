-- This script is a corrected and updated schema for the CheeziousKiosk application.
-- It ensures tables are created in the correct order to satisfy foreign key constraints and uses appropriate data types.

-- Drop existing tables in reverse order of creation to avoid foreign key conflicts
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Branches', 'U') IS NOT NULL DROP TABLE dbo.Branches;
IF OBJECT_ID('dbo.MenuCategories', 'U') IS NOT NULL DROP TABLE dbo.MenuCategories;
IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL DROP TABLE dbo.MenuItems;
IF OBJECT_ID('dbo.Deals', 'U') IS NOT NULL DROP TABLE dbo.Deals;
IF OBJECT_ID('dbo.Deal_Items', 'U') IS NOT NULL DROP TABLE dbo.Deal_Items;
IF OBJECT_ID('dbo.Floors', 'U') IS NOT NULL DROP TABLE dbo.Floors;
IF OBJECT_ID('dbo.Tables', 'U') IS NOT NULL DROP TABLE dbo.Tables;
IF OBJECT_ID('dbo.PaymentMethods', 'U') IS NOT NULL DROP TABLE dbo.PaymentMethods;
IF OBJECT_ID('dbo.Addons', 'U') IS NOT NULL DROP TABLE dbo.Addons;
IF OBJECT_ID('dbo.ActivityLog', 'U') IS NOT NULL DROP TABLE dbo.ActivityLog;
IF OBJECT_ID('dbo.CashierLog', 'U') IS NOT NULL DROP TABLE dbo.CashierLog;
GO

-- Create tables in the correct dependency order

CREATE TABLE Branches (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    location NVARCHAR(255),
    dineInEnabled BIT DEFAULT 1,
    takeAwayEnabled BIT DEFAULT 1,
    deliveryEnabled BIT DEFAULT 1,
    orderPrefix NVARCHAR(10)
);

CREATE TABLE Users (
    id NVARCHAR(255) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('root', 'admin', 'cashier', 'marketing', 'kds', 'make-station', 'pasta-station', 'fried-station', 'bar-station', 'cutt-station')),
    branchId NVARCHAR(255) FOREIGN KEY REFERENCES Branches(id),
    balance DECIMAL(18, 2) DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE MenuCategories (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE NOT NULL,
    icon NVARCHAR(255),
    stationId NVARCHAR(50),
    subCategories NVARCHAR(MAX) -- Storing as JSON string
);

CREATE TABLE MenuItems (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255),
    description NTEXT,
    price DECIMAL(18, 2),
    imageUrl NVARCHAR(MAX),
    categoryId NVARCHAR(255) FOREIGN KEY REFERENCES MenuCategories(id),
    subCategoryId NVARCHAR(255),
    availableAddonIds NVARCHAR(MAX), -- Storing as JSON string
    variants NVARCHAR(MAX), -- Storing as JSON string
    dealItems NVARCHAR(MAX) -- Storing as JSON string
);

CREATE TABLE Addons (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255),
    price DECIMAL(18, 2),
    prices NVARCHAR(MAX), -- Storing as JSON string for size-based pricing
    type NVARCHAR(50) DEFAULT 'standard'
);

CREATE TABLE Floors (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255)
);

CREATE TABLE Tables (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255),
    floorId NVARCHAR(255) FOREIGN KEY REFERENCES Floors(id)
);

CREATE TABLE PaymentMethods (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE,
    taxRate DECIMAL(5, 4)
);

CREATE TABLE Orders (
    id NVARCHAR(255) PRIMARY KEY,
    orderNumber NVARCHAR(255) UNIQUE,
    branchId NVARCHAR(255) FOREIGN KEY REFERENCES Branches(id),
    orderDate DATETIME,
    completionDate DATETIME NULL,
    orderType NVARCHAR(50) CHECK (orderType IN ('Dine-In', 'Take-Away', 'Delivery')),
    status NVARCHAR(50) CHECK (status IN ('Pending', 'Preparing', 'Partial Ready', 'Ready', 'Completed', 'Cancelled')),
    subtotal DECIMAL(18, 2),
    taxRate DECIMAL(5, 4),
    taxAmount DECIMAL(18, 2),
    totalAmount DECIMAL(18, 2),
    paymentMethod NVARCHAR(255),
    instructions NTEXT,
    floorId NVARCHAR(255),
    tableId NVARCHAR(255),
    deliveryMode NVARCHAR(255),
    customerName NVARCHAR(255),
    customerPhone NVARCHAR(50),
    customerAddress NTEXT,
    cancellationReason NTEXT,
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(255),
    discountType NVARCHAR(50),
    discountValue DECIMAL(18, 2),
    discountAmount DECIMAL(18, 2),
    originalTotalAmount DECIMAL(18, 2),
    placedBy NVARCHAR(255),
    completedBy NVARCHAR(255)
);

CREATE TABLE OrderItems (
    id NVARCHAR(255) PRIMARY KEY,
    orderId NVARCHAR(255) FOREIGN KEY REFERENCES Orders(id) ON DELETE CASCADE,
    menuItemId NVARCHAR(255),
    name NVARCHAR(255),
    quantity INT,
    itemPrice DECIMAL(18, 2),
    baseItemPrice DECIMAL(18, 2),
    selectedAddons NVARCHAR(MAX), -- Storing as JSON string
    selectedVariantName NVARCHAR(255),
    stationId NVARCHAR(50),
    isPrepared BIT DEFAULT 0,
    preparedAt DATETIME NULL,
    isDispatched BIT DEFAULT 0,
    dealName NVARCHAR(255),
    instructions NTEXT,
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(255)
);

CREATE TABLE ActivityLog (
    id NVARCHAR(255) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    [user] NVARCHAR(255) NOT NULL,
    message NTEXT NOT NULL,
    category NVARCHAR(50) NOT NULL
);

CREATE TABLE CashierLog (
    id NVARCHAR(255) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    type NVARCHAR(50) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    cashierId NVARCHAR(255) NOT NULL,
    cashierName NVARCHAR(255) NOT NULL,
    adminId NVARCHAR(255) NOT NULL,
    adminName NVARCHAR(255) NOT NULL,
    notes NTEXT
);

GO

PRINT 'Database schema created successfully.';
GO
