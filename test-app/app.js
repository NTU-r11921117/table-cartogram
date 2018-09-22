import ReactDOM from 'react-dom';
import React from 'react';

// import FLAT_DATA from '../test/tenByten.json';
// import COMPLETED_RUN_DATA from '../scripts/hundred-run-data-1010.json';

import {transposeMatrix} from '../iterative-methods/utils';
import {TapReactBrowser} from 'tap-react-browser';
import {
  translateVectorToTabletranslateTableToVector,
  // findSumForTableTest,
  // buildIterativeCartogramTest,
  testTreeMapForError
} from '../test/iterative-tests';

import GenericTable from './components/generic-test-table';
import EXAMPLES, {CAL} from './examples';
import IterativeDisplay from './components/iterative-display';
import ExampleTreemap from './components/treemap-example-generator';
import ExampleHeatmap from './components/heatmap-example';
import CalendarDisplay from './components/calendar-example';
import CartogramPlot from './components/flat-display';
import ObjectiveFunctionVisualization from './components/objective-function-visualization';

function App() {
  const tables = [
    // {data: EXAMPLES.BLACK_AND_WHITE_TABLE, technique: 'gradient'},
    // {data: EXAMPLES.ONE_BYS, technique: 'gradient'}
    // {data: EXAMPLES.PATHOLOGICAL_2_BY, technique: 'gradient', stepSize: 100},
    // {data: EXAMPLES.EXAMPLE_TABLE, technique: 'gradient', stepSize: 1000},
    // {data: EXAMPLES.CHECKER_BOARD, technique: 'coordinate', stepSize: 10},
    // {
    //   data: EXAMPLES.USA_USA_USA_LABELS,
    //   technique: 'coordinate',
    //   stepSize: 10,
    //   computeMode: 'iterative',
    //   accessor: d => d[1]
    // },
    {data: EXAMPLES.PATHOLOGICAL_2_BY, technique: 'newtonStep', stepSize: 5, computeMode: 'iterative'},
    // {data: [[1, 1], [1, 1]], technique: 'newtonStep', stepSize: 5, computeMode: 'iterative'},
    // {data: EXAMPLES.CHECKER_BOARD, technique: 'newtonStep', stepSize: 10, computeMode: 'iterative'},
    // {data: EXAMPLES.BLACK_AND_WHITE_TABLE, technique: 'newtonStep', stepSize: 10, computeMode: 'iterative'},
    // {data: transposeMatrix(EXAMPLES.BLACK_AND_WHITE_TABLE), technique: 'newtonStep', stepSize: 10, computeMode: 'iterative'},
  ].map((config, idx) => (
    <IterativeDisplay
      {...config}
      iterations={400}
      layout={'gridLayout'}
      key={`${config.technique}-${idx}`}/>
  ));
  const SHOW_TESTS = false;
  return (
    <div>
      <h1>TABLE CARTOGRAM VISUAL TEST SUITE</h1>
      <div>
        {SHOW_TESTS && <TapReactBrowser
          runAsPromises
          tests={[
            translateVectorToTabletranslateTableToVector,
            // findSumForTableTest,
            // buildIterativeCartogramTest,
            // testTreeMapForError
          ]}/>}
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {
            tables
          }
        </div>
        <div>
          {
            // <GenericTable data={EXAMPLES.EXAMPLE_TABLE}/>
          }
        </div>
        {
          // <ExampleHeatmap data={EXAMPLES.EXAMPLE_TABLE} />
          // <CalendarDisplay data={CAL}/>
        }
        {
          // <CartogramPlot data={COMPLETED_RUN_DATA.gons} fillMode="valueHeat"/>
        }
        {
          // <ObjectiveFunctionVisualization />
        }
      </div>
    </div>
  );
}

const el = document.createElement('div');
document.body.appendChild(el);

ReactDOM.render(React.createElement(App), el);
