/* eslint-disable max-len */
import { makeMessage } from '../../src/bot/message';
import { Result } from '../../src/parser/types';
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
        id: '1111111111',
        hawkerCentre: 'Littleroot Town',
        startDate: '2021-01-01',
        endDate: '2021-01-02',
      },
      {
        id: '1111111111',
        hawkerCentre: 'Melville City',
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
        'keyword empty, modifier "today"',
        {
          inputs: {
            keyword: '',
            modifier: SearchModifier.today,
          },
          expected: {
            message: `Here are the hawker centres that are closed today:\n\n`,
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
            message: `Here are the hawker centres that are closed this month:\n\n`,
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
});
