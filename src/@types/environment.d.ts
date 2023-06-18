declare namespace NodeJS {
  interface ProcessEnv {
    /* General */

    NODE_ENV: 'development' | 'test' | 'production';

    /* Injected by serverless.yml */

    STAGE: string;

    /* Defined in .env */

    // Telegram
    TELEGRAM_BOT_TOKEN: string;

    // AWS environment
    REGION: string;
    APIG_DEV: string;
    APIG_PROD: string;

    // DynamoDB table names
    TABLE_CLOSURES: string;
    TABLE_HC: string;
    TABLE_USERS: string;
    TABLE_FEEDBACK: string;
    TABLE_INPUTS: string;

    // S3 bucket names
    ARTIFACTS_BUCKET: string;

    // Discord
    DISCORD_BOT_TOKEN: string;
    DISCORD_ADMIN_DEV_CHANNEL_ID: string;
    DISCORD_ADMIN_PROD_CHANNEL_ID: string;
    DISCORD_FEEDBACK_CHANNEL_ID: string;
    DISCORD_ANALYSIS_CHANNEL_ID: string;

    // Sentry
    SENTRY_DSN: string;

    // Server
    SERVER_AUTH_TOKEN: string;
  }
}
