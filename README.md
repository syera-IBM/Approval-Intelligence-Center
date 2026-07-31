## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Connecting the IBM OpenChat Agent

The **Approval Agent** panel in the header calls the IBM OpenChat (watsonx.ai
Assistants) API when configured. Without configuration it runs in demo/fallback
mode with pre-canned responses.

### Setup

1. Copy the example env file:
   ```
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in the two required values:

   | Variable | Description |
   |---|---|
   | `VITE_OPENCHAT_URL` | Base URL of your IBM OpenChat tenant (e.g. `https://your-tenant.assistants.watson.cloud.ibm.com`) |
   | `VITE_OPENCHAT_AGENT_ID` | UUID of the Procurement Approvals Workflow Agent — already pre-filled as `101351ed-2c41-4ec4-8a7e-1ddd8185bd5f` |
   | `VITE_OPENCHAT_API_KEY` | API key for your tenant (optional, only if your instance requires one) |

3. Restart the dev server — the agent panel status dot will turn **green** when the connection is active.

> ⚠️ `.env.local` is git-ignored. Never commit secrets to version control.
