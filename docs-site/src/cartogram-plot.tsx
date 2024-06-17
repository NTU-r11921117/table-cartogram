import React from 'react';

import {geoCenter} from '../../src/utils';
import {Dimensions} from '../../types';
import {colorCell} from '../../showcase/colors';
import {scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import {hsl} from 'd3-color';
interface Props {
  data: any[];
  tableSize: Dimensions;
  fillMode: string;
  getLabel?: (x: any) => string;
  height?: number;
  width?: number;
  showLabel?: boolean;
}

function computeDomain(data: any): {min: number; max: number} {
  return data.reduce(
    (acc: any, row: any) => {
      return {
        min: Math.min(acc.min, row.value),
        max: Math.max(acc.max, row.value),
      };
    },
    {min: Infinity, max: -Infinity},
  );
}

export default function plot(props: Props): JSX.Element {
  const {data, fillMode, height = 600, width = 600, getLabel, showLabel, tableSize} = props;
  const valueDomain = computeDomain(data);

  const xScale = scaleLinear()
    .domain([0, 1])
    .range([0, width]);
  const yScale = scaleLinear()
    .domain([0, 1])
    .range([0, height]);
  const pather = line()
    .x((d: any) => xScale(d.x))
    .y((d: any) => yScale(d.y));
  return (
    <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg">
      {data.map((cell, index) => {
        const center = geoCenter(cell.vertices);
        const color = colorCell(cell, index, fillMode, valueDomain, tableSize);
        const {l} = hsl(color);
        return (
          <g key={index}>
            <path d={pather(cell.vertices)} fill={color} stroke="#aaa" />
            {showLabel && (
              <text x={xScale(center.x)} y={yScale(center.y)} fill={l < 0.5 ? 'white' : 'black'}>
                {getLabel(cell)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
