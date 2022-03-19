import { isAfter, isBefore, parseISO } from 'date-fns';

import { Feedback } from '../models/Feedback';
import { Input } from '../models/Input';
import { User } from '../models/User';
import { getDateIgnoringTime } from '../utils/date';

export function filterInputByUserId(input: Input, userId: number | undefined) {
  return userId === undefined || userId === input.userId;
}

export function filterItemsByDate(
  input: Feedback | Input,
  fromDate: string | undefined,
  toDate: string | undefined,
) {
  const inputCreatedDate = parseISO(getDateIgnoringTime(input.createdAt));

  if (fromDate) {
    const _fromDate = parseISO(fromDate);
    if (isBefore(inputCreatedDate, _fromDate)) {
      return false;
    }
  }
  if (toDate) {
    const _toDate = parseISO(toDate);
    if (isAfter(inputCreatedDate, _toDate)) {
      return false;
    }
  }

  return true;
}

export function filterUserByUserId(user: User, userId: number | undefined) {
  return userId === undefined || userId === user.userId;
}
