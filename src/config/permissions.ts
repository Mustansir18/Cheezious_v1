

export const ALL_PERMISSIONS = [
    {
        id: 'admin:*',
        name: 'All Admin Access',
        description: 'Grants unrestricted access to all current and future admin pages.'
    },
    {
        id: '/admin',
        name: 'Admin Dashboard',
        description: 'Access to the main admin dashboard view.'
    },
    {
        id: '/admin/orders',
        name: 'Order Management',
        description: 'View and manage all customer orders.'
    },
    {
        id: '/admin/kds',
        name: 'Kitchen Display System (Full)',
        description: 'Access to all KDS stations for order preparation and dispatch.'
    },
    {
        id: '/admin/kds/pizza',
        name: 'KDS - MAKE Station',
        description: 'Access to the MAKE (Pizza) station display.'
    },
    {
        id: '/admin/kds/pasta',
        name: 'KDS - PASTA Station',
        description: 'Access to the PASTA station display.'
    },
    {
        id: '/admin/kds/fried',
        name: 'KDS - FRIED Station',
        description: 'Access to the FRIED station display.'
    },
    {
        id: '/admin/kds/bar',
        name: 'KDS - BEVERAGES Station',
        description: 'Access to the BEVERAGES station display.'
    },
    {
        id: '/admin/kds/master',
        name: 'KDS - CUTT Station',
        description: 'Access to the CUTT (Assembly) station display.'
    },
    {
        id: '/admin/queue',
        name: 'Order Queue Display',
        description: 'Access to the public-facing order status screen.'
    },
    {
        id: '/admin/reporting',
        name: 'Sales Reports',
        description: 'View sales analytics and performance reports.'
    },
    {
        id: '/admin/sale-verification',
        name: 'Sale Verification Report',
        description: 'View a report of which user completed which sale.'
    },
    {
        id: '/admin/cash-management',
        name: 'Cash Management',
        description: 'Manage cashier balances, bleed, and safe deposit transactions.'
    },
    {
        id: '/admin/menu',
        name: 'Menu Management',
        description: 'Create, edit, and delete menu items and categories.'
    },
    {
        id: '/admin/deals',
        name: 'Deals Management',
        description: 'Manage promotional deals and discounts.'
    },
    {
        id: '/admin/qr-codes',
        name: 'QR Code Generation',
        description: 'Generate and print QR codes for tables.'
    },
    {
        id: '/admin/feedback',
        name: 'Customer Feedback',
        description: 'View and manage customer ratings and comments.'
    },
    {
        id: '/admin/users',
        name: 'User Management',
        description: 'Manage accounts for staff members.'
    },
    {
        id: '/admin/settings',
        name: 'Restaurant Settings',
        description: 'Configure floors, tables, branches, and other system settings.'
    },
    {
        id: '/cashier',
        name: 'Cashier Dashboard',
        description: 'Access to the primary cashier interface.'
    },
    {
        id: '/marketing/reporting',
        name: 'Marketing - Sales Reports',
        description: 'Access to sales reports for marketing analysis.'
    },
    {
        id: '/marketing/feedback',
        name: 'Marketing - Customer Feedback',
        description: 'Access to customer feedback for marketing insights.'
    },
    {
        id: '/marketing/target',
        name: 'Marketing - Sales Targets',
        description: 'Set and track sales targets.'
    }
];
