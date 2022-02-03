declare namespace NodeJS {
  interface ProcessEnv {
    /* General */

    NODE_ENV: 'development' | 'test' | 'production';

    /* Injected by serverless.yml */

    STAGE: string;

    /* Defined in .env */

    // Telegram
    TELEGRAM_BOT_TOKEN: string;

    // Discord
    DISCORD_BOT_TOKEN: string;
    DISCORD_ADMIN_DEV_CHANNEL_ID: string;
    DISCORD_ADMIN_PROD_CHANNEL_ID: string;
    DISCORD_CLOSURES_ADMIN_DEV_CHANNEL_ID: string;
    DISCORD_CLOSURES_ADMIN_PROD_CHANNEL_ID: string;

    // Environment
    REGION: string;
    APIG_DEV: string;
    APIG_PROD: string;
    SENTRY_DSN: string;

    // DynamoDB table names
    TABLE_CLOSURES: string;
    TABLE_HC: string;
    TABLE_USERS: string;
    TABLE_FEEDBACK: string;
    TABLE_INPUTS: string;

    // Server
    SERVER_API_TOKEN: string;
  }
}
