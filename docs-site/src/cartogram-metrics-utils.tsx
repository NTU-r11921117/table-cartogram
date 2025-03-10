import {Vector, DataTable, Pos, Rect, PositionTable, Getter, Dimensions, Gon} from '../../types.ts';
/**
 * Computes the average cartographic error for a particular table arrangement
 * @param  {Array of Arrays of Numbers} data The input table
 * @param  {Array of Arrays of Numbers} gons The test layout
 *  - Each element is a 4-tuple of the vertices of a quadrilateral, in the order [top-left, bottom-left, bottom-right, top-right]
 * @param  {Function} accessor get the value
 * @param  {Object: {height: Number, width: Number}} dims
 *  - The dimensions of the table cartogram being assembled
 * @return {Number} the average error for the test layout
 */

const dist = (a: Pos, b: Pos): number => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

function calculateAngle(a: Pos, b: Pos, c: Pos): number {
    const ux = a.x - b.x, uy = a.y - b.y;
    const vx = c.x - b.x, vy = c.y - b.y;
    return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy) * 180.0 / Math.PI;
}

// calculate the inner angle and find the largest one
function maxAngleinGon(gon: Gon): number {
    let maxAngle = 0;
    for (let i = 0; i < 4; i++) {
        const a = gon.vertices[(i + 3) % 4];
        const b = gon.vertices[i];
        const c = gon.vertices[(i + 1) % 4];
        let angle = (calculateAngle(a, b, c) + 360) % 360;
        maxAngle = Math.max(maxAngle, angle);
    }
    return maxAngle;
}

// calculate the inner angle and find the smallest one
function minAngleinGon(gon: Gon): number {
    let minAngle = 180;
    for (let i = 0; i < 4; i++) {
        const a = gon.vertices[(i + 3) % 4];
        const b = gon.vertices[i];
        const c = gon.vertices[(i + 1) % 4];
        let angle = (calculateAngle(a, b, c) + 360) % 360;
        minAngle = Math.min(minAngle, angle);
    }
    return minAngle;
}

// calculate the aspect ratio of a gon
// In 0~1, the closer to 1, the more square the shape is
function calculateAspectRatio(gon: Gon): number {
    let minEdge = Infinity;
    let maxEdge = 0;

    for(let i = 0; i < 4; i++) {
        let edge = dist(gon.vertices[i], gon.vertices[(i + 1) % 4]);
        minEdge = Math.min(minEdge, edge);
        maxEdge = Math.max(maxEdge, edge);
    }
    
    return minEdge / maxEdge;
}

// calculate the aspect ratio of a gon
function calculateShapeRatio(gon: Gon): number {
    let width = dist(gon.vertices[0], gon.vertices[1]);
    let height = dist(gon.vertices[0], gon.vertices[3]);
    return width / height;
}

export function calculateTotalRowLength(
    data: DataTable,
    gons: Gon[],
): number {
    let totalLength = 0;

    for (let i = 1; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let upper_edge = dist(gon.vertices[0], gon.vertices[3]);
            totalLength += upper_edge;
        }
    }

    return totalLength;
}

export function calculateTotalColumnLength(
    data: DataTable,
    gons: Gon[],
): number {
    let totalLength = 0;

    for (let i = 0; i < data.length; i++) {
        for (let j = 1; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let left_edge = dist(gon.vertices[0], gon.vertices[1]);
            totalLength += left_edge;
        }
    }

    return totalLength;
}

export function calculateTotalDiagonalLength(
    data: DataTable,
    gons: Gon[],
): number {
    if (data.length !== data[0].length) {
        console.error("The table is not square.");
        return 0;
    }

    let totalLength = 0;

    for (let i = 0; i < data.length; i++) {
      const gon = gons[i * data[0].length + i];
      let diagonal = dist(gon.vertices[0], gon.vertices[2]);
      totalLength += diagonal;
    }

    return totalLength;
}

export function calculateMaxInnerAngle(
    data: DataTable,
    gons: Gon[],
): number {
    let maxAngle = 0;

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let angle = maxAngleinGon(gon);
            maxAngle = Math.max(maxAngle, angle);
        }
    }

    return maxAngle;
}

export function calculateMinInnerAngle(
    data: DataTable,
    gons: Gon[],
): number {
    let minAngle = 180;

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let angle = minAngleinGon(gon);
            minAngle = Math.min(minAngle, angle);
        }
    }

    return minAngle;
}

//  width-to-height ratio
export function calculateAverageShapeRatio(
    data: DataTable,
    gons: Gon[],
): number{
    return -1;
    let totalShapeRatio = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let shapeRatio = calculateShapeRatio(gon);
            totalShapeRatio += shapeRatio;
        }
    }
    return totalShapeRatio / (data.length * data[0].length);
}

export function calculateAverageAspectRatio(
    data: DataTable,
    gons: Gon[],
): number {
    let totalAspectRatio = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let aspectRatio = calculateAspectRatio(gon);
            totalAspectRatio += aspectRatio;
        }
    }
    return totalAspectRatio / (data.length * data[0].length);
}

export function calculateMaxAspectRatio(
    data: DataTable,
    gons: Gon[],
): number {
    let maxAspectRatio = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let aspectRatio = calculateAspectRatio(gon);
            maxAspectRatio = Math.max(maxAspectRatio, aspectRatio);
        }
    }
    return maxAspectRatio;
}

export function calculateTotalMinBoundingBox(
    data: DataTable,
    gons: Gon[],
): number {
    let minBoundingBox = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            let width = Math.abs(Math.max(gons[i * data[0].length + j].vertices[2].x, gons[i * data[0].length + j].vertices[3].x) - Math.min(gons[i * data[0].length + j].vertices[0].x, gons[i * data[0].length + j].vertices[1].x));
            let height = Math.abs(Math.max(gons[i * data[0].length + j].vertices[1].y, gons[i * data[0].length + j].vertices[2].y) - Math.min(gons[i * data[0].length + j].vertices[0].y, gons[i * data[0].length + j].vertices[3].y));
            minBoundingBox += width * height;
        }
    }
    return minBoundingBox;
}

export function calculateConcaveCount(
    data: DataTable,
    gons: Gon[],
): number {
    let concaveCount = 0;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            const gon = gons[i * data[0].length + j];
            let angle = maxAngleinGon(gon);
            if (angle > 180) {
                concaveCount++;
            }
        }
    }
    return concaveCount;
}