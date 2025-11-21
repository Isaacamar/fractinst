export interface ChordDefinition {
  name: string;
  intervals: number[];
}

export type KeyType = 'white' | 'black' | 'chord' | 'function';

export interface KeyDefinition {
  label: string;
  type: KeyType;
  note?: string;
  position?: number;
  betweenKeys?: [number, number];
  name?: string;
  desc?: string;
}

export type ChordMap = Record<string, ChordDefinition>;

export const COMMON_CHORDS: ChordDefinition[] = [
  { name: 'Major', intervals: [0, 4, 7] },
  { name: 'Minor', intervals: [0, 3, 7] },
  { name: 'Dim', intervals: [0, 3, 6] },
  { name: 'Aug', intervals: [0, 4, 8] },
  { name: 'Maj7', intervals: [0, 4, 7, 11] },
  { name: 'Min7', intervals: [0, 3, 7, 10] },
  { name: 'Dom7', intervals: [0, 4, 7, 10] },
  { name: 'Sus4', intervals: [0, 5, 7] },
  { name: 'Sus2', intervals: [0, 2, 7] },
  { name: 'Power', intervals: [0, 7, 12] },
  { name: 'Octave', intervals: [0, 12] },
  { name: 'Maj9', intervals: [0, 4, 7, 11, 14] },
  { name: 'Min9', intervals: [0, 3, 7, 10, 14] },
];

