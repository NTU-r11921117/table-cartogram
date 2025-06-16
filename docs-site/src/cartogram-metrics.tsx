import React from "react";

export interface CartogramMetricsProps {
  averageRowLength?: number;
  averageColumnLength?: number;
  totalDiagonalLength?: number;
  maxInnerAngle?: number;
  minInnerAngle?: number;
  averageShapeRatio?: number;
  averageAspectRatio?: number;
  maxAspectRatio?: number;
  boundingBoxRatio?: number;
  concaveCount?: number;
}

export function CartogramMetrics(props: CartogramMetricsProps): JSX.Element {
  const {
    averageRowLength,
    averageColumnLength,
    totalDiagonalLength,
    maxInnerAngle,
    minInnerAngle,
    averageShapeRatio,
    averageAspectRatio,
    maxAspectRatio,
    boundingBoxRatio,
    concaveCount,
  } = props;
  return (
    <div className="flex-down">
      <h4>Cartogram Metrics</h4>
      <div>
        {`Average Row Length: ${averageRowLength}`} <br />
        {`Average Column Length: ${averageColumnLength}`} <br />
        {`Total Diagonal Length: ${totalDiagonalLength}`} <br />
        {`Max Inner Angle: ${maxInnerAngle}`} <br />
        {`Min Inner Angle: ${minInnerAngle}`} <br />
        {`Average Shape Ratio: ${averageShapeRatio}`} <br />
        {`Average Aspect Ratio: ${averageAspectRatio}`} <br />
        {`Max Aspect Ratio: ${maxAspectRatio}`} <br />
        {`Bounding Box Ratio: ${boundingBoxRatio}`} <br />
        {`Concave Count: ${concaveCount}`} <br />
      </div>
    </div>
  );
}