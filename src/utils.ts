/**
 * Force expand (simplification / normalization) of conditional and mapped types.
 * More info {@link https://github.com/microsoft/TypeScript/issues/47980 TypeScript/issues/47980}
 */
export type Expand<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

/**
 * Recursively force expand (simplification / normalization) of conditional and mapped types.
 * More info {@link https://github.com/microsoft/TypeScript/issues/47980 TypeScript/issues/47980}
 */
export type ExpandRecursive<T> = T extends unknown
  ? { [K in keyof T]: ExpandRecursive<T[K]> }
  : never;

export type Reverse<T extends string> = T extends `${infer Head}${infer Tail}`
  ? `${Reverse<Tail>}${Head}`
  : T;

export type UnionToIntersection<U> = (
  U extends any ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;

export type Empty = "\n" | "\t" | "\r" | "," | " ";

export type TrimLeft<T> = T extends `${Empty}${infer Tail}`
  ? TrimLeft<Tail>
  : T;
export type TrimRight<T> = T extends `${infer Head}${Empty}`
  ? TrimRight<Head>
  : T;
export type Trim<T> = TrimLeft<TrimRight<T>>;

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// prettier-ignore
export type Letter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
