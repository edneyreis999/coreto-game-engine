/**
 * Minimal PIXI.js type declarations for runtime shims
 */

declare global {
  interface HTMLImageElement {
    src: string;
    width: number;
    height: number;
    readonly complete: boolean;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace PIXI {
  export class Container {
    children: Container[];
    parent: Container | null;
    addChild(child: Container): Container;
    removeChild(child: Container): Container;
    destroy(options?: { children?: boolean }): void;
  }

  export class Sprite extends Container {
    texture: Texture;
    anchor: Point;
    scale: Point;
    alpha: number;
    visible: boolean;
  }

  export class Texture {
    static from(source: string | HTMLImageElement): Texture;
    static EMPTY: Texture;
  }

  export class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): void;
  }

  export class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x?: number, y?: number, width?: number, height?: number);
  }

  export namespace filters {
    export class ColorMatrixFilter {
      matrix: number[];
      setHue(rotation: number): void;
      brightness(b: number, multiply?: boolean): void;
      contrast(amount: number, multiply?: boolean): void;
      saturate(amount: number, multiply?: boolean): void;
    }
  }
}

export {};
