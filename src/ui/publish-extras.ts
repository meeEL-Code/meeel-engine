/* ============================================================
   meeEL — Extra content for publish / ZIP download
   ============================================================ */

export const ENV_CONTENT = `# ==============================================
# meeEL — Private keys
# ==============================================
# This file is for YOUR eyes only.
# Do NOT share it. Do NOT commit it to GitHub.
#
# Put your real API keys here, one per line.
# Format:   NAME=value
#
# Example:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...
#
# Your actual keys go below this line:
# ==============================================

`;

export const ENV_EXAMPLE_CONTENT = `# ==============================================
# meeEL — Example secrets file
# ==============================================
# This is a TEMPLATE. Copy it to a file named .env
# and fill in your real values.
#
# Never commit your real .env to GitHub.
# ==============================================

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key-here

FIREBASE_API_KEY=your-firebase-key-here
FIREBASE_PROJECT_ID=your-project-id-here

CUSTOM_API_URL=https://api.example.com
CUSTOM_API_KEY=your-api-key-here
`;

export const PUBLISH_WARNING_EN =
  'Never paste real API keys directly in your code. Put them in .env file.';
