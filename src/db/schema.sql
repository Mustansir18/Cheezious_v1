
-- This script is for setting up the CheeziousKiosk database schema in SQL Server.
-- Execute this script in your database management tool (e.g., SSMS, Azure Data Studio)
-- against your 'CheeziousKiosk' database to create all necessary tables.

-- Drop existing tables in reverse order of creation to avoid foreign key conflicts
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('Ratings', 'U') IS NOT NULL DROP TABLE Ratings;
IF OBJECT_ID('ActivityLogs', 'U') IS NOT NULL DROP TABLE ActivityLogs;
IF OBJECT_ID('CashierLogs', 'U') IS NOT NULL DROP TABLE CashierLogs;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('MenuItemAddons', 'U') IS NOT NULL DROP TABLE MenuItemAddons;
IF OBJECT_ID('MenuItemVariants', 'U') IS NOT NULL DROP TABLE MenuItemVariants;
IF OBJECT_ID('MenuItems', 'U') IS NOT NULL DROP TABLE MenuItems;
IF OBJECT_ID('DealItems', 'U') IS NOT NULL DROP TABLE DealItems;
IF OBJECT_ID('MenuSubCategories', 'U') IS NOT NULL DROP TABLE MenuSubCategories;
IF OBJECT_ID('MenuCategories', 'U') IS NOT NULL DROP TABLE MenuCategories;
IF OBJECT_ID('Addons', 'U') IS NOT NULL DROP TABLE Addons;
IF OBJECT_ID('AddonPrices', 'U') IS NOT NULL DROP TABLE AddonPrices;
IF OBJECT_ID('Tables', 'U') IS NOT NULL DROP TABLE Tables;
IF OBJECT_ID('Floors', 'U') IS NOT NULL DROP TABLE Floors;
IF OBJECT_ID('Branches', 'U') IS NOT NULL DROP TABLE Branches;
IF OBJECT_ID('PaymentMethods', 'U') IS NOT NULL DROP TABLE PaymentMethods;
IF OBJECT_ID('DeliveryModes', 'U') IS NOT NULL DROP TABLE DeliveryModes;
IF OBJECT_ID('Roles', 'U') IS NOT NULL DROP TABLE Roles;
GO

-- Create tables without foreign keys first

CREATE TABLE Branches (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    dineInEnabled BIT NOT NULL DEFAULT 1,
    takeAwayEnabled BIT NOT NULL DEFAULT 1,
    deliveryEnabled BIT NOT NULL DEFAULT 1,
    orderPrefix VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE Floors (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL
);

CREATE TABLE Tables (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    floorId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Floors(id) ON DELETE CASCADE
);

CREATE TABLE Roles (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    permissions NVARCHAR(MAX) -- Storing as JSON string
);

CREATE TABLE MenuCategories (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    icon NVARCHAR(100),
    stationId VARCHAR(50) NULL
);

CREATE TABLE MenuSubCategories (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    categoryId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuCategories(id) ON DELETE CASCADE
);

CREATE TABLE Addons (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10, 2),
    type VARCHAR(50) DEFAULT 'standard'
);

CREATE TABLE AddonPrices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    addonId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Addons(id) ON DELETE CASCADE,
    sizeName NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    UNIQUE(addonId, sizeName)
);

CREATE TABLE PaymentMethods (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    taxRate DECIMAL(5, 4) DEFAULT 0
);

CREATE TABLE DeliveryModes (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Ratings (
    id VARCHAR(100) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(1000)
);

CREATE TABLE ActivityLogs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    username NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    category NVARCHAR(50) NOT NULL
);

-- Create tables with foreign key dependencies

CREATE TABLE Users (
    id VARCHAR(100) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL, -- In a real app, this should be a hash
    roleId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Roles(id),
    branchId VARCHAR(100) NULL FOREIGN KEY REFERENCES Branches(id),
    stationName NVARCHAR(100) NULL,
    balance DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE MenuItems (
    id VARCHAR(100) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    categoryId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuCategories(id),
    subCategoryId VARCHAR(100) NULL FOREIGN KEY REFERENCES MenuSubCategories(id),
    imageUrl NVARCHAR(MAX)
);

CREATE TABLE MenuItemVariants (
    id VARCHAR(100) PRIMARY KEY,
    menuItemId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuItems(id) ON DELETE CASCADE,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    UNIQUE(menuItemId, name)
);

CREATE TABLE MenuItemAddons (
    menuItemId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuItems(id) ON DELETE CASCADE,
    addonId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Addons(id) ON DELETE CASCADE,
    PRIMARY KEY (menuItemId, addonId)
);

CREATE TABLE DealItems (
    dealId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuItems(id) ON DELETE CASCADE,
    menuItemId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES MenuItems(id), -- No cascade here to prevent cycles
    quantity INT NOT NULL,
    PRIMARY KEY (dealId, menuItemId)
);


CREATE TABLE Orders (
    id VARCHAR(100) PRIMARY KEY,
    orderNumber VARCHAR(50) NOT NULL UNIQUE,
    branchId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Branches(id),
    orderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    completionDate DATETIME2 NULL,
    orderType VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    taxRate DECIMAL(5, 4) NOT NULL,
    taxAmount DECIMAL(10, 2) NOT NULL,
    paymentMethod VARCHAR(100),
    instructions NVARCHAR(MAX),
    floorId VARCHAR(100) NULL FOREIGN KEY REFERENCES Floors(id),
    tableId VARCHAR(100) NULL FOREIGN KEY REFERENCES Tables(id),
    deliveryModeId VARCHAR(100) NULL FOREIGN KEY REFERENCES DeliveryModes(id),
    customerName NVARCHAR(255) NULL,
    customerPhone VARCHAR(50) NULL,
    customerAddress NVARCHAR(MAX) NULL,
    cancellationReason NVARCHAR(MAX) NULL,
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(255) NULL,
    discountType VARCHAR(50) NULL,
    discountValue DECIMAL(10, 2) NULL,
    discountAmount DECIMAL(10, 2) NULL,
    originalTotalAmount DECIMAL(10, 2) NULL,
    placedBy VARCHAR(100) NULL,
    completedBy VARCHAR(100) NULL
);

CREATE TABLE OrderItems (
    id VARCHAR(100) PRIMARY KEY,
    orderId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Orders(id) ON DELETE CASCADE,
    menuItemId VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    itemPrice DECIMAL(10, 2) NOT NULL,
    baseItemPrice DECIMAL(10, 2) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    selectedAddons NVARCHAR(MAX) NULL, -- JSON string of selected addons
    selectedVariant NVARCHAR(MAX) NULL, -- JSON string of selected variant
    stationId VARCHAR(50) NULL,
    isPrepared BIT NOT NULL DEFAULT 0,
    preparedAt DATETIME2 NULL,
    isDispatched BIT NOT NULL DEFAULT 0,
    instructions NVARCHAR(MAX) NULL,
    isDealComponent BIT NOT NULL DEFAULT 0,
    parentDealCartItemId VARCHAR(100) NULL
);

CREATE TABLE CashierLogs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    cashierId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Users(id),
    adminId VARCHAR(100) NOT NULL FOREIGN KEY REFERENCES Users(id),
    notes NVARCHAR(MAX)
);

PRINT 'Database schema created successfully.';
GO
