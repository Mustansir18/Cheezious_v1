
# AI and External System Synchronization

The application is designed to communicate with external systems, such as a Point of Sale (POS) or an ERP like Microsoft Dynamics 365. This is handled by a Genkit AI flow.

## Genkit Setup

-   **`src/ai/genkit.ts`**: This file is responsible for initializing the Genkit AI library. It configures the necessary plugins (like `googleAI`) and sets the default AI model to be used. The exported `ai` object is used throughout the AI-related parts of the app to define flows, tools, and prompts.

## Order Synchronization Flow

-   **File:** `src/ai/flows/sync-order-flow.ts`

This file contains the core logic for sending order data to an external system.

### `syncOrderToExternalSystem(input: SyncOrderInput)`

This is the primary function exported from the file. It is an `async` function that acts as a wrapper around the Genkit flow. Client-side components or server actions in the Next.js app call this function to trigger the sync process.

### Data Schemas (Zod)

To ensure data integrity and provide clear definitions for the AI model, the flow uses `zod` to define schemas for its inputs and outputs.

-   **`SyncOrderInputSchema`**: This schema, defined in `src/lib/types.ts`, details the exact structure of the order data that the flow expects. It includes the order ID, branch, date, items, total amount, etc. The descriptions within the Zod schema are important, as they help the AI understand the purpose of each field.

-   **`SyncOrderOutputSchema`**: Also in `src/lib/types.ts`, this defines the expected shape of the response from the flow. It includes a `success` boolean, an optional `externalId` (the order's ID in the external system), and a `message`.

### How It Works (Conceptual)

1.  **Trigger:** When a customer successfully places an order in `src/app/branch/[branchId]/order/page.tsx`, the `handleConfirmOrder` function is called.
2.  **Call Flow:** Inside `handleConfirmOrder`, the `syncOrderToExternalSystem` function is invoked, passing the newly created `Order` object as the payload.
3.  **Execution:** The Genkit flow receives the data.
4.  **External API Call:** The flow would typically contain logic to make a `fetch` request (a `POST` request) to an external API endpoint (e.g., the Dynamics 365 endpoint specified in the environment variables).
5.  **Authentication:** For a production system, this is where authentication logic, such as acquiring an OAuth 2.0 bearer token, would be implemented before making the API call.
6.  **Response:** The flow processes the response from the external system and returns an object matching the `SyncOrderOutputSchema` to the original caller.

### Current Status: Disconnected

As noted in the source code, the connection to the external Dynamics 365 system is currently **disconnected for development purposes**. The `syncOrderToExternalSystem` function will immediately return a `success: true` response without making a real API call.

To re-enable this functionality, the `fetch()` call and related logic for handling API endpoints and authentication would need to be re-introduced into the `sync-order-flow.ts` file.
