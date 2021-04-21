import Hashes from 'jshashes';

import { Dimensions } from './types';

export function isBlank(s: string): boolean {
  return s.trim().length === 0;
}

export function isBoxesFullyOverlapping(
  parent: Dimensions,
  child: Dimensions,
): boolean {
  const parentTopLeft = [parent.x, parent.y];
  const parentBottomRight = [parent.x + parent.width, parent.y + parent.height];
  const childTopLeft = [child.x, child.y];
  const childBottomRight = [child.x + child.width, child.y + child.height];

  return (
    parentTopLeft[0] < childTopLeft[0] &&
    parentTopLeft[1] < childTopLeft[1] &&
    parentBottomRight[0] > childBottomRight[0] &&
    parentBottomRight[1] > childBottomRight[1]
  );
}

export function generateHash(...inputs: string[]): string {
  return new Hashes.SHA1().hex(inputs.join(''));
}

export function getMonthNumber(monthName: string): string | null {
  switch (monthName) {
    case 'Jan':
    case 'January':
      return '01';
    case 'Feb':
    case 'February':
      return '02';
    case 'Mar':
    case 'March':
      return '03';
    case 'Apr':
    case 'April':
      return '04';
    case 'May':
      return '05';
    case 'Jun':
    case 'June':
      return '06';
    case 'Jul':
    case 'July':
      return '07';
    case 'Aug':
    case 'August':
      return '08';
    case 'Sep':
    case 'September':
      return '09';
    case 'Oct':
    case 'October':
      return '10';
    case 'Nov':
    case 'November':
      return '11';
    case 'Dec':
    case 'December':
      return '12';
    default:
      return null;
  }
}
