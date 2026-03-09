
export type StandardButton =
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'LB'
  | 'RB'
  | 'LT'
  | 'RT'
  | 'Select'
  | 'Start'
  | 'L3'
  | 'R3'
  | 'Up'
  | 'Down'
  | 'Left'
  | 'Right';

export interface GamepadMappingConfig {
  buttons?: Partial<Record<StandardButton, string>>;
  dpad?: string;
  leftStick?: string;
  rightStick?: string;
  deadzone?: number;
}