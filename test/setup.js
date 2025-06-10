const fetch = require('cross-fetch');
const { ReadableStream } = require('stream/web');

global.fetch = fetch;
global.ReadableStream = ReadableStream;
