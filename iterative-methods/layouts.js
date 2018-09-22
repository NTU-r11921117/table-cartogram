import {findSumForTable, translateTableToVector} from './utils';
import {
  computeHessian,
  trace
} from './math.js';

function psuedoCartogramLayout(numRows, numCols, colSums, rowSums, total) {
  return [...new Array(numCols + 1)].map((i, y) => {
    return [...new Array(numRows + 1)].map((j, x) => ({
      x: x ? (colSums[x - 1] / total) : 0,
      y: y ? (rowSums[y - 1] / total) : 0
    }));
  });
}

function psuedoCartogramLayoutZigZag(numRows, numCols, colSums, rowSums, total) {
  return [...new Array(numCols + 1)].map((i, y) => {
    return [...new Array(numRows + 1)].map((j, x) => ({
      x: (x ? (colSums[x - 1] / total) : 0) + (0.025 / numRows) * (y % 2 ? -1 : 1),
      y: (y ? (rowSums[y - 1] / total) : 0) + (0.025 / numCols) * (x % 2 ? -1 : 1)
    }));
  });
}

function partialPsuedoCartogram(numRows, numCols, colSums, rowSums, total) {
  return [...new Array(numCols + 1)].map((i, y) => {
    return [...new Array(numRows + 1)].map((j, x) => ({
      x: (x ? (colSums[x - 1] / total) : 0),
      y: y / numCols
    }));
  });
}

function buildZigZag(xAmount, yAmount) {
  return (numRows, numCols, colSums, rowSums, total) => {
    return [...new Array(numCols + 1)].map((i, y) => {
      return [...new Array(numRows + 1)].map((j, x) => ({
        x: x / numRows + (xAmount / numRows) * (y % 2 ? -1 : 1),
        y: y / numCols + (yAmount / numCols) * (x % 2 ? -1 : 1)
      }));
    });
  };
}

const gridLayout = buildZigZag(0, 0);
const zigZagOnX = buildZigZag(0.5, 0);
const zigZagOnY = buildZigZag(0, 0.5);
const zigZagOnXY = buildZigZag(0.25, 0.25);

const layouts = {
  gridLayout,
  zigZagOnX,
  zigZagOnY,
  zigZagOnXY,
  psuedoCartogramLayout,
  psuedoCartogramLayoutZigZag,
  partialPsuedoCartogram
};

// use the indexes of the auto generated arrays for positioning
export function generateInitialTable(numCols, numRows, table, objFunc, layout) {
  const rowSums = table.map(row => findSumForTable([row]));
  const tableTranspose = table[0].map((col, i) => table.map(row => row[i]));
  const colSums = tableTranspose.map(row => findSumForTable([row]));
  for (let i = 1; i < rowSums.length; i++) {
    rowSums[i] += rowSums[i - 1];
  }
  for (let i = 1; i < colSums.length; i++) {
    colSums[i] += colSums[i - 1];
  }
  const total = findSumForTable(table);

  const layoutMethod = layouts[layout];
  if (layoutMethod) {
    const builtLayout = layoutMethod(numRows, numCols, colSums, rowSums, total);
    return builtLayout;
  }

  const layoutKeys = Object.keys(layouts);
  const constructedLayouts = layoutKeys.map(key =>
    layouts[key](numRows, numCols, colSums, rowSums, total));
  const measurements = constructedLayouts.reduce((acc, newTable, idx) => {
    const currentVec = translateTableToVector(newTable);

    const hesstianTrace = layout === 'pickBestHessian' ?
      Math.abs(trace(computeHessian(objFunc, currentVec, 0.001))) : 0;
    if (layout === 'pickBestHessian' && acc.bestScore > hesstianTrace) {
      return {
        bestIndex: idx,
        bestScore: hesstianTrace
      };
    }

    const newScore = objFunc(currentVec);
    if (layout === 'pickBest' ? (acc.bestScore > newScore) : (acc.bestScore < newScore)) {
      return {
        bestIndex: idx,
        bestScore: newScore
      };
    }

    return acc;
  }, {bestIndex: -1, bestScore: layout === 'pickWorst' ? -Infinity : Infinity});
  console.log(layout, Object.keys(layouts)[measurements.bestIndex]);
  return constructedLayouts[measurements.bestIndex];
}
