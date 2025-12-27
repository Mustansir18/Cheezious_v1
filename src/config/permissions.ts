
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
        id: '/marketing/hourly-report',
        name: 'Marketing - Hourly Report',
        description: 'Generate sales reports for specific hours.'
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
