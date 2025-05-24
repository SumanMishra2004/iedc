// generateBezierPath.ts

export type Point = { x: number; y: number };

/**
 * Generate a cubic Bezier path string from start to end points with control points.
 * Control points are calculated to create a nice exponential-like curve.
 */
export function generateBezierPath(start: Point, end: Point): string {
  // Control points to create a "drop and curve" shape
  const control1 = {
    x: start.x + (end.x - start.x) * 0.2,
    y: start.y + 600, // big vertical drop for curve
  };

  const control2 = {
    x: start.x + (end.x - start.x) * 0.5,
    y: end.y - 50, // upward curve near the end
  };

  // Construct the SVG cubic Bezier path command string
  return `
    M ${start.x} ${start.y}
    C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}
  `;
}
