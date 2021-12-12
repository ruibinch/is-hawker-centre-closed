// @ts-nocheck
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { padValueTo2Digits } from '../../src/common/date';
import {
  ColHeader,
  Dimensions,
  TextBox,
  TextContentItem,
  Closure,
} from './types';
import {
  generateHash,
  getMonthNumber,
  isBlank,
  isBoxesFullyOverlapping,
} from './utils';

const COL_NAMES = ['No', 'Market / Hawker Centre', 'Start Date', 'End Date'];
const COL_HEADERS: ColHeader[] = ['no', 'hawkerCentre', 'startDate', 'endDate'];
const COL_BUFFERS: Record<ColHeader, number> = {
  no: 5,
  hawkerCentre: 20,
  startDate: 10,
  endDate: 10,
};
const ROW_BUFFER = 10;

export function renderPage(pageData): string {
  const renderOptions = {
    normalizeWhitespace: false,
    disableCombineTextItems: true,
  };

  const { pageIndex, pageInfo } = pageData;
  const [, , pageWidth, pageHeight] = pageInfo.view;

  return pageData.getTextContent(renderOptions).then((textContent) => {
    const textBoxes = (() => {
      const _textBoxes: TextBox[] = [];

      textContent.items.forEach((item: TextContentItem) => {
        const { str, width, height } = item;
        const [, , , , x, y] = item.transform;

        _textBoxes.push({
          text: str,
          width,
          height,
          x,
          y: pageHeight - y + pageIndex * pageHeight,
        });
      });

      return _textBoxes;
    })();

    const headerBoxes = textBoxes.filter(({ text }) =>
      COL_NAMES.includes(text),
    );
    const colRanges = calcColRanges(headerBoxes, pageHeight, pageIndex);
    const cols = parseCols(textBoxes, colRanges);
    const rowRanges = calcRowRanges(cols.no, pageWidth);
    const rowsRaw = parseRows(cols, rowRanges);
    const rows = packageIntoResult(rowsRaw);

    return JSON.stringify(rows);
  });
}

/**
 * Returns a list of rectangles corresponding to each column range.
 */
function calcColRanges(
  tableHeaderBoxes: TextBox[],
  pageHeight: number,
  pageIndex: number,
): Record<ColHeader, Dimensions> {
  const colRanges = tableHeaderBoxes.reduce(
    (_colRanges: { [header in ColHeader]?: Dimensions }, headerBox, idx) => {
      const colHeader = COL_HEADERS[idx];
      _colRanges[colHeader] = {
        x: headerBox.x - COL_BUFFERS[colHeader],
        y: headerBox.y,
        width: headerBox.width + COL_BUFFERS[colHeader] * 2,
        height: pageHeight * (pageIndex + 1) - headerBox.y,
      };
      return _colRanges;
    },
    {},
  );

  return colRanges as Record<ColHeader, Dimensions>;
}

/**
 * For each column header, find the list of boxes that fall into its column range.
 */
function parseCols(
  textBoxes: TextBox[],
  colRanges: Record<ColHeader, Dimensions>,
): Record<ColHeader, TextBox[]> {
  const cols = Object.entries(colRanges).reduce(
    (_cols: { [header in ColHeader]?: TextBox[] }, colInfo) => {
      const [colHeader, colDims] = colInfo;

      _cols[colHeader] = textBoxes.filter((textBox) =>
        isBoxesFullyOverlapping(colDims, textBox),
      );
      return _cols;
    },
    {},
  );

  return cols as Record<ColHeader, TextBox[]>;
}

/**
 * Returns a list of rectangles corresponding to each row range.
 */
function calcRowRanges(indexCol: TextBox[], pageWidth: number): Dimensions[] {
  const indexColEntries = indexCol.filter((entry) => !isBlank(entry.text));
  return indexColEntries.map((indexEntry) => ({
    x: indexEntry.x,
    y: indexEntry.y - ROW_BUFFER,
    width: pageWidth - indexEntry.x,
    height: indexEntry.height + ROW_BUFFER * 2,
  }));
}

/**
 * For each row, find the list of boxes that fall into the row range.
 * Then, split the row values into columns.
 */
function parseRows(
  cols: Record<ColHeader, TextBox[]>,
  rowRanges: Dimensions[],
): Record<string, TextBox[]>[] {
  const makeFilterTextBoxes = (rowRange: Dimensions) => (
    textBoxes: TextBox[],
  ) =>
    textBoxes.filter((textBox) => isBoxesFullyOverlapping(rowRange, textBox));

  const rowsRaw: Record<string, TextBox[]>[] = rowRanges.map((rowRange) => {
    const filterTextBoxes = makeFilterTextBoxes(rowRange);
    return {
      hawkerCentre: filterTextBoxes(cols.hawkerCentre),
      startDate: filterTextBoxes(cols.startDate),
      endDate: filterTextBoxes(cols.endDate),
    };
  });
  return rowsRaw;
}

/**
 * Packages into the appropriate structure to be returned:
 * - Cleans texts
 *   - Combines the text values for the boxes in each row/col and removes whitespace
 *   - Converts the dates to ISO8601 format
 * - Adds a SHA1-hash ID to prevent duplicate entries from being saved
 */
function packageIntoResult(rowsRaw: Record<string, TextBox[]>[]): Closure[] {
  const cleanTextInRow = (row: TextBox[], isDate = false) => {
    const texts = row.map((entry) => entry.text);
    let text = texts.join('').trim();

    if (isDate) {
      text = (() => {
        const [day, month, year] = text.split(' ');
        return `${year}-${getMonthNumber(month)}-${padValueTo2Digits(day)}`;
      })();
    }
    return text;
  };

  const results = rowsRaw.map((row) => {
    const hawkerCentre = cleanTextInRow(row.hawkerCentre);
    const startDate = cleanTextInRow(row.startDate, true);
    const endDate = cleanTextInRow(row.endDate, true);
    const id = generateHash(hawkerCentre, startDate, endDate);

    return { id, hawkerCentre, startDate, endDate };
  });

  // remove any duplicate results
  // this might happen as some index cols get parsed as 2 separate digits, e.g. row 17 is split into "1" and "7"
  // then, it creates identical row ranges which results in duplicate rows
  const resultsDeduplicated = results.filter(
    (result, idx, self) =>
      self.findIndex((result2) => result.id === result2.id) === idx,
  );
  return resultsDeduplicated;
}
