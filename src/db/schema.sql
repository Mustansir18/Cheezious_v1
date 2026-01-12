
-- Cheezious Connect Database Schema
-- This script contains the CREATE TABLE statements for setting up the application's database.
-- It is designed for SQL Server but can be adapted for other SQL databases.

-- Users Table
-- Stores user accounts for cashiers, branch admins, and root admins.
CREATE TABLE Users (
    id NVARCHAR(255) PRIMARY KEY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(MAX) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    branchId NVARCHAR(255) NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE SET NULL
);
GO

-- Branches Table
-- Stores information about each restaurant branch.
CREATE TABLE Branches (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    location NVARCHAR(MAX)
);
GO

-- MenuCategories Table
-- Defines the categories for menu items.
CREATE TABLE MenuCategories (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE NOT NULL,
    icon NVARCHAR(100)
);
GO

-- MenuItems Table
-- Stores all individual menu items. Price is stored here for non-variant items.
CREATE TABLE MenuItems (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL,
    imageUrl NVARCHAR(MAX),
    categoryId NVARCHAR(255) NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES MenuCategories(id) ON DELETE CASCADE
);
GO

-- MenuItemVariants Table
-- Stores different sizes/variants for a menu item (e.g., Small, Regular, Large Pizza).
CREATE TABLE MenuItemVariants (
    id NVARCHAR(255) PRIMARY KEY,
    menuItemId NVARCHAR(255) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (menuItemId) REFERENCES MenuItems(id) ON DELETE CASCADE
);
GO

-- Addons Table
-- Stores available add-ons for menu items.
CREATE TABLE Addons (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
GO

-- MenuItem_Addons Join Table
-- Maps which addons are available for which menu items.
CREATE TABLE MenuItem_Addons (
    menuItemId NVARCHAR(255) NOT NULL,
    addonId NVARCHAR(255) NOT NULL,
    PRIMARY KEY (menuItemId, addonId),
    FOREIGN KEY (menuItemId) REFERENCES MenuItems(id) ON DELETE CASCADE,
    FOREIGN KEY (addonId) REFERENCES Addons(id) ON DELETE CASCADE
);
GO

-- Deals Table
-- Stores promotional deals. Deals are a special type of MenuItem.
CREATE TABLE Deals (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL,
    imageUrl NVARCHAR(MAX)
);
GO

-- Deal_Items Join Table
-- Maps which MenuItems are included in which Deal.
CREATE TABLE Deal_Items (
    dealId NVARCHAR(255) NOT NULL,
    menuItemId NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (dealId, menuItemId),
    FOREIGN KEY (dealId) REFERENCES Deals(id) ON DELETE CASCADE,
    FOREIGN KEY (menuItemId) REFERENCES MenuItems(id) -- Do not cascade delete, as items can exist outside of deals
);
GO


-- Floors Table
-- Stores the different floors in a restaurant branch.
CREATE TABLE Floors (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    branchId NVARCHAR(255) NOT NULL,
    FOREIGN KEY (branchId) REFERENCES Branches(id) ON DELETE CASCADE
);
GO

-- Tables Table
-- Stores the individual tables and links them to a floor.
CREATE TABLE Tables (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    floorId NVARCHAR(255) NOT NULL,
    FOREIGN KEY (floorId) REFERENCES Floors(id) ON DELETE CASCADE
);
GO

-- PaymentMethods Table
-- Stores the accepted payment methods and their associated tax rates.
CREATE TABLE PaymentMethods (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) UNIQUE NOT NULL,
    taxRate DECIMAL(5, 4) DEFAULT 0.00
);
GO

-- Orders Table
-- Stores the main record for each order placed.
CREATE TABLE Orders (
    id NVARCHAR(255) PRIMARY KEY,
    orderNumber NVARCHAR(255) UNIQUE NOT NULL,
    branchId NVARCHAR(255) NOT NULL,
    orderDate DATETIME2 NOT NULL,
    completionDate DATETIME2 NULL,
    orderType NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    taxRate DECIMAL(5, 4) NOT NULL,
    taxAmount DECIMAL(10, 2) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentMethodId NVARCHAR(255) NOT NULL,
    floorId NVARCHAR(255) NULL,
    tableId NVARCHAR(255) NULL,
    instructions NVARCHAR(MAX) NULL,
    cancellationReason NVARCHAR(MAX) NULL,
    isComplementary BIT DEFAULT 0,
    complementaryReason NVARCHAR(MAX) NULL,
    discountType NVARCHAR(50) NULL,
    discountValue DECIMAL(10, 2) NULL,
    discountAmount DECIMAL(10, 2) NULL,
    placedBy NVARCHAR(255) NULL,
    completedBy NVARCHAR(255) NULL,
    FOREIGN KEY (branchId) REFERENCES Branches(id),
    FOREIGN KEY (paymentMethodId) REFERENCES PaymentMethods(id),
    FOREIGN KEY (floorId) REFERENCES Floors(id),
    FOREIGN KEY (tableId) REFERENCES Tables(id)
);
GO

-- OrderItems Table
-- A join table that stores the individual items within each order, including customizations.
CREATE TABLE OrderItems (
    id NVARCHAR(255) PRIMARY KEY,
    orderId NVARCHAR(255) NOT NULL,
    menuItemId NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    itemPrice DECIMAL(10, 2) NOT NULL,
    baseItemPrice DECIMAL(10, 2) NOT NULL,
    variantName NVARCHAR(100) NULL,
    stationId NVARCHAR(50) NULL,
    isPrepared BIT DEFAULT 0,
    isDispatched BIT DEFAULT 0,
    instructions NVARCHAR(MAX) NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);
GO

-- OrderItem_Addons Table
-- Stores the add-ons selected for a specific order item.
CREATE TABLE OrderItem_Addons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orderItemId NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (orderItemId) REFERENCES OrderItems(id) ON DELETE CASCADE
);
GO

PRINT 'Database schema created successfully.';
GO
