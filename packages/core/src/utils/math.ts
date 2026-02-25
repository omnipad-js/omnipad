import { Vec2 } from '../types';

/**
 * Subtracts vector v2 from v1.
 * @param v1 - The source vector.
 * @param v2 - The vector to subtract.
 */
export const subVec = (v1: Vec2, v2: Vec2): Vec2 => {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
};

/**
 * Adds vector v2 to v1.
 */
export const addVec = (v1: Vec2, v2: Vec2): Vec2 => {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
};

/**
 * Scales a vector by a scalar value.
 * Useful for mapping normalized vectors back to specific pixel magnitudes.
 */
export const scaleVec = (v: Vec2, s: number): Vec2 => {
  return { x: v.x * s, y: v.y * s };
};

/**
 * Clamps a numeric value between a minimum and maximum range.
 */
export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

/**
 * Linearly interpolates between two values.
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Rounds a number to a specific decimal precision.
 * Solves floating-point precision issues in pixel calculations.
 */
export const roundTo = (val: number, precision: number = 2): number => {
  const m = Math.pow(10, precision);
  return Math.round(val * m) / m;
};

/**
 * Calculates the Euclidean distance between two points.
 */
export const getDistance = (p1: Vec2, p2: Vec2): number => {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
};

/**
 * Calculates the angle in radians from point p1 to p2.
 * Range: -PI to PI.
 */
export const getAngle = (p1: Vec2, p2: Vec2): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

/**
 * Converts radians to degrees.
 */
export const radToDeg = (rad: number): number => {
  return (rad * 180) / Math.PI;
};

/**
 * Converts degrees to radians.
 */
export const degToRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

/**
 * Constrains a target point within a circular radius relative to an origin.
 * Commonly used for joystick physical displacement limits.
 */
export const clampVector = (origin: Vec2, target: Vec2, radius: number): Vec2 => {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);

  // If within the radius, return the target point.
  if (dist <= radius) return target;

  // If it exceeds the boundary, it locks onto the circumference of the boundary circle.
  const angle = Math.atan2(dy, dx);
  return {
    x: origin.x + Math.cos(angle) * radius,
    y: origin.y + Math.sin(angle) * radius,
  };
};

/**
 * Snaps a radian angle to the nearest of 8 directions (45-degree steps).
 */
export const lockTo8Directions = (rad: number): number => {
  const step = Math.PI / 4; // 45 degree is a step
  return Math.round(rad / step) * step;
};

/**
 * Snaps a radian angle to the nearest of 4 directions (90-degree steps).
 */
export const lockTo4Directions = (rad: number): number => {
  const step = Math.PI / 2; // 90 degree is a step
  return Math.round(rad / step) * step;
};

/**
 * Converts percentage (0-100) to pixel values (px).
 */
export const percentToPx = (percent: number, totalPx: number): number => {
  return roundTo((percent * totalPx) / 100);
};

/**
 * Converts pixel values (px) to percentage (0-100).
 */
export const pxToPercent = (px: number, totalPx: number): number => {
  if (totalPx === 0) return 0;
  return roundTo((px * 100) / totalPx);
};

/**
 * Normalizes a vector to a length of 1.
 * Returns {0, 0} if the vector magnitude is 0.
 */
export const normalizeVec = (v: Vec2): Vec2 => {
  const magnitude = Math.hypot(v.x, v.y);
  return magnitude === 0 ? { x: 0, y: 0 } : { x: v.x / magnitude, y: v.y / magnitude };
};

/**
 * Converts a radian angle to a unit vector.
 */
export const radToVec = (rad: number): Vec2 => ({
  x: Math.cos(rad),
  y: Math.sin(rad),
});

/**
 * Linearly remaps a value from one range [inMin, inMax] to another [outMin, outMax].
 */
export const remap = (
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  const t = (val - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamp(t, 0, 1));
};

/**
 * Performs a dirty check to see if two Vec2 points are different within an epsilon.
 */
export const isVec2Equal = (v1: Vec2, v2: Vec2, epsilon = 0.0001): boolean => {
  return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
};

/**
 * Core deadzone logic.
 * Maps a value from [threshold, max] to a normalized scale [0, 1].
 * @returns A scalar value between 0 and 1.
 */
export const getDeadzoneScalar = (magnitude: number, threshold: number, max: number): number => {
  if (magnitude < threshold) return 0;

  const scalar = (magnitude - threshold) / (max - threshold);
  return clamp(scalar, 0, 1);
};

/**
 * Applies a radial deadzone to a vector.
 * Suitable for analog sticks to ensure a smooth transition from center.
 * @param v - Input vector.
 * @param radius - The total radius of the joystick base.
 * @param deadzonePercent - Deadzone threshold (0.0 to 1.0).
 */
export const applyRadialDeadzone = (v: Vec2, radius: number, deadzonePercent: number): Vec2 => {
  const magnitude = Math.hypot(v.x, v.y);
  const threshold = radius * deadzonePercent;

  const scalar = getDeadzoneScalar(magnitude, threshold, radius);

  if (scalar === 0) return { x: 0, y: 0 };

  // Maintain direction, apply scaled force coefficient
  const direction = { x: v.x / magnitude, y: v.y / magnitude };
  return scaleVec(direction, scalar);
};

/**
 * Applies an axial deadzone to a vector.
 * Independently processes X and Y axes. Useful for D-Pads or precision directional inputs.
 * @param v - Input vector.
 * @param threshold - The deadzone threshold value.
 * @param max - Maximum value for the axis.
 */
export const applyAxialDeadzone = (v: Vec2, threshold: number, max: number): Vec2 => {
  return {
    x: getDeadzoneScalar(Math.abs(v.x), threshold, max) * Math.sign(v.x),
    y: getDeadzoneScalar(Math.abs(v.y), threshold, max) * Math.sign(v.y),
  };
};
