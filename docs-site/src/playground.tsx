import React, {useState, useEffect} from 'react';
import Switch from 'react-switch';
import Tooltip from 'rc-tooltip';
import CartogramPlot from './cartogram-plot';
import {tableCartogramWithUpdate} from '../..';
import {area, computeErrors} from '../../src/utils';
import {Gon, Getter, LayoutType, Dimensions, SplitParams, LayoutParams, OptimizationParams, DataTable} from '../../types';
import {layouts} from '../../src/layouts';
import {XYPlot, LineSeries, XAxis, YAxis, DiscreteColorLegend} from 'react-vis';
import EXAMPLES, { rowSplit } from './examples';
import {CartogramMetrics} from './cartogram-metrics';

type RunningMode = 'running' | 'finished' | 'converged' | 'stopped' | 'errored';
import {COLOR_MODES} from '../../showcase/colors';
import {calculateTotalRowLength, calculateTotalColumnLength, calculateTotalDiagonalLength, calculateMaxInnerAngle, calculateMinInnerAngle, calculateAverageShapeRatio, calculateAverageAspectRatio, calculateMaxAspectRatio, calculateTotalMinBoundingBox, calculateConcaveCount} from './cartogram-metrics-utils';

const CONVERGENCE_THRESHOLD = 10;
const CONVERGENCE_BARRIER = 0.0001;

