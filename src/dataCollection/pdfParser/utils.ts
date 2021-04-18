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
