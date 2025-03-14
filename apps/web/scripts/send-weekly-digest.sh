#!/bin/bash

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=""
export SUPABASE_SERVICE_ROLE_KEY=""
export RESEND_API_KEY=""
export NEWSLETTER_AUDIENCE=""

# Create a temporary TypeScript file for running with test email ID
if [ "$1" != "" ]; then
  echo "import { sendApprovedDigest } from '../lib/emails/send-weekly-digest';

  async function main() {
    try {
      const result = await sendApprovedDigest('$1');
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }

  main();" > scripts/temp-send-digest.ts

  # Run the temporary script
  pnpm tsx scripts/temp-send-digest.ts
  rm scripts/temp-send-digest.ts
else
  # Run the regular script
  pnpm tsx lib/emails/send-weekly-digest.ts
fi