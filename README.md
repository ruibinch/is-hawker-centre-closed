# is-hawker-centre-closed

Is the hawker centre closed today?

## Pre-requisites

Create a bot with the [BotFather](https://t.me/botfather) and note down the returned value of the bot token.

Update this bot token in the `.env` file (see [Setup](#setup) section below).

## `.env` file

An `.env` file with the following keys specified is required (the values for `APIG_*` can be populated later on during the setup).

```
# Telegram
BOT_TOKEN=11111111:abcdefghijkl

# AWS
REGION=eu-central-1
APIG_DEV=12345678
APIG_PROD=87654321

# DynamoDB table names
TABLE_NAME_RESULTS=ihcc-results
TABLE_NAME_HC=ihcc-hawkerCentres
TABLE_NAME_USERS=ihcc-users
TABLE_NAME_FEEDBACK=ihcc-feedback
```

## Setup

```bash
## TL;DR version

# 1. Initialise DynamoDB
yarn init:db

# 2. Deploy Lambda functions
yarn deploy:both:all

# 3. Update APIG_* values in .env

# 4. Initialise bot webhook
yarn init:bot:prod
```

Setting up from scratch consists of 3 steps:

1. Initialising DynamoDB
1. Deploying Lambda functions
1. Initialising bot webhook

### Initialising DynamoDB

First, we create the DB and populate it with values.

> :notebook:  Uses REGION and TABLE_NAME\_\* values from `.env`

Run `yarn init:db`.

This script executes 2 other scripts:

1. `yarn db:create`

- Creates 4 tables in the specified region:
  1. RESULTS
  1. HC
  1. USERS
  1. FEEDBACK

2. `yarn db:seed:dev`, `yarn db:seed:prod`

- Populates the RESULTS and HC tables in the dev and prod environments with the latest values obtained from data.gov.sg API.

### Deploying Lambda functions

There is only 1 Lambda function to be deployed - the `bot` function.

> :orange_book:  Uses values specified in `serverless.yml`

To install a fresh deployment,

1. Run `yarn deploy:dev:all` or `yarn deploy:prod:all`
1. Note the new API Gateway ID(s) and update the `APIG_*` value(s) in `.env`

To update an existing deployment,

1. Run `yarn deploy:dev:bot` or `yarn deploy:prod:bot`

### Initialising bot webhook

Finally, we set up the webhook on our Telegram bot so that all messages sent to the bot will be immediately forwarded to our API gateway endpoint.

> :notebook:  Uses BOT_TOKEN, REGION and APIG\_\* values from `.env`

Run `yarn init:bot:dev` or `yarn init:bot:prod`.

Verify that the output webhook URL corresponds correctly to your API gateway URL.

Your bot should now be good to go!

## Links

[Emoji Unicode Tables](https://apps.timwhitlock.info/emoji/tables/unicode)
