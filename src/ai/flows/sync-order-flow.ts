
'use server';
/**
 * @fileOverview A flow for synchronizing order data with an external system.
 *
 * This file defines the Genkit flow responsible for taking processed order data
 * from the Cheezious Connect application and transmitting it to a third-party
 * system, such as a POS or an ERP like Microsoft Dynamics 365.
 *
 * - syncOrderToExternalSystem - An exported function that triggers the synchronization flow.
 */

import { type SyncOrderInput, type SyncOrderOutput } from '@/lib/types';


/**
 * Triggers the Genkit flow to synchronize an order with an external system.
 * This is a wrapper function to provide a clean, callable interface from server components.
 * @param input The order data that conforms to the SyncOrderInput schema.
 * @returns A promise that resolves with the output of the synchronization flow.
 */
export async function syncOrderToExternalSystem(input: SyncOrderInput): Promise<SyncOrderOutput> {
  console.log(`[SYNC-FLOW] Received order ${input.orderNumber} for internal processing.`);

  // The connection to the external Dynamics 365 system has been disconnected.
  // This function will now immediately return a success state without making an API call.
  // To re-enable, re-introduce the fetch() call and environment variable logic.
  
  console.log('[SYNC-FLOW] External synchronization is disabled. Returning success.');
  // For debugging, you can log the full payload that would be sent:
  // console.log('[SYNC-FLOW] Payload:', JSON.stringify(input, null, 2));

  return {
    success: true,
    externalId: `INT-${input.id}`, // Return an internal-looking ID
    message: 'Order processed internally. External sync is disabled.',
  };
}
