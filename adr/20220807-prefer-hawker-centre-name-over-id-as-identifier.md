# Prefer hawker centre name over hawker centre ID as identifier

## Discussion

The `HawkerCentre` model contains the following props:

- `hawkerCentreId`
- `address`
- `name`
- `nameSecondary`
- `keywords`

`hawkerCentreId` was used as a unique identifier for a hawker centre, so a user's saved favourites would be stored using the `hawkerCentreId` value.

```ts
// src/models/User.ts

export type UserFavourite = {
  hawkerCentreId: number;
  dateAdded: string;
};
```

However, it turns out that `hawkerCentreId` is **not unique**. Instead, it is simply more of an index in the list of hawker centres when sorted by alphabetical order.

This resulted in an issue where a new hawker centre was added - _Fernvale Hawker Centre and Market_ - with the ID 46, resulting in hawker centres with a previous ID of 46 onwards being pushed down by one.

```
// Old
46: Geylang Bahru Blk 69
47: Geylang Serai Market
48: Ghim Moh Road Blk 2
49: Golden Mile Food Centre

// New
46: Fernvale Hawker Centre and Market
47: Geylang Bahru Blk 69
48: Geylang Serai Market
49: Ghim Moh Road Blk 2
50: Golden Mile Food Centre
```

Since user favourites are stored using `hawkerCentreId`, they are no longer accurate for hawker centres with an ID of 46 and greater.

## Solution

A quick interim fix would be to use the hawker centre name as the unique identifier. So, the `UserFavourite` type would be updated to:

```ts
// src/models/User.ts

export type UserFavourite = {
  hawkerCentreName: string;
  dateAdded: string;
};
```

This is not a foolproof solution either as the hawker centre name could also change.

A full-fledged solution would be to utilise the postal code of the hawker centre. This should be sufficient for the use cases of the hawker centre ID.

## Migration plan

1. Manually update DynamoDB user favourites to use hawker centre names over IDs

- As of 2022-08-07, there are 34 users in the DB
- Hence it is possibly more straightforward to perform this update manually instead of writing a script
- **Important note**: for entries with `hawkerCentreId >= 46`, we should migrate it to the name corresponding to `hawkerCentreId + 1`

1. Update the code implementation to utilise hawker centre name instead of ID
1. Consider adding a `postalCode` prop to the `HawkerCentre` model in the future, so that it can be used as a more full-fledged identifier
