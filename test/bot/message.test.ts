/* eslint-disable max-len */
import { makeMessage } from '../../src/bot/message';
import { ClosureReason, Result } from '../../src/dataCollection/types';
import { SearchModifier } from '../../src/reader/types';

describe('bot > message', () => {
  describe('returns an empty results array', () => {
    const results = [];

    it.each([
      [
        'keyword defined, modifier "today"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.today,
          },
          expected: {
            message: `All good\\! No hawker centres containing the keyword *littleroot* are undergoing cleaning today\\.`,
          },
        },
      ],
      [
        'keyword defined, modifier "tomorrow"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.tomorrow,
          },
          expected: {
            message: `All good\\! No hawker centres containing the keyword *littleroot* will be undergoing cleaning tomorrow\\.`,
          },
        },
      ],
      [
        'keyword defined, modifier "month"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.month,
          },
          expected: {
            message: `All good\\! No hawker centres containing the keyword *littleroot* are undergoing cleaning this month\\.`,
          },
        },
      ],
      [
        'keyword defined, modifier "nextMonth"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.nextMonth,
          },
          expected: {
            message: `All good\\! No hawker centres containing the keyword *littleroot* will be undergoing cleaning next month\\.`,
          },
        },
      ],
      [
        'keyword empty, modifier "today"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.today,
          },
          expected: {
            message: `All good\\! No hawker centres are undergoing cleaning today\\.`,
          },
        },
      ],
      [
        'keyword empty, modifier "tomorrow"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.tomorrow,
          },
          expected: {
            message: `All good\\! No hawker centres will be undergoing cleaning tomorrow\\.`,
          },
        },
      ],
      [
        'keyword empty, modifier "month"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.month,
          },
          expected: {
            message: `All good\\! No hawker centres are undergoing cleaning this month\\.`,
          },
        },
      ],
      [
        'keyword empty, modifier "nextMonth"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.nextMonth,
          },
          expected: {
            message: `All good\\! No hawker centres will be undergoing cleaning next month\\.`,
          },
        },
      ],
    ])(
      '%s',
      (
        testName,
        {
          inputs: { keyword, modifier },
          expected: { message: expectedMessage },
        },
      ) => {
        const message = makeMessage({
          results,
          params: {
            keyword,
            modifier,
          },
        });

        expect(message).toEqual(expectedMessage);
      },
    );
  });

  describe('returns a defined results array', () => {
    const results: Result[] = [
      {
        id: '111',
        hawkerCentreId: 1,
        reason: ClosureReason.cleaning,
        name: 'Littleroot Town',
        startDate: '2021-01-01',
        endDate: '2021-01-02',
      },
      {
        id: '111',
        hawkerCentreId: 5,
        reason: ClosureReason.cleaning,
        name: 'Melville City',
        startDate: '2021-01-01',
        endDate: '2021-01-04',
      },
    ];

    const makeResultsSection = () =>
      `*Littleroot Town*\n01\\-Jan to 02\\-Jan\n\n` +
      `*Melville City*\n01\\-Jan to 04\\-Jan\n\n`;

    it.each([
      [
        'keyword defined, modifier "today"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.today,
          },
          expected: {
            message: `Here are the hawker centres containing the keyword *littleroot* that are closed today:\n\n`,
          },
        },
      ],
      [
        'keyword defined, modifier "tomorrow"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.tomorrow,
          },
          expected: {
            message: `Here are the hawker centres containing the keyword *littleroot* that will be closed tomorrow:\n\n`,
          },
        },
      ],
      [
        'keyword defined, modifier "month"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.month,
          },
          expected: {
            message: `Here are the hawker centres containing the keyword *littleroot* that are closed this month:\n\n`,
          },
        },
      ],
      [
        'keyword defined, modifier "nextMonth"',
        {
          inputs: {
            keyword: 'littleroot',
            modifier: SearchModifier.nextMonth,
          },
          expected: {
            message: `Here are the hawker centres containing the keyword *littleroot* that will be closed next month:\n\n`,
          },
        },
      ],
      [
        'keyword empty, modifier "today"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.today,
          },
          expected: {
            message: `There are *2* hawker centres that are closed today:\n\n`,
          },
        },
      ],
      [
        'keyword empty, modifier "tomorrow"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.tomorrow,
          },
          expected: {
            message: `There are *2* hawker centres that will be closed tomorrow:\n\n`,
          },
        },
      ],
      [
        'keyword empty, modifier "month"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.month,
          },
          expected: {
            message: `There are *2* hawker centres that are closed this month:\n\n`,
          },
        },
      ],
      [
        'keyword empty, modifier "nextMonth"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.nextMonth,
          },
          expected: {
            message: `There are *2* hawker centres that will be closed next month:\n\n`,
          },
        },
      ],
    ])(
      '%s',
      (
        testName,
        {
          inputs: { keyword, modifier },
          expected: { message: expectedMessage },
        },
      ) => {
        const message = makeMessage({
          results,
          params: {
            keyword,
            modifier,
          },
        });

        expect(message).toEqual(`${expectedMessage}${makeResultsSection()}`);
      },
    );
  });

  describe('exception cases', () => {
    it('display a custom message if search modifier is nextMonth and isDataPresent is false', () => {
      const message = makeMessage({
        results: [],
        params: {
          keyword: '',
          modifier: SearchModifier.nextMonth,
        },
        isDataPresent: false,
      });

      expect(message).toEqual(
        `No data is available for next month yet, check back again in a while\\!`,
      );
    });
  });
});
