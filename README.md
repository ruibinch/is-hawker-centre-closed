<div align="center">
  <h1 align="center">🍜 IsHawkerCentreClosed</h1>
</div>

A Telegram bot that provides an easy way to check on hawker centre closure dates, as well as notifying you on days when your favourite hawker centres are closed.

Link: https://t.me/IsHawkerCentreClosedBot

# Bot

The bot comprises of the following modules:

1. Search
2. Favourites
3. Language
4. Feedback

## Search

Searching for hawker centre closure dates is the core functionality of the bot. Search can be done via the following methods:

1. Querying by keyword and timeframe
2. Querying by timeframe alone

Supported timeframe in queries are:

- `tdy` / `today`
- `tmr` / `tomorrow`
- `next week`
- `month`
- `next month`
- `next` (only if there is a preceding search keyword)

### Querying by keyword and timeframe

The query follows the format:

```
{{keyword}} {{timeframe}}
```

The search keyword can comprise of multiple words. It is considered a match if the search keyword exists as a substring of the hawker centre name.

The list of supported timeframes are detailed above. If the timeframe is omitted, it defaults to `next`, i.e. showing the date of the next closure.

Examples:

- `"redhill tmr"` will display the hawker centres containing the keyword **redhill** that are closed **tomorrow**
- `"bedok north next week"` will display the hawker centres containing the keyword **bedok north** that are closed **next week**
- `"jurong"` will display the hawker centres containing the keyword **jurong** and their **next closure dates**

### Querying by timeframe alone

It is also possible to query by timeframe alone, if you do not have a specific hawker centre in mind.

This is particularly useful when you just want to view all the hawker centres that are closed today - this can be achieved by a simple `"today"` query.

All timeframes except `next` are supported here - that requires a preceding keyword as it doesn't make sense to show the next closure date for every single hawker centre in Singapore!

## Favourites

The defining factor of the bot is the ability to add favourites and to be automatically notified on the day when one of your saved favourite hawker centres is closed.

### Adding a favourite

```
/fav {{keyword}}
```

This will return a list of choices for selection based on the keyword match. Upon selecting an option, the selected hawker centre will thereafter be added to your favourites list.

If no keyword matches are found, you will be prompted to try again.

### Viewing your favourites list

```
/list
```

This lists your favourited hawker centres sorted in alphabetical order, along with their next closure dates.

This makes it especially convenient to quickly view the closure status of all your favourites at one glance.

### Deleting a favourite

```
/del {{index}}
```

Deletion of a saved favourite is done by specifying the corresponding list index after the `/del` keyword. This is based on the index numbers of the favourites list (shown via the `/list` command).

### Notifications

When one or more of your favourited hawker centres is closed on the current day, a notification will be automatically sent to you to inform you of the closure(s). This will be sent at **6am SGT**.

This notification feature flips the standard flow to make it much more user-centric - instead of manually querying the bot when you want to check on a closure status, simply add the hawker centres that you are interested in to your favourites list once and let your bot inform you instead.

## Language

The bot also offers multi-language support; currently English (`en`) and Mandarin (`zh`) are the two supported languages.

English is the default option. The query format to toggle the language settings is:

```
/language {{"en"/"zh"}}
```

## Feedback

The `/feedback` command allows you to submit any feedback you have regarding the bot - this can be anything from bugs found to feature suggestions to compliments.

```
/feedback {{message}}
```

# Triggers

In addition to the front-facing aspect of the bot, there are a set of triggers that run as cron jobs behind the scenes to facilitate the overall operation.

The logs from these triggers are sent to a Discord channel for consolidation of all output in a central place.

## Notifications

Notifications are sent to you automatically when one or more of your favourited hawker centres is closed on the day. The message comprises of the hawker centre(s) closed on the day, their closure duration and reason.

This runs **daily at 6am SGT**.

## Sync latest data

A daily sync is run to populate the DB with the latest closures data available from the data.gov.sg API. This daily action will:

1. Delete current `closures` and `hawkerCentres` tables
2. Re-create these 2 tables
3. Make an API call to data.gov.sg API and parse the data into the appropriate format for upload
4. Upload the data to the newly created tables

This runs **daily at 4:10am SGT**.

## Healthiness check

The healthiness check counts the number of entries in the `closures` and `hawkerCentres` tables to ensure that they are above a pre-defined threshold (set at 400 and 100 respectively).

This provides confirmation that the sync process has executed successfully - e.g. there was a previous occurrence where the sync script terminated prematurely, resulting in the tables being created but not seeded and thus having zero entries.

This runs **daily at 4:20am SGT**.

## Scan for new entries

This trigger checks for any new user or feedback entries that had been added in the past week. This provides quick visibility into the user growth and submitted feedback.

This runs **every Sunday at 4am SGT**.

## Backup data

A backup of the users and feedback tables is made once a week using the DynamoDB backup option. Up to 3 of the latest backups are saved at any one time.

This runs **every Sunday at 4:05am SGT**.
