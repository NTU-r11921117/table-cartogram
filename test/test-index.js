import tape from 'tape';
import {
  default as tableCartogram,
  getSplitPoint,
  getLambda,
  getSplitTable,
  generateZigZag,
  generateZigZagPrime
} from '../second-pass';

// import {
//   default as tableCartogramFirstPass,
// } from '../index';

import {
  area,
  findEquidistantPoints,
  partitionTriangle,
  round,
  generatePolygon
} from '../utils';

var EXAMPLE_TABLE = [
  [2, 3, 2, 4],
  [3, 9, 3, 7],
  [2, 3, 4, 9],
  [3, 2, 2, 3]
];

// const BLACK_AND_WHITE_TABLE = [
//   [4.5, 4.5, 16, 2.5],
//   [4, 3, 4.5, 3],
//   [2.5, 6, 4.5, 10.5],
//   [7, 9, 9, 6]
// ];

tape("tableCartogram ", function(t) {
  t.equal(typeof tableCartogram, 'function', 'should correctly find a function');
  t.end();
});


// tape("tableCartogram - size", function(t) {
//   var cartogram = tableCartogram();
//   var initialSize = cartogram.size();
//   t.deepEqual(initialSize, [1, 1], 'should find the correct defaults');
//   cartogram.size([10, 10]);
//   t.deepEqual(cartogram.size(), [10, 10], 'should save the set size values');
//   t.end();
// });
//
tape("tableCartogram helper functions", function(t) {
  t.equal(getSplitPoint(EXAMPLE_TABLE), 1, 'getSplitPoint should return correct split point');
  t.equal(getLambda(1, EXAMPLE_TABLE), 0.8863636363636364, 'getLambda should get the correct value for the example split point and table');

  const {tableTop, tableBottom} = getSplitTable(EXAMPLE_TABLE);
  const expectedTop = [
    [2, 3, 2, 4],
    [2.659090909090909, 7.9772727272727275, 2.659090909090909, 6.204545454545454]
  ];
  t.deepEqual(tableTop, expectedTop, 'should find the correct table top');
  const expectedBottom = [
    [0.34090909090909094, 1.022727272727273, 0.34090909090909094, 0.7954545454545455],
    [2, 3, 4, 9],
    [3, 2, 2, 3]
  ];
  t.deepEqual(tableBottom, expectedBottom, 'should find the correct table bottom');
  const EXPECTED_ZIG_ZAP =  [
    {x: 0, y: 0},
    {x: 4.659090909090909, y: 1},
    {x: 11.363636363636363, y: 0},
    {x: 20.295454545454547, y: 1},
    {x: 30.5, y: 0}
  ];
  const zigZag = generateZigZag(EXAMPLE_TABLE, tableTop, tableBottom, 1);
  t.deepEqual(zigZag, EXPECTED_ZIG_ZAP, 'should find the correct zigzag');

  const zigZagPrime = generateZigZagPrime(EXAMPLE_TABLE, zigZag);
  const EXPECTED_ZIG_ZAP_PRIME = [
    {x: 0, y: 0.06557377049180328},
    {x: 4.659090909090909, y: 0.9344262295081968},
    {x: 11.363636363636363, y: 0.06557377049180328},
    {x: 20.295454545454547, y: 0.9344262295081968},
    {x: 30.5, y: 0.06557377049180328}
  ];
  t.deepEqual(zigZagPrime, EXPECTED_ZIG_ZAP_PRIME, 'generateZigZagPrime should return the correct zig zag prime');
  t.end();
});



var EXPECTED_CARTOGRAM_EXAMPLE_TABLE = [
  [
    {value: 2, vertices: [{x: 0, y: 0}]},
    {value: 3, vertices: [{x: 0, y: 0}]},
    {value: 2, vertices: [{x: 0, y: 0}]},
    {value: 4, vertices: [{x: 0, y: 0}]}
  ], [
    {value: 3, vertices: [{x: 0, y: 0}]},
    {value: 9, vertices: [{x: 0, y: 0}]},
    {value: 3, vertices: [{x: 0, y: 0}]},
    {value: 7, vertices: [{x: 0, y: 0}]}
  ], [
    {value: 2, vertices: [{x: 0, y: 0}]},
    {value: 3, vertices: [{x: 0, y: 0}]},
    {value: 4, vertices: [{x: 0, y: 0}]},
    {value: 9, vertices: [{x: 0, y: 0}]}
  ], [
    {value: 3, vertices: [{x: 0, y: 0}]},
    {value: 2, vertices: [{x: 0, y: 0}]},
    {value: 2, vertices: [{x: 0, y: 0}]},
    {value: 3, vertices: [{x: 0, y: 0}]}]
];

function countCells(table) {
  return table.reduce((sum, row) => sum + row.length, 0);
}

function sumCells(table) {
  return table.reduce((sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0), 0);
}

function sumArea(cartogram) {
  return cartogram.reduce((sum, cell) => sum + area(cell.vertices), 0);
}

const fs = require('fs');

