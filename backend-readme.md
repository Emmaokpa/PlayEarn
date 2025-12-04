# RewardPlay Backend Server

This Node.js server runs the Telegram bot using a polling mechanism. It is designed to be deployed on a persistent hosting service like Render.

## Setup and Deployment

1.  **Clone Your Repository:**
    Clone the new backend repository you created to your local machine.

2.  **Add Files:**
    Copy the following files from your main project into this new backend repository:
    - `server.js`
    - `backend-package.json` (rename this file to `package.json`)
    - `.env` (copy your existing `.env` file)

3.  **Deploy to a Hosting Service (e.g., Render):**
    - Create a new "Web Service" on Render and connect it to your backend GitHub repository.
    - Set the **Start Command** to: `npm install && npm start`
    - Go to the "Environment" tab and add all the secret keys from your `.env` file (e.g., `TELEGRAM_BOT_TOKEN`, `FIREBASE_PROJECT_ID`, etc.).

Once deployed, this server will run 24/7, handling all Telegram bot interactions and payments.
