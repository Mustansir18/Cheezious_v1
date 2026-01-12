
-- Drop existing tables in reverse order of creation to avoid foreign key conflicts
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Tables', 'U') IS NOT NULL DROP TABLE dbo.Tables;
IF OBJECT_ID('dbo.Floors', 'U') IS NOT NULL DROP TABLE dbo.Floors;
IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL DROP TABLE dbo.MenuItems;
IF OBJECT_ID('dbo.MenuCategories', 'U') IS NOT NULL DROP TABLE dbo.MenuCategories;
IF OBJECT_ID('dbo.Branches', 'U') IS NOT NULL DROP TABLE dbo.Branches;
IF OBJECT_ID('dbo.PaymentMethods', 'U') IS NOT NULL DROP TABLE dbo.PaymentMethods;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL DROP TABLE dbo.ActivityLogs;
IF OBJECT_ID('dbo.Ratings', 'U') IS NOT NULL DROP TABLE dbo.Ratings;

GO

-- Create tables in the correct order of dependency

-- Branches (no dependencies)
CREATE TABLE Branches (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    dineInEnabled BIT NOT NULL DEFAULT 1,
    takeAwayEnabled BIT NOT NULL DEFAULT 1,
    deliveryEnabled BIT NOT NULL DEFAULT 1,
    orderPrefix NVARCHAR(10) NOT NULL
);

-- Floors (no dependencies)
CREATE TABLE Floors (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL
);

-- Tables (depends on Floors)
CREATE TABLE Tables (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    floorId NVARCHAR(50) FOREIGN KEY REFERENCES Floors(id)
);

-- Users (depends on Branches)
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL, -- Store hashed passwords!
    role NVARCHAR(50) NOT NULL,
    branchId NVARCHAR(50) FOREIGN KEY REFERENCES Branches(id),
    balance DECIMAL(10, 2) DEFAULT 0
);

-- MenuCategories (no dependencies)
CREATE TABLE MenuCategories (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    icon NVARCHAR(50),
    stationId NVARCHAR(50),
    subCategories NVARCHAR(MAX) -- Storing as JSON string
);

-- MenuItems (depends on MenuCategories)
CREATE TABLE MenuItems (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL,
    categoryId NVARCHAR(50) FOREIGN KEY REFERENCES MenuCategories(id),
    subCategoryId NVARCHAR(50),
    imageUrl NVARCHAR(MAX),
    availableAddonIds NVARCHAR(MAX), -- Storing as JSON string
    variants NVARCHAR(MAX), -- Storing as JSON string
    dealItems NVARCHAR(MAX) -- Storing as JSON string
);

-- PaymentMethods (no dependencies)
CREATE TABLE PaymentMethods (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    taxRate DECIMAL(4, 2) DEFAULT 0
);

-- Orders (depends on several tables)
CREATE TABLE Orders (
    id NVARCHAR(50) PRIMARY KEY,
    orderNumber NVARCHAR(50) UNIQUE NOT NULL,
    branchId NVARCHAR(50) FOREIGN KEY REFERENCES Branches(id),
    orderDate DATETIME NOT NULL,
    completionDate DATETIME,
    orderType NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    taxRate DECIMAL(4, 2) NOT NULL,
    taxAmount DECIMAL(10, 2) NOT NULL,
    paymentMethod NVARCHAR(100),
    instructions NVARCHAR(MAX),
    floorId NVARCHAR(50) FOREIGN KEY REFERENCES Floors(id),
    tableId NVARCHAR(50) FOREIGN KEY REFERENCES Tables(id),
    deliveryMode NVARCHAR(50),
    customerName NVARCHAR(100),
    customerPhone NVARCHAR(50),
    customerAddress NVARCHAR(255),
    cancellationReason NVARCHAR(MAX),
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(MAX),
    discountType NVARCHAR(50),
    discountValue DECIMAL(10, 2),
    discountAmount DECIMAL(10, 2),
    originalTotalAmount DECIMAL(10, 2),
    placedBy NVARCHAR(50),
    completedBy NVARCHAR(50)
);

-- OrderItems (depends on Orders and MenuItems)
CREATE TABLE OrderItems (
    id NVARCHAR(50) PRIMARY KEY,
    orderId NVARCHAR(50) FOREIGN KEY REFERENCES Orders(id) ON DELETE CASCADE,
    menuItemId NVARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    itemPrice DECIMAL(10, 2) NOT NULL,
    baseItemPrice DECIMAL(10, 2) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    selectedAddons NVARCHAR(MAX), -- Storing as JSON string
    selectedVariantName NVARCHAR(100),
    stationId NVARCHAR(50),
    isPrepared BIT DEFAULT 0,
    preparedAt DATETIME,
    isDispatched BIT DEFAULT 0,
    instructions NVARCHAR(MAX),
    isDealComponent BIT DEFAULT 0,
    parentDealCartItemId NVARCHAR(50)
);


PRINT 'Database schema created successfully.';
GO
