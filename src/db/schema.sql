-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CheeziousKiosk')
BEGIN
  CREATE DATABASE CheeziousKiosk;
END
GO

USE CheeziousKiosk;
GO

-- Drop existing tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Deals;
DROP TABLE IF EXISTS Deal_Items;
DROP TABLE IF EXISTS MenuItems;
DROP TABLE IF EXISTS MenuCategories;
DROP TABLE IF EXISTS Addons;
DROP TABLE IF EXISTS Tables;
DROP TABLE IF EXISTS Floors;
DROP TABLE IF EXISTS Branches;
DROP TABLE IF EXISTS PaymentMethods;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS DeliveryModes;
DROP TABLE IF EXISTS ActivityLog;
DROP TABLE IF EXISTS CashierLog;
GO


-- Create Branches Table
CREATE TABLE Branches (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    dineInEnabled BIT NOT NULL DEFAULT 1,
    takeAwayEnabled BIT NOT NULL DEFAULT 1,
    deliveryEnabled BIT NOT NULL DEFAULT 1,
    orderPrefix NVARCHAR(10) NOT NULL
);

-- Create Roles Table
CREATE TABLE Roles (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    permissions NVARCHAR(MAX) -- Storing as JSON array string
);

-- Create Users Table
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    branchId NVARCHAR(50),
    stationName NVARCHAR(100),
    balance DECIMAL(18, 2) DEFAULT 0,
    FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE SET NULL,
    FOREIGN KEY (role) REFERENCES Roles(id) ON DELETE CASCADE
);

-- Create Floors Table
CREATE TABLE Floors (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
);

-- Create Tables Table
CREATE TABLE Tables (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    floorId NVARCHAR(50),
    FOREIGN KEY (floorId) REFERENCES Floors(id) ON DELETE CASCADE
);

-- Create MenuCategories Table
CREATE TABLE MenuCategories (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    icon NVARCHAR(50),
    stationId NVARCHAR(50),
    subCategories NVARCHAR(MAX) -- Storing as JSON array: [{id: string, name: string}]
);

-- Create Addons Table
CREATE TABLE Addons (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2),
    prices NVARCHAR(MAX), -- For size-based pricing, stored as JSON
    type NVARCHAR(50) DEFAULT 'standard'
);

-- Create MenuItems Table
CREATE TABLE MenuItems (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    categoryId NVARCHAR(50),
    subCategoryId NVARCHAR(50),
    imageUrl NVARCHAR(500),
    availableAddonIds NVARCHAR(MAX), -- Storing as JSON array of strings
    variants NVARCHAR(MAX), -- Storing as JSON array of objects
    dealItems NVARCHAR(MAX), -- Storing as JSON array of objects
    FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE SET NULL
);

-- Create PaymentMethods Table
CREATE TABLE PaymentMethods (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    taxRate DECIMAL(4, 2) DEFAULT 0
);

-- Create DeliveryModes Table
CREATE TABLE DeliveryModes (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
);

-- Create Orders Table
CREATE TABLE Orders (
    id NVARCHAR(50) PRIMARY KEY,
    orderNumber NVARCHAR(100) UNIQUE NOT NULL,
    branchId NVARCHAR(50),
    orderDate DATETIME NOT NULL,
    completionDate DATETIME,
    orderType NVARCHAR(50),
    status NVARCHAR(50),
    totalAmount DECIMAL(18, 2),
    subtotal DECIMAL(18, 2),
    taxRate DECIMAL(4, 2),
    taxAmount DECIMAL(18, 2),
    paymentMethod NVARCHAR(100),
    instructions NVARCHAR(500),
    placedBy NVARCHAR(50),
    floorId NVARCHAR(50),
    tableId NVARCHAR(50),
    deliveryMode NVARCHAR(50),
    customerName NVARCHAR(100),
    customerPhone NVARCHAR(50),
    customerAddress NVARCHAR(500),
    cancellationReason NVARCHAR(500),
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(500),
    discountType NVARCHAR(50),
    discountValue DECIMAL(18, 2),
    discountAmount DECIMAL(18, 2),
    originalTotalAmount DECIMAL(18, 2),
    completedBy NVARCHAR(50),
    FOREIGN KEY (branchId) REFERENCES Branches(id),
    FOREIGN KEY (floorId) REFERENCES Floors(id),
    FOREIGN KEY (tableId) REFERENCES Tables(id)
);

-- Create OrderItems Table
CREATE TABLE OrderItems (
    id NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50) NOT NULL,
    menuItemId NVARCHAR(50),
    name NVARCHAR(200),
    quantity INT,
    itemPrice DECIMAL(18, 2),
    baseItemPrice DECIMAL(18, 2),
    selectedAddons NVARCHAR(MAX), -- JSON string
    selectedVariantName NVARCHAR(100),
    stationId NVARCHAR(50),
    isPrepared BIT DEFAULT 0,
    preparedAt DATETIME,
    isDispatched BIT DEFAULT 0,
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(50),
    instructions NVARCHAR(500),
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

-- Create ActivityLog Table
CREATE TABLE ActivityLog (
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    [user] NVARCHAR(100) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(50) NOT NULL
);

-- Create CashierLog Table
CREATE TABLE CashierLog (
    id NVARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    type NVARCHAR(50) NOT NULL, -- 'bleed' or 'deposit'
    amount DECIMAL(18, 2) NOT NULL,
    cashierId NVARCHAR(50) NOT NULL,
    cashierName NVARCHAR(100) NOT NULL,
    adminId NVARCHAR(50) NOT NULL,
    adminName NVARCHAR(100) NOT NULL,
    notes NVARCHAR(500),
    FOREIGN KEY (cashierId) REFERENCES Users(id) ON DELETE NO ACTION,
    FOREIGN KEY (adminId) REFERENCES Users(id) ON DELETE NO ACTION
);


GO
PRINT 'Database schema created successfully.';
GO
