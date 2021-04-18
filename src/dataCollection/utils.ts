import Hashes from 'jshashes';

export function generateHash(...inputs: string[]): string {
  return new Hashes.SHA1().hex(inputs.join(''));
}
