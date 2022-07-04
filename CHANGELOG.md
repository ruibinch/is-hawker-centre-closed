# Changelog

## [Unreleased]

## [0.14.0] - 2022-07-04

### Added

- Pagination for search result lists exceeding 10 entries

## [0.13.0] - 2021-09-18

### Added

- Search by "next week" timeframe

## [0.12.0] - 2021-09-14

### Changed

- Results to always be sorted in alphabetical order

## [0.11.1] - 2021-09-09

### Fixed

- Handle errors thrown when sending messages in `notificationsTrigger`

## [0.11.0] - 2021-08-08

### Changed

- Default timeframe from "today" to "next" to return more useful information by default

## [0.10.0] - 2021-08-07

### Added

- Indefinite end date option

## [0.9.2] - 2021-08-04

### Fixed

- Split messages exceeding the maximum Telegram message length of 4096 into separate messages

## [0.9.1] - 2021-08-01

### Fixed

- Incomplete results being returned when searching by "month" or "next month"

## [0.9.0] - 2021-07-28

### Added

- /updates command to check the latest updates

## [0.8.0] - 2021-07-28

### Added

- Auto-expansion of recognised acronyms, e.g. "amk" to "ang mo kio"

## [0.7.0] - 2021-07-23

### Added

- Displayed hawker centre secondary name in enclosing brackets in addition to the primary name

## [0.6.0] - 2021-07-17

### Added

- "deep cleaning" closure reason

## [0.5.0] - 2021-06-26

### Added

- Search by "next" modifier

### Changed

- Displayed a custom message when search keyword returns no results instead of searching on potentially gibberish keywords

## [0.4.1] - 2021-06-19

### Fixed

- Reworded "long-term renovation works" as "other works" for a more semantically correct closure reason

## [0.4.0] - 2021-06-19

### Added

- /language command with ZH language option

## [0.3.0] - 2021-06-08

### Changed

- Single-day closures will have a single date displayed instead of the format "{{startDate}} to {{endDate}}"
- Added temporal pronoun "yesterday"
- Temporal pronouns will be used whenever applicable

## [0.2.1] - 2021-06-07

### Fixed

- Closures occurring only today were not appearing in /list or being triggered in the daily notification

## [0.2.0] - 2021-05-28

### Added

- Notifications module

### Changed

- Updated all keyword filters to search by individual words in the keyword, and on both primary and secondary names
- /list will now correctly include present hawker centre closures instead of only considering future closure dates
- /list will now display "today" or "tomorrow" instead of the full dates

## [0.1.0] - 2021-05-13

### Added

- Production-ready version with search, favourites and feedback modules
