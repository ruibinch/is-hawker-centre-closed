export function currentDate(): Date {
  return new Date(Date.now());
}

export function isWithinDateBounds(
  dateToCompare: Date,
  startDate: Date,
  endDate: Date,
) {
  return (
    dateToCompare.getTime() >= startDate.getTime() &&
    dateToCompare.getTime() <= endDate.getTime()
  );
}

// Returns in YYYY-MM format
export function getCurrentPeriod(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = padValueTo2Digits(`${date.getMonth() + 1}`);
  return `${year}-${month}`;
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

export function padValueTo2Digits(value: string): string {
  return `0${value}`.slice(-2);
}
