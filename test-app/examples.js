import ZionVisitors from '../test/zion-visitors';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ZION_VISITORS = ZionVisitors.map(year => MONTHS.map(month => year[month])).slice(5);

// EXAMPLES FROM PAPER
const USA_USA_USA = [
  [6.725, 0.989, 0.673, 5.304, 5.687, 19.378, 0.626, 1.328],
  [3.831, 1.568, 0.814, 3.046, 9.884, 12.702, 1.316, 6.548],
  [2.701, 0.564, 1.826, 12.831, 6.484, 11.537, 3.574, 1.053],
  [2.764, 5.029, 2.853, 5.989, 4.339, 1.853, 5.774, 8.792],
  [37.254, 2.059, 3.751, 2.916, 6.346, 4.625, 8.001, 0.898],
  [6.392, 25.146, 4.533, 2.967, 4.78, 9.688, 18.801, 9.535]
];

const EXAMPLE_TABLE = [
  [2, 3, 2, 4],
  [3, 9, 3, 7],
  [2, 3, 4, 9],
  [3, 2, 2, 3]
];

const BLACK_AND_WHITE_TABLE = [
  [4.5, 4.5, 16, 2.5],
  [4, 3, 4.5, 3],
  [2.5, 6, 4.5, 10.5],
  [7, 9, 9, 6]
];

// PROGRAMATICALLY GENERATED EXAMPLES
const checkerBoardGenerator = (width, height, high, low, offset = 0) =>
  [...new Array(height)].map((_, ydx) =>
    [...new Array(width)].map((d, xdx) => (xdx + (ydx % 2) + offset) % (2) ? high : low));

const ramp = (width, height) => checkerBoardGenerator(width, height, 1, 1)
  .map((row, jdx) => row.map((d, idx) => jdx * width + idx + 1));

const oneByOnesUpper2 = checkerBoardGenerator(4, 4, 1, 1);
oneByOnesUpper2[1][1] = 2;
const oneByOnesLower2 = checkerBoardGenerator(4, 4, 1, 1);
oneByOnesLower2[2][2] = 2;
const ONE_BYS = checkerBoardGenerator(4, 4, 1, 1);
ONE_BYS[2][2] = 5;

const BIG_TOP = checkerBoardGenerator(3, 2, 1, 1);
BIG_TOP[0][0] = 20;
BIG_TOP[0][2] = 20;
const BIG_BOTTOM = checkerBoardGenerator(3, 2, 1, 1);
BIG_BOTTOM[1][0] = 20;

const PATHOLOGICAL_2_BY = [
  [100, 1],
  [0.1, 10]
];

export default {
  SMALL_RAMP: ramp(3, 3),
  DUMB_CALENDER: ramp(7, 4),
  twoByThree: checkerBoardGenerator(3, 2, 1, 1),
  ONE_BY: checkerBoardGenerator(2, 2, 2, 1),
  ONE_BYS,
  ZION_VISITORS,
  USA_USA_USA,
  EXAMPLE_TABLE,
  oneByOnesUpper2,
  oneByOnesLower2,
  BLACK_AND_WHITE_TABLE,
  BIG_TOP,
  BIG_BOTTOM,
  CHECKER_BOARD: checkerBoardGenerator(4, 4, 50, 1),
  CHECKER_BOARD_SMALL: checkerBoardGenerator(4, 4, 5, 1),
  PATHOLOGICAL_2_BY
};