tape("tableCartogram - size", function(t) {
  var cartogram = tableCartogram();
  var mappedTable = cartogram(EXAMPLE_TABLE);
  fs.writeFile('../react-vis/showcase/misc/triangles.json', JSON.stringify(mappedTable), 'utf8', (err) => {
    /* eslint-disable no-console */
    if (err) {
      console.log(err);
    } else {
      console.log('complete');
    }
    /* eslint-enable no-console */
  });
  t.deepEqual(mappedTable, EXPECTED_CARTOGRAM_EXAMPLE_TABLE, 'should find modified and updated table')

  const numberOfCells = countCells(EXAMPLE_TABLE);
  const foundNumberOfCells = mappedTable.length;
  t.equal(numberOfCells, foundNumberOfCells, 'should find the correct number of cells');

  t.ok(mappedTable.every(cell => area(cell.vertices) > 0), 'all cells should have a non trivial area');
  // TODO ADD STRONGER TEST THAT CHECKS THE AREA OF EVERY CELL RELATIVE TO THE WHOLE
  // TODO GOTTA FIX UP THE WIDTH CONTROL
  const HEIGHT = 1;
  t.equal(sumArea(mappedTable), sumCells(EXAMPLE_TABLE) / 2 * HEIGHT, 'should find the summed area to be correct');

  t.end();
});

tape("findEquidistantPoints", function(t) {
  const xIntleft = {x: 0, y: 0};
  const xIntright = {x: 1, y: 0};
  const xIntExpectedPoints = [
    {x: 0, y: 0},
    {x: 0.25, y: 0},
    {x: 0.5, y: 0},
    {x: 0.75, y: 0},
    {x: 1, y: 0}
  ]
  t.deepEqual(findEquidistantPoints(xIntleft, xIntright, 5), xIntExpectedPoints, 'should find the correct points for x interpolation');

  const yIntleft = {x: 0, y: 1};
  const yIntright = {x: 0, y: 0};
  const yIntExpectedPoints = [
    {x: 0, y: 1},
    {x: 0, y: 0.75},
    {x: 0, y: 0.5},
    {x: 0, y: 0.25},
    {x: 0, y: 0}
  ];
  t.deepEqual(findEquidistantPoints(yIntleft, yIntright, 5), yIntExpectedPoints, 'should find the correct points for y interpolation');

  const left = {x: 0, y: 1};
  const right = {x: 1, y: 0};
  const expectedPoints = [
    {x: 0, y: 1},
    {x: 0.25, y: 0.75},
    {x: 0.5, y: 0.5},
    {x: 0.75, y: 0.25},
    {x: 1, y: 0}
  ];
  t.deepEqual(findEquidistantPoints(left, right, 5), expectedPoints, 'should find the correct points for diagonal interpolation');

  t.end();
});

tape("area", function(t) {
  const SQUARE = [
    {x: 10, y: 10},
    {x: 20, y: 10},
    {x: 20, y: 20},
    {x: 10, y: 20}
  ];
  t.equal(area(SQUARE), 100, 'should find the correct area for a square');

  const TRIANGLE = [
    {x: 10, y: 10},
    {x: 20, y: 10},
    {x: 20, y: 20}
  ];
  t.equal(area(TRIANGLE), 50, 'should find the correct area for a triangle');

  const POLYGON = generatePolygon(5, 10, {x: 10, y: 15});
  t.equal(area(POLYGON), 237.76412907378844, 'should find the correct area for a polygon');
  t.end();
});



tape("partitionTriangle - Equal Partition", function(t) {
  const equilateral = generatePolygon(3, 5, {x: 10, y: 10});
  const equalArea = area(equilateral) / 3;
  const partitions = partitionTriangle(equilateral, {alpha: equalArea, beta: equalArea, gamma: equalArea});
  ['alpha', 'beta', 'gamma'].forEach(areaSector => {
    const foundArea = round(area(partitions[areaSector]));
    const predictedarea = round(equalArea);
    t.equal(foundArea, predictedarea, `should find the correct ${areaSector} partition for an equal partition`);
  });

  t.end();
});

tape("partitionTriangle - Unequal Partition", function(t) {
  const equilateral = generatePolygon(3, 5, {x: 10, y: 10});
  const totalArea = area(equilateral);
  const areas = {
    alpha: totalArea * 0.7,
    beta: totalArea * 0.2,
    gamma: totalArea * 0.1
  }
  const partitions = partitionTriangle(equilateral, areas);

  ['alpha', 'beta', 'gamma'].forEach(areaSector => {
    const foundArea = round(area(partitions[areaSector]));
    const predictedarea = round(areas[areaSector]);
    t.equal(foundArea, predictedarea, `should find the correct ${areaSector} partition for an unequal partition`);
  });

  t.end();
});

tape("partitionTriangle - Real triangle example", function(t) {
  const triangle = [
    {x: 4.659090909090909, y: 1},
    {x: 0, y: 0},
    {x: 11.363636363636363, y: 0}
  ].map(({x, y}) => ({x: x + 10, y: y + 10}));
  const totalArea = area(triangle);
  const areas = {
    alpha: 4.305166199439327,
    beta: 0.8259911894273129,
    gamma: 0.5506607929515418
  }
  const partitions = partitionTriangle(triangle, areas);
  ['alpha', 'beta', 'gamma'].forEach(areaSector => {
    const foundArea = round(area(partitions[areaSector]));
    const predictedarea = round(areas[areaSector]);
    t.equal(foundArea, predictedarea, `should find the correct ${areaSector} partition for a real partition`);
  });
  const sumFoundArea = ['alpha', 'beta', 'gamma'].reduce((sum, key) => sum + area(partitions[key]), 0);
  t.equal(round(sumFoundArea), round(totalArea), 'should find the correct total area');

  t.end();
});
