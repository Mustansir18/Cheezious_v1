import { NextResponse } from 'next/server';
import type { Floor, Table, PaymentMethod, Branch, Role, UserRole, DeliveryMode, PromotionSettings } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const defaultRoles: Role[] = [
    { id: "root", name: "Root", permissions: ["admin:*"] },
    { id: "admin", name: "Branch Admin", permissions: ["/admin", "/admin/orders", "/admin/kds", "/admin/queue"] },
    { id: "cashier", name: "Cashier", permissions: ["/cashier"] },
    { id: "marketing", name: "Marketing", permissions: ["/marketing/reporting", "/marketing/feedback", "/marketing/target"] },
    { id: "kds", name: "KDS (Full Access)", permissions: ["/admin/kds"] },
    { id: "make-station", name: "MAKE Station", permissions: ["/admin/kds/pizza"] },
    { id: "pasta-station", name: "PASTA Station", permissions: ["/admin/kds/pasta"] },
    { id: "fried-station", name: "FRIED Station", permissions: ["/admin/kds/fried"] },
    { id: "bar-station", name: "BEVERAGES Station", permissions: ["/admin/kds/bar"] },
    { id: "cutt-station", name: "CUTT Station", permissions: ["/admin/kds/master"] },
];

const defaultPaymentMethods: PaymentMethod[] = [
    { id: 'PM-00001', name: 'Cash', taxRate: 0.16 },
    { id: 'PM-00002', name: 'Credit/Debit Card', taxRate: 0.05 }
];

const initialBranches: Branch[] = [
    { id: 'B-00001', name: 'CHZ J3, JOHAR TOWN LAHORE', dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true, orderPrefix: 'G3' }
];

const floorsData: { id: string, name: string, prefix: string }[] = [
    { id: 'F-00001', name: 'Basement', prefix: 'B' },
    { id: 'F-00002', name: 'Ground', prefix: 'G' },
    { id: 'F-00003', name: 'First', prefix: 'F' },
    { id: 'F-00004', name: 'Second', prefix: 'S' },
    { id: 'F-00005', name: 'Roof Top', prefix: 'R' }
];

const initialFloors: Floor[] = floorsData.map(({ id, name }) => ({ id, name }));

const initialTables: Table[] = floorsData.flatMap(floor => 
    Array.from({ length: 10 }, (_, i) => ({
        id: `T-${floor.prefix.toLowerCase()}-${i + 1}`,
        name: `${floor.prefix}-${i + 1}`,
        floorId: floor.id,
    }))
);

const initialDeliveryModes: DeliveryMode[] = [
    { id: 'DM-001', name: 'Website' },
    { id: 'DM-002', name: 'App' },
    { id: 'DM-003', name: 'Call Centre' },
];

const defaultLogo = PlaceHolderImages.find(img => img.id === 'cheezious-special')?.imageUrl || '';

const initialSettings = {
    floors: initialFloors,
    tables: initialTables,
    paymentMethods: defaultPaymentMethods,
    autoPrintReceipts: false,
    companyName: "Cheezious",
    companyLogo: defaultLogo,
    branches: initialBranches,
    defaultBranchId: initialBranches[0]?.id || null,
    businessDayStart: "11:00",
    businessDayEnd: "04:00",
    roles: defaultRoles,
    deliveryModes: initialDeliveryModes,
    promotion: {
        isEnabled: true,
        itemId: 'D-00001',
        imageUrl: PlaceHolderImages.find(i => i.id === 'deal-1')?.imageUrl || ''
    }
};

/**
 * Handles GET requests to /api/settings.
 * This is a placeholder and should be replaced with logic to fetch settings from a database.
 */
export async function GET(request: Request) {
  // In a real application, you would fetch this data from your SQL database.
  return NextResponse.json(initialSettings);
}
