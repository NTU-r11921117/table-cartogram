import {
  partitionTriangle,
  area
} from './utils';

function columnSum(table) {
  const numberOfColumns = table[0].length;
  return table.reduce((sumRow, row) =>{
    return row.map((cell, index) => sumRow[index] + cell);
  }, new Array(numberOfColumns).fill(0));
}

function getSumOfAllValues(table) {
  const summedRows = table.map(row => row.reduce((sum, cell) => sum + cell, 0))
  return summedRows.reduce((acc, rowVal) => acc + rowVal, 0);
}

export function getSplitPoint(table) {
  const summedRows = table.map(row => row.reduce((sum, cell) => sum + cell, 0))
  const sumOfAllValues = getSumOfAllValues(table);

  let k = 0;
  let subSum = 0;
  while (subSum < sumOfAllValues / 2) {
    subSum += summedRows[k];
    k++;
  }
  return (k - 1);
}

export function getLambda(splitPoint, table) {
  const summedRows = table.map(row => row.reduce((sum, cell) => sum + cell, 0));
  const sumOfAllValues = getSumOfAllValues(table);
  let subSum = 0;
  for (let i = 0; i < splitPoint; i++) {
    subSum += summedRows[i];
  }

  return (sumOfAllValues / 2 - subSum) / summedRows[splitPoint];
}

export function getSplitTable(table) {
  const splitPoint = getSplitPoint(table);
  const lambda = getLambda(splitPoint, table);

  const tableTop = [];
  for (let i = 0; i < splitPoint; i++) {
    tableTop.push(table[i]);
  }
  const finalRow = table[splitPoint].map(val => lambda * val);
  tableTop.push(finalRow);

  const tableBottom = [];
  const topRow = table[splitPoint].map(val => (1 - lambda) * val);
  tableBottom.push(topRow);
  // these loop bounds seems wrong
  for (let i = (splitPoint + 1); i < table.length; i++) {
    tableBottom.push(table[i]);
  }
  return {tableTop, tableBottom}
}

function getAreas(left, right, containingTriangle, table, row) {
  // would it be more elegant to destroy the table as we walk down it?
  const beta = table[row][left] || 0;
  const gamma = table[row][right] || 0;
  const alpha = table.slice(row + 1).reduce((sum, row) => {
    return sum + (row[left] || 0) + (row[right] || 0)
  }, 0);

  const containingArea = area(containingTriangle);
  const triangleSum = alpha + beta + gamma;

  return {
    alpha: alpha * containingArea / triangleSum,
    beta: beta * containingArea / triangleSum,
    gamma: gamma * containingArea / triangleSum
  };
}

function deepCopyTable(table) {
  return table.reduce((acc, row) => acc.concat([row.slice(0)]), []);
}

function iterativelyGeneratePartitions(args) {
  const {left, right, points: initialPoints, subTable, isTop} = args;

  let currentPoints = initialPoints;
  let row = isTop ? 0 : 1;
  const partitions = []
  const tableCopy =  deepCopyTable(subTable);
  if (isTop) {
    tableCopy.reverse();
  }

  while (row < tableCopy.length) {
    console.log(row, isTop, tableCopy.length, currentPoints)
    const areas = getAreas(left, right, currentPoints, tableCopy, row);
    const partionedArea = partitionTriangle(currentPoints, areas);
    // console.log(partionedArea)
    // maybe use a concat instead?
    // now is the time to associate the value of the cells with the partitions
    // not accurately mapping value to table value?
    if (areas.beta) {
      partitions.push({vertices: partionedArea.beta, value: subTable[row][left]});
    }
    if (areas.gamma) {
      partitions.push({vertices: partionedArea.gamma, value: subTable[row][right]});
    }
    currentPoints = partionedArea.alpha;
    row = row + 1;
  }
  return partitions;
}