function decorateGonsWithErrors(data: DataTable, gons: Gon[], accessor: Getter, dims: Dimensions): any[] {
  const tableSum = data.reduce((acc, row) => acc + row.reduce((mem, cell) => mem + accessor(cell), 0), 0);
  const expectedAreas = data.map(row => row.map(cell => accessor(cell) / tableSum));
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[0].length; j++) {
      const gonArea = area(gons[i * data[0].length + j].vertices);
      const computedArea = gonArea / (dims.height * dims.width);
      const expectedArea = expectedAreas[i][j];
      const computedErr = Math.abs(computedArea - expectedArea) / Math.max(computedArea, expectedArea);
      gons[i * data[0].length + j].individualError = computedErr;
    }
  }
  return gons;
}
interface DropDownProps {
  label: string;
  onChange: (x: string) => any;
  keys: string[];
  current?: any;
}
function DropDownWithLabel(props: DropDownProps): JSX.Element {
  const {label, onChange, keys, current} = props;
  return (
    <div className="flex-down">
      <span>{label}</span>
      <select onChange={({target: {value}}): any => onChange(value)} value={current}>
        {keys.map(d => (
          <option value={d} key={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
const copy = (x: number[][]): number[][] => JSON.parse(JSON.stringify(x));
function DataUploader(setData: any, data: number[][], triggerReRun: any): JSX.Element {
  const [stringData, setStringData] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  return (
    <div className="custom-data-tip">
      <h1>Specify Custom Data</h1>
      <table>
        {data.map((row, idx) => (
          <tr key={idx}>
            {row.map((val, jdx) => (
              <td key={`${idx}-${jdx}`}>
                <input
                  value={val}
                  onChange={event => {
                    const veryLocalData = copy(data);
                    veryLocalData[idx][jdx] = Number(event.target.value);
                    setData(veryLocalData);
                  }}
                />
              </td>
            ))}
            <td>
              <button key={`remove-row-${idx}`} onClick={() => setData(data.filter((_, jdx) => jdx !== idx))}>
                X
              </button>
            </td>
          </tr>
        ))}
        <tr>
          {data[0].map((row, idx) => (
            <td>
              <button
                key={`remove-${idx}`}
                onClick={() => setData(data.map(row => row.filter((_, jdx) => jdx !== idx)))}
              >
                X
              </button>
            </td>
          ))}
        </tr>
      </table>
      <div className="flex">
        <button onClick={() => setData(data.concat([data[0].map(() => 1)]))}>ADD ROW</button>
        <button onClick={() => setData(data.map(row => [...row, 1]))}>ADD COLUMN</button>
        <button onClick={() => triggerReRun()}>RUN</button>
      </div>
      <div className="flex-down">
        <h3>Add data as text (use JSON syntax, e.g. `[[1, 1], [10, 1]]`)</h3>
        <span>{error}</span>
        <textarea
          value={stringData}
          onChange={e => {
            const str = e.currentTarget.value;
            setStringData(str);
            try {
              JSON.parse(str);
              setError('');
            } catch (e) {
              setError(e.message);
            }
          }}
        />
        {!error && (
          <button
            onClick={() => {
              setData(JSON.parse(stringData));
            }}
          >
            Set string data as custom data
          </button>
        )}
        {!error && <div>Once you are happy with the data, click start to run the simulation</div>}
      </div>
    </div>
  );
}

interface DisplayReadoutProps {
  errorLog: any[];
  error?: any;
  maxError: any;
  endTime?: number;
  startTime?: number;
  stepsTaken: number;
}

function DisplayReadout(props: DisplayReadoutProps): JSX.Element {
  const {errorLog, error, maxError, endTime, startTime, stepsTaken} = props;
  return (
    <div className="flex-down">
      <h4>COMPUTATION STATUS</h4>
      <div>
        {`Steps taken ${stepsTaken}`} <br />
        {`Avg Error ${Math.floor(error * Math.pow(10, 7)) / Math.pow(10, 5)} %`} <br />
        {`Max Error ${Math.floor(maxError * Math.pow(10, 7)) / Math.pow(10, 5)} %`} <br />
        {endTime && startTime && `Computation Time ${(endTime - startTime) / 1000} seconds`} <br />
      </div>

      {errorLog.length > 0 && (
        <XYPlot yDomain={[0, errorLog[0].y]} width={300} height={300}>
          <LineSeries data={errorLog} />
          <LineSeries data={errorLog} getY={(d: any) => d.z} />
          <XAxis title="Steps" />
          <YAxis title="Error" tickFormat={(d: any) => `${d * 100}%`} />
        </XYPlot>
      )}
      <DiscreteColorLegend orientation="horizontal" width={300} items={['AVG', 'MAX']} />
    </div>
  );
}

export default function Playground(): JSX.Element {
  const accessor = (x: number): number => x;
  const dims = {height: 1, width: 1};
  const [gons, setGons] = useState<any[]>([]);
  const stepSize = 10;
  const [optimizationParams, setOptimizationParams] = useState({
    lineSearchSteps: 30,
    useAnalytic: false,
    stepSize: Math.min(0.01),
    nonDeterministic: false,
    useGreedy: true,
    orderPenalty: 1,
    borderPenalty: 1,
    overlapPenalty: 4,
  } as OptimizationParams);
  const [layoutParams, setLayoutParams] = useState({
    emphasizedRowsFrom: 0,
    emphasizedRowsTo: 0,
    showLabel: false,
  } as LayoutParams); 
  const [layout, setLayout] = useState('pickBest' as LayoutType);
  const [data, setData] = useState([
    [1, 10, 1],
    [1, 1, 1],
    [1, 10, 1],
  ]);
  const [splitParams, setSplitParams] = useState({
    splitRow: 0,
    splitRatio: 0.5,
  } as SplitParams);
  const [fillMode, setFillMode] = useState('errorHeat');
  const [runningMode, setRunningMode] = useState('stopped' as RunningMode);
  const [{startTime, endTime, error, maxError, stepsTaken, errorLog}, setScalars] = useState<{
    startTime: number;
    endTime: number;
    error: number;
    maxError: number;
    stepsTaken: number;
    errorLog: any[];
    errorStep: null;
  }>({
    startTime: new Date().getTime(),
    endTime: new Date().getTime(),
    error: 0,
    maxError: 0,
    stepsTaken: 0,
    errorLog: [],
    errorStep: null,
  });
  const [{totalRowLength, totalColumnLength, totalDiagonalLength, maxInnerAngle, minInnerAngle, averageShapeRatio, averageAspectRatio, maxAspectRatio, boundingBoxRatio, concaveCount}, setMetrics] = useState({
    totalRowLength: 0,
    totalColumnLength: 0,
    totalDiagonalLength: 0,
    maxInnerAngle: 0,
    minInnerAngle: 0,
    averageShapeRatio: 0,
    averageAspectRatio: 0,
    maxAspectRatio: 0,
    boundingBoxRatio: 0,
    concaveCount: 0,
  });
  const triggerReRun = (...args: any): any => setRunningMode(`running-${Math.random()}` as RunningMode);
  useEffect(() => {
    if (!runningMode.includes('running')) {
      return;
    }
    const cartogram = tableCartogramWithUpdate({
      accessor,
      data,
      layout,
      optimizationParams,
      ...dims,
    });
    const localErrorLog = [] as any[];
    let steps = 0;
    const previousValueAndCount = {value: Infinity, count: 0};
    const localStartTime = +new Date();
    const ticker = setInterval(() => {
      const gons = (cartogram as (x: number) => Gon[])(stepSize);
      const errorCompute = computeErrors(data, gons, accessor, dims);
      if (previousValueAndCount.value !== errorCompute.error) {
        previousValueAndCount.count = 0;
        previousValueAndCount.value = errorCompute.error;
      } else {
        previousValueAndCount.count += 1;
      }
      localErrorLog.push({x: steps, y: errorCompute.error, z: errorCompute.maxError});
      steps += stepSize;
      setGons(decorateGonsWithErrors(data, gons, accessor, dims));

      const converged = previousValueAndCount.value < CONVERGENCE_BARRIER;
      const halted = previousValueAndCount.count > CONVERGENCE_THRESHOLD;
      const inError = isNaN(errorCompute.error);
      if (halted || converged || inError) {
        clearInterval(ticker);
        setRunningMode(converged ? 'converged' : halted ? 'stopped' : inError ? 'errored' : runningMode);
      }

      setScalars({
        startTime: localStartTime,
        endTime: new Date().getTime(),
        error: errorCompute.error,
        maxError: errorCompute.maxError,
        stepsTaken: steps,
        errorLog: localErrorLog,
        errorStep: null,
      });

      setMetrics({
        totalRowLength: calculateTotalRowLength(data, gons),
        totalColumnLength: calculateTotalColumnLength(data, gons),
        totalDiagonalLength: calculateTotalDiagonalLength(data, gons),
        maxInnerAngle: calculateMaxInnerAngle(data, gons),
        minInnerAngle: calculateMinInnerAngle(data, gons),
        averageShapeRatio: calculateAverageShapeRatio(data, gons),
        averageAspectRatio: calculateAverageAspectRatio(data, gons),
        maxAspectRatio: calculateMaxAspectRatio(data, gons),
        boundingBoxRatio: calculateTotalMinBoundingBox(data, gons),
        concaveCount: calculateConcaveCount(data, gons),
      });
    }, 100);
    return (): any => clearInterval(ticker);
  }, [runningMode, JSON.stringify(data), JSON.stringify(optimizationParams)]);

  return (
    <div className="flex" id="playground">
      <div className="flex">
        <div className="flex-down">
          <h4>DATA SET SELECTION</h4>
          <DropDownWithLabel
            label={'Predefined Datasets'}
            keys={Object.keys(EXAMPLES)}
            onChange={(value): any => triggerReRun(setData(EXAMPLES[value]))}
          />
          <Tooltip trigger="click" overlay={DataUploader(setData, data, triggerReRun)}>
            <button>Customize Data</button>
          </Tooltip>
          <div className="flex space-between">
            <text>splitRow</text>
            <input
              type="number"
              value={splitParams.splitRow}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setSplitParams({ ...splitParams, splitRow: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex space-between">
            <text>splitRatio</text>
            <input
              type="number"
              value={splitParams.splitRatio}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setSplitParams({ ...splitParams, splitRatio: parseFloat(e.target.value) })
              }
            />
          </div>
          <button onClick={(): any => triggerReRun(setData(rowSplit(data, splitParams.splitRow, splitParams.splitRatio)))}>Split</button>
          <h4>PARAM SELECTION</h4>
          <div className="flex-down">
            <DropDownWithLabel
              label={'Initial Layout'}
              keys={['pickBest', 'pickWorst', ...Object.keys(layouts)]}
              onChange={val => triggerReRun(setLayout(val as any))}
              current={layout}
            />
            <DropDownWithLabel
              label={'Color Scheme'}
              keys={Object.keys(COLOR_MODES)}
              onChange={setFillMode}
            />
            {[
              {
                paramName: 'emphasizedRowsFrom',
                type: 'number',
                description: 'The range of rows to emphasize in the layout.',
              },
              {
                paramName: 'emphasizedRowsTo',
                type: 'number',
                description: 'The range of rows to emphasize in the layout.',
              },
              {
                paramName: 'showLabel',
                type: 'switch',
                description: 'Whether to show the value of cells.',
              },
            ].map(({paramName, type, description}) => {
              return (
                <div key={paramName} className="flex space-between">
                  <div>
                    <span>{paramName}</span>
                    <Tooltip
                      key={type}
                      placement="bottom"
                      trigger="click"
                      overlay={<span className="tooltip-internal">{<span>{description}</span>}</span>}
                    >
                      <span className="cursor-pointer">(?)</span>
                    </Tooltip>
                  </div>
                  {type === 'switch' && (
                    <Switch
                      {...{
                        offColor: '#800000',
                        onColor: '#36425C',
                        height: 15,
                        checkedIcon: false,
                        width: 50,
                      }}
                      checked={(layoutParams as any)[paramName]}
                      onChange={() =>
                        setLayoutParams({
                          ...layoutParams,
                          [paramName]: !(layoutParams as any)[paramName],
                        })
                      }
                    />
                  )}
                  {type === 'number' && (
                    <input
                      key={paramName}
                      type="number"
                      value={(layoutParams as any)[paramName]}
                      onChange={(event: any): any =>
                        setLayoutParams({
                          ...layoutParams,
                          [paramName]: parseInt(event.target.value), // Only for integers
                        })
                      }
                    />
                  )}
                </div>
              );
            })}
            {[
              {
                paramName: 'lineSearchSteps',
                type: 'number',
                description: 'The number of steps to take while computing the gradient line search.',
              },
              {
                paramName: 'useAnalytic',
                type: 'switch',
                description: 'Whether to use the analytic gradient or an automatically computed one.',
              },
              {
                paramName: 'stepSize',
                type: 'number',
                description: 'How big a step to use in computing the gradient.',
              },
              {
                paramName: 'nonDeterministic',
                type: 'switch',
                description: 'Whether to use stochastic gradient descent or just regular gradient descent.',
              },
              {
                paramName: 'useGreedy',
                type: 'switch',
                description:
                  'Whether to use a greedy strategy (bigger shapes should be corrected first) for computing the object or a normalized one (all shapes should be corrected at the same rate).',
              },
              {
                paramName: 'orderPenalty',
                type: 'number',
                description: ' How much penalty to assign to nodes that have gone out of order.',
              },
              {
                paramName: 'borderPenalty',
                type: 'number',
                description: 'How much penalty to assign to nodes that have gone out of the border.',
              },
              {
                paramName: 'overlapPenalty',
                type: 'number',
                description: 'How much penalty to assign to overlap between quads.',
              },
            ].map(({paramName, type, description}) => {
              return (
                <div key={paramName} className="flex space-between">
                  <div>
                    <span>{paramName}</span>
                    <Tooltip
                      key={type}
                      placement="bottom"
                      trigger="click"
                      overlay={<span className="tooltip-internal">{<span>{description}</span>}</span>}
                    >
                      <span className="cursor-pointer">(?)</span>
                    </Tooltip>
                  </div>
                  {type === 'switch' && (
                    <Switch
                      {...{
                        offColor: '#800000',
                        onColor: '#36425C',
                        height: 15,
                        checkedIcon: false,
                        width: 50,
                      }}
                      checked={(optimizationParams as any)[paramName]}
                      onChange={() =>
                        setOptimizationParams({
                          ...optimizationParams,
                          [paramName]: !(optimizationParams as any)[paramName],
                        })
                      }
                    />
                  )}
                  {type === 'number' && (
                    <input
                      key={paramName}
                      type="number"
                      value={(optimizationParams as any)[paramName]}
                      onChange={(event: any): any =>
                        setOptimizationParams({
                          ...optimizationParams,
                          [paramName]: event.target.value,
                        })
                      }
                    />
                  )}
                </div>
              );
            })}

            <button onClick={(): any => setRunningMode('stopped')}>STOP</button>
            <button onClick={(): any => triggerReRun()}>{!gons.length ? 'START' : 'RESET'}</button>
          </div>
        </div>
        <div>
          <DisplayReadout
            errorLog={errorLog}
            error={error}
            maxError={maxError}
            endTime={endTime}
            startTime={startTime}
            stepsTaken={stepsTaken}
          />
          <CartogramMetrics
            totalRowLength={totalRowLength}
            totalColumnLength={totalColumnLength}
            totalDiagonalLength={totalDiagonalLength}
            maxInnerAngle={maxInnerAngle}
            minInnerAngle={minInnerAngle}
            averageShapeRatio={averageShapeRatio}
            averageAspectRatio={averageAspectRatio}
            maxAspectRatio={maxAspectRatio}
            boundingBoxRatio={boundingBoxRatio}
            concaveCount={concaveCount}
          />
        </div>
        <div className="plot-container flex-down">
          {!gons.length && <h1>Press start to run</h1>}
          <CartogramPlot
            data={gons}
            tableSize={{height: data.length, width: data[0].length}}
            fillMode={fillMode}
            getLabel={(x): any => x.data}
            height={800}
            width={800}
            showLabel={layoutParams.showLabel}
            emphasizedRows={[layoutParams.emphasizedRowsFrom ?? 0, layoutParams.emphasizedRowsTo ?? 0]}
          />
          <button
            onClick={() => {
              const svgElement = document.querySelector('.plot-container svg') as SVGSVGElement;
              const svg = svgElement.outerHTML;
              const blob = new Blob([svg.toString()]);
              const element = document.createElement('a');
              element.download = `table-cartogram-${new Date()}.svg`;
              element.href = window.URL.createObjectURL(blob);
              element.click();
              element.remove();
            }}
            className="download-button"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
