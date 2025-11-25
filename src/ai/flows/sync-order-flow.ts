
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
  console.log(`[SYNC-FLOW] Initiating synchronization for order: ${input.orderNumber}`);

  const apiEndpoint = process.env.DYNAMICS_RSSU_API_ENDPOINT;

  if (!apiEndpoint) {
    console.error('[SYNC-FLOW-ERROR] DYNAMICS_RSSU_API_ENDPOINT is not set in environment variables. Skipping synchronization.');
    return {
      success: false,
      message: 'API endpoint is not configured. The DYNAMICS_RSSU_API_ENDPOINT environment variable must be set.',
    };
  }

  console.log(`[SYNC-FLOW] Endpoint: ${apiEndpoint}`);

  try {
    // In a real-world scenario, you would handle authentication here.
    // For Dynamics 365, this typically involves fetching an OAuth 2.0 token from Azure AD
    // and including it in the Authorization header as a Bearer token.
    // const authToken = await getAuthToken();

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`[SYNC-FLOW-SUCCESS] Successfully synced order ${input.orderNumber}. External system responded with ID: ${responseData.externalId || 'N/A'}`);
      return {
        success: true,
        // Assuming the external API returns an ID in a field like 'externalId' or 'salesId'
        externalId: responseData.externalId || `EXT-${input.id}`,
        message: 'Order synchronized successfully with the external system.',
      };
    } else {
      const errorBody = await response.text();
      console.error(`[SYNC-FLOW-FAILURE] Failed to sync order ${input.orderNumber}. Status: ${response.status}. Body: ${errorBody}`);
      return {
        success: false,
        message: `Failed to sync with external system. Status: ${response.status}. The server responded with: ${errorBody}`,
      };
    }
  } catch (error: any) {
    console.error(`[SYNC-FLOW-ERROR] An unexpected network or system error occurred during synchronization for order ${input.orderNumber}: ${error.message}`);
    return {
      success: false,
      message: 'An unexpected network error occurred while trying to connect to the external system.',
    };
  }
}

/**
 * Placeholder function for getting an authentication token for Dynamics 365.
 * In a real implementation, this would involve a client credentials flow with Azure AD.
 * @returns {Promise<string>} A promise that resolves with the auth token.
 */
// async function getAuthToken(): Promise<string> {
//   // This is where you would implement the logic to get a token from Azure AD
//   // using a library like @azure/msal-node.
//   // For demonstration, this returns a placeholder.
//   console.log('[SYNC-FLOW] Fetching auth token (placeholder)...');
//   return "YOUR_DUMMY_AUTH_TOKEN";
// }