function generateBaseParition(tableTop, tableBottom, zigZag) {
  const m = tableTop[0].length;
  const zigZagUpperLeft = {x: 0, y: zigZag[1].y};
  const zigZagUpperRight = {x: zigZag[zigZag.length - 1].x, y: zigZag[1].y};
  // 0 and 1 are used in the proof bc the table is only mx2
  let partitions = [];
  // top
  for (let j = 1; j <= Math.floor(m / 2 + 1); j++) {
  // for (let j = Math.floor(m / 2 + 1); j >= 1; j--) {
    const left = (2 * j - 1) - 1;
    const right = (2 * j - 2) - 1;

    let points = [
      zigZag[2 * j - 2],
      zigZag[2 * j - 3] || zigZagUpperLeft,
      zigZag[2 * j - 1] || zigZagUpperRight
    ];
    partitions = partitions.concat(
      iterativelyGeneratePartitions({
        left,
        right,
        points,
        subTable: tableTop,
        isTop: true
      })
    );
  }
  // bottom
  for (let l = 1; l <= Math.ceil(m / 2); l++) {
    const left = (2 * l) - 1;
    const right = (2 * l - 1) - 1;
    let points = [
      zigZag[2 * l - 1],
      zigZag[2 * l - 2] || zigZagUpperLeft,
      zigZag[2 * l] || zigZagUpperRight
    ];
    partitions = partitions.concat(
      iterativelyGeneratePartitions({
        left,
        right,
        points,
        subTable: tableBottom,
        isTop: false
      })
    );
  }

  return partitions;

}

export function generateZigZag(table, tableTop, tableBottom, height) {
  const m = tableTop[0].length;
  // build column sums
  const Dt = [];
  const columnSumTop = columnSum(tableTop);
  for (let j = 1; j < Math.floor(m / 2 + 1); j++) {
    Dt.push((columnSumTop[(2 * j - 2) - 1] || 0) + (columnSumTop[(2 * j - 1) - 1] || 0));
  }
  const columnSumBottom = columnSum(tableBottom);
  const Db = [];
  for (let l = 1; l < Math.ceil(m / 2); l++) {
    Db.push((columnSumBottom[(2 * l - 1) - 1] || 0) + (columnSumBottom[(2 * l) - 1] || 0));
  }
  // generate zigzag
  const zigZag = [{x: 0, y: 0}];
  const summedDt = Dt.reduce((row, val) => row.concat((row[row.length - 1] || 0) + val), []);
  const summedDb = Db.reduce((row, val) => row.concat((row[row.length - 1] || 0) + val), []);
  // remember, reverse is mutatation
  summedDt.reverse();
  summedDb.reverse();
  while (summedDt.length || summedDb.length) {
    if (summedDt.length) {
      zigZag.push({x: summedDt.pop(), y: height});
    }
    if (summedDb.length) {
      zigZag.push({x: summedDb.pop(), y: 0});
    }
  }
  zigZag.push({x: getSumOfAllValues(table) / 2, y: m % 2 ? height : 0});
  return zigZag;
}

// use for convexification
export function generateZigZagPrime(table, zigZag) {
  const sumOfAllValues = getSumOfAllValues(table);
  const tableMin = table.reduce((acc, row) => row.reduce((mem, cell) => Math.min(mem, cell), acc), Infinity);
  const convexifyValue = 2 * tableMin / sumOfAllValues;
  return zigZag.map(({x, y}, index) => ({x, y: y + (index % 2 ? -1 : 1) * convexifyValue}));
}

export default function() {
  var height = 1;
  var width = 1;

  function tableCartogram(table) {
    // begin by determining the split point for the table
    // (known as k and lambda in the paper, splitPoint and lambda here)
    // const summedRows = table.map(row => row.reduce((sum, cell) => sum + cell, 0))
    // sumOfAllValues is also known as S
    // TODO: paper notes this must be at least 4 check in later
    const {tableTop, tableBottom} = getSplitTable(table);
    const zigZag = generateZigZag(table, tableTop, tableBottom, height);
    const partitions = generateBaseParition(tableTop, tableBottom, zigZag);
    return partitions;
  }

  tableCartogram.size = function(x) {
    // stolen from d3, so check in on that
    return arguments.length ? (width = +x[0], height = +x[1], tableCartogram) : [width, height];
  };

  // TODO padding?
  // TODO steal other d3 args

  return tableCartogram;
}
