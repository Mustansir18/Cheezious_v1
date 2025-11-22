
'use server';
/**
 * @fileOverview A flow for synchronizing order data with an external system.
 *
 * This file defines the Genkit flow responsible for taking processed order data
 * from the Cheezious Connect application and transmitting it to a third-party
 * system, such as a POS or an ERP like Microsoft Dynamics 365.
 *
 * - syncOrderToExternalSystem - An exported function that triggers the synchronization flow.
 * - SyncOrderInput - The Zod schema defining the structure of the order data to be synced.
 * - SyncOrderOutput - The Zod schema for the expected response from the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Defines the schema for a single item within the order.
const OrderItemSchema = z.object({
  menuItemId: z.string().describe('The unique identifier for the menu item.'),
  name: z.string().describe('The name of the menu item.'),
  quantity: z.number().describe('The quantity of this item ordered.'),
  itemPrice: z.number().describe('The price of a single unit of this item.'),
});

// Defines the schema for the entire order that will be sent to the external system.
export const SyncOrderInputSchema = z.object({
  id: z.string().describe('The unique identifier for the order from Firestore.'),
  branchId: z.string().describe('The identifier for the branch where the order was placed.'),
  orderDate: z.string().describe('The ISO 8601 timestamp when the order was placed.'),
  orderType: z.enum(['Dine-In', 'Take-Away']).describe('The type of order.'),
  status: z.string().describe('The current status of the order (e.g., "Pending").'),
  totalAmount: z.number().describe('The total cost of the order.'),
  orderNumber: z.string().describe('The human-readable order number.'),
  items: z.array(OrderItemSchema).describe('An array of items included in the order.'),
});
export type SyncOrderInput = z.infer<typeof SyncOrderInputSchema>;

// Defines the schema for the response after attempting to sync the order.
export const SyncOrderOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the synchronization was successful.'),
  externalId: z.string().optional().describe('The identifier for the order in the external system, if successful.'),
  message: z.string().describe('A message detailing the result of the operation.'),
});
export type SyncOrderOutput = z.infer<typeof SyncOrderOutputSchema>;


/**
 * Triggers the Genkit flow to synchronize an order with an external system.
 * This is a wrapper function to provide a clean, callable interface from server components.
 * @param input The order data that conforms to the SyncOrderInput schema.
 * @returns A promise that resolves with the output of the synchronization flow.
 */
export async function syncOrderToExternalSystem(input: SyncOrderInput): Promise<SyncOrderOutput> {
  return syncOrderFlow(input);
}


/**
 * The main Genkit flow for synchronizing order data.
 *
 * In a real-world scenario, this flow would contain the logic to authenticate with
 * and send data to the Dynamics 365 API. For this example, it simulates the process.
 */
const syncOrderFlow = ai.defineFlow(
  {
    name: 'syncOrderFlow',
    inputSchema: SyncOrderInputSchema,
    outputSchema: SyncOrderOutputSchema,
  },
  async (input) => {
    console.log('SYNCING ORDER TO EXTERNAL SYSTEM:', input.orderNumber);

    // TODO: Replace this simulation with a real API call to Dynamics 365.
    // This would involve:
    // 1. Setting up authentication (e.g., OAuth2) with the Dynamics 365 API.
    // 2. Transforming the `input` data to match the expected format of the Dynamics 365 entity.
    // 3. Making a POST request to the appropriate Dynamics 365 API endpoint.
    // 4. Handling success and error responses from the API.

    // Simulate a successful API call.
    const isSuccessful = true; // Change to false to simulate an error.

    if (isSuccessful) {
      console.log(`Successfully synced order ${input.orderNumber} to external system.`);
      return {
        success: true,
        // In a real scenario, this would be the ID returned by the Dynamics API.
        externalId: `D365-${input.id}`,
        message: 'Order synchronized successfully with external system.',
      };
    } else {
      console.error(`Failed to sync order ${input.orderNumber} to external system.`);
      return {
        success: false,
        message: 'Failed to connect to the external POS/ERP system.',
      };
    }
  }
);
