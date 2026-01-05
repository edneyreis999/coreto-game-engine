/**
 * PIXI.js Shim for Headless Execution
 *
 * Provides minimal mock implementations of PIXI.js classes required by RPG Maker MZ core scripts.
 * These mocks satisfy the engine's API contracts without performing actual rendering operations.
 *
 * CRITICAL: PIXI.Rectangle.contains() must have real logic (not empty stub).
 * If it returns incorrect values, NaN propagates to battle calculations causing undefined behavior.
 *
 * NOTE: All classes are implemented as constructor functions (not ES6 classes) to support
 * invocation without 'new' keyword, which some RPG Maker MZ code may do.
 *
 * @module infrastructure/runtime/shims/pixi_shim
 * @see docs/pesquisas/Headless RPG Maker MZ_ Node.js POC.md - Section 2.1
 * @see docs/adrs/RUNTIME/ADR-015-graphics-mocking-strategy-headless-runtime.md
 */

/**
 * Base class for all display objects in PIXI hierarchy.
 * Provides position, visibility, and transform properties.
 */
function DisplayObject(this: any) {
  this.x = 0;
  this.y = 0;
  this.parent = null;
  this.worldAlpha = 1;
  this.transform = {
    worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  };
  this.visible = true;
  this.renderable = true;
  // CRITICAL: PIXI.DisplayObject has position and pivot objects
  // RPG Maker MZ code accesses position.x, position.y, pivot.x, pivot.y
  this.position = { x: 0, y: 0 };
  this.pivot = { x: 0, y: 0 };
}

DisplayObject.prototype.destroy = function () {
  // No-op: nothing to clean up in headless mode
};

DisplayObject.prototype.getGlobalPosition = function () {
  return { x: 0, y: 0 };
};

DisplayObject.prototype.setParent = function (container: any) {
  this.parent = container;
};

/**
 * Container for managing child display objects.
 * Implements parent-child relationship management used by RPG Maker MZ scene hierarchy.
 */
function Container(this: any) {
  DisplayObject.call(this);
  this.children = [];
  // CRITICAL: Container must have scale property
  // RPG Maker MZ Window.openness setter accesses _container.scale.y
  this.scale = { x: 1, y: 1 };
}

Container.prototype = Object.create(DisplayObject.prototype);
Container.prototype.constructor = Container;

/**
 * Adds a child display object to this container.
 * Removes child from previous parent if it had one.
 *
 * @param child - Display object to add
 * @returns The added child
 */
Container.prototype.addChild = function (child: any) {
  if (!child) return child;

  // Remove from previous parent
  if (child.parent) {
    child.parent.removeChild(child);
  }

  child.parent = this;
  this.children.push(child);
  return child;
};

/**
 * Removes a child display object from this container.
 *
 * @param child - Display object to remove
 * @returns The removed child
 */
Container.prototype.removeChild = function (child: any) {
  const index = this.children.indexOf(child);
  if (index > -1) {
    this.children.splice(index, 1);
    child.parent = null;
  }
  return child;
};

/**
 * Recursively updates transforms for this container and all children.
 * Shim implementation to satisfy visual update loops.
 */
Container.prototype.updateTransform = function () {
  for (const child of this.children) {
    if (child.updateTransform) {
      child.updateTransform();
    }
  }
};

/**
 * Sprite class for displaying textures.
 * Extends Container to support child objects.
 */
function Sprite(this: any) {
  Container.call(this);
  this.anchor = { x: 0, y: 0 };
  this.scale = { x: 1, y: 1 };
  this.blendMode = 0;
  // Initialize with minimal texture structure
  this.texture = {
    baseTexture: { width: 0, height: 0 },
    frame: new (Rectangle as any)(),
  };
  // Initialize _frame property (used by RMMZ's Sprite._refresh())
  this._frame = new (Rectangle as any)();
}

Sprite.prototype = Object.create(Container.prototype);
Sprite.prototype.constructor = Sprite;

/**
 * Graphics class for drawing shapes.
 * Used by RPG Maker MZ for window backgrounds.
 */
function Graphics(this: any) {
  Container.call(this);
}

Graphics.prototype = Object.create(Container.prototype);
Graphics.prototype.constructor = Graphics;

Graphics.prototype.clear = function () {
  return this;
};

Graphics.prototype.beginFill = function (_color: number, _alpha?: number) {
  return this;
};

Graphics.prototype.drawRect = function (_x: number, _y: number, _width: number, _height: number) {
  return this;
};

Graphics.prototype.endFill = function () {
  return this;
};

/**
 * Rectangle class with real geometric logic.
 *
 * CRITICAL: This must have actual contains() logic, not a stub.
 * RPG Maker MZ uses Rectangle extensively for:
 * - Window layout calculations (Window_Base.prototype.updatePadding)
 * - Hit testing for UI interactions
 * - Collision detection
 *
 * If contains() returns incorrect values, NaN can propagate to battle logic.
 */
function Rectangle(this: any, x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

/**
 * Tests if a point is contained within this rectangle.
 *
 * IMPORTANT: Real logic required for window layouts and hitTest.
 * Must return false if width or height is 0 (degenerate rectangle).
 * Upper bounds are exclusive (point on right/bottom edge is outside).
 *
 * @param x - X coordinate to test
 * @param y - Y coordinate to test
 * @returns true if point is inside rectangle bounds
 */
Rectangle.prototype.contains = function (x: number, y: number): boolean {
  return (
    this.width > 0 &&
    this.height > 0 &&
    x >= this.x &&
    x < this.x + this.width &&
    y >= this.y &&
    y < this.y + this.height
  );
};

/**
 * Creates a copy of this rectangle.
 *
 * @returns A new Rectangle instance with the same dimensions
 */
Rectangle.prototype.clone = function (): any {
  return new (Rectangle as any)(this.x, this.y, this.width, this.height);
};

/**
 * Pads the rectangle by the given amount.
 * Modifies the rectangle in place.
 *
 * @param paddingX - Horizontal padding (negative values shrink)
 * @param paddingY - Vertical padding (defaults to paddingX if not provided)
 * @returns This rectangle for chaining
 */
Rectangle.prototype.pad = function (paddingX: number = 0, paddingY?: number): any {
  const py = paddingY !== undefined ? paddingY : paddingX;
  this.x -= paddingX;
  this.y -= py;
  this.width += paddingX * 2;
  this.height += py * 2;
  return this;
};

/**
 * Point class for 2D coordinates.
 */
function Point(this: any, x: number = 0, y: number = 0) {
  this.x = x;
  this.y = y;
}

/**
 * TextStyle configuration object.
 * Minimal stub for text rendering configuration.
 */
function TextStyle(this: any) {
  // Empty constructor - RPG Maker MZ only needs this to exist
}

/**
 * Event emitter for PIXI events.
 * Minimal stub to satisfy event management API.
 */
function EventEmitter(this: any) {
  // Empty constructor
}

EventEmitter.prototype.on = function () {
  // No-op: no event handling in headless mode
};

EventEmitter.prototype.off = function () {
  // No-op: no event handling in headless mode
};

EventEmitter.prototype.emit = function () {
  // No-op: no event handling in headless mode
};

/**
 * Color matrix filter stub.
 * Required by some VisuStella plugins for visual state effects.
 */
function ColorMatrixFilter(this: any) {
  // Empty constructor - visual effects are not rendered in headless mode
}

/**
 * Alpha filter stub.
 * Required by RPG Maker MZ for opacity effects.
 */
function AlphaFilter(this: any, _alpha?: number) {
  // Empty constructor - visual effects are not rendered in headless mode
}

/**
 * Blur filter stub.
 * Required by RPG Maker MZ for blur effects.
 */
function BlurFilter(this: any, _strength?: number, _quality?: number, _resolution?: number, _kernelSize?: number) {
  // Empty constructor - visual effects are not rendered in headless mode
}

/**
 * ColorFilter stub - RMMZ will replace this entirely.
 * We provide a minimal placeholder that RMMZ can safely overwrite.
 *
 * CRITICAL: RMMZ's rmmz_core.js defines its own ColorFilter with initialize().
 * We only need to prevent runtime errors before RMMZ loads.
 */
function ColorFilter(this: any) {
  // Stub - RMMZ will replace this
}

/**
 * ObjectRenderer base class for custom PIXI renderers.
 * Required by Tilemap.Renderer in rmmz_core.js.
 */
function ObjectRenderer(this: any, _renderer?: any) {
  // Stub constructor - parameter not used in headless mode
}

/**
 * Renderer class with plugin registration.
 * Required for PIXI.Renderer.registerPlugin() in rmmz_core.js.
 */
function Renderer(this: any) {
  // Empty constructor
}

Renderer.registerPlugin = function (_pluginName: string, _pluginClass: any) {
  // No-op: plugin registration not needed in headless mode
};

/**
 * BaseTexture class for texture management.
 * Required by TilingSprite in rmmz_core.js.
 */
function BaseTexture(this: any) {
  this.width = 0;
  this.height = 0;
}

BaseTexture.prototype.setSize = function (width: number, height: number) {
  this.width = width;
  this.height = height;
};

BaseTexture.prototype.destroy = function () {
  // No-op: nothing to clean up in headless mode
};

/**
 * TilingSprite class for repeating sprites.
 * Required by RPG Maker MZ for parallax backgrounds.
 */
function TilingSprite(this: any) {
  Sprite.call(this);
}

TilingSprite.prototype = Object.create(Sprite.prototype);
TilingSprite.prototype.constructor = TilingSprite;

/**
 * Filter class for shader-based post-processing effects.
 * Required by ColorFilter in rmmz_core.js.
 */
function Filter(this: any, _vertexSrc?: string | null, _fragmentSrc?: string | null, _uniforms?: any) {
  // Stub constructor - shaders not executed in headless mode
}

/**
 * Texture class for managing texture data.
 * Required by RPG Maker MZ sprite system.
 */
function Texture(this: any, baseTexture?: any) {
  this.baseTexture = baseTexture || new (BaseTexture as any)();
  this.frame = new (Rectangle as any)();
}

/**
 * Assemble PIXI namespace with all required classes.
 */
const PIXI: any = {};

PIXI.DisplayObject = DisplayObject;
PIXI.Container = Container;
PIXI.Sprite = Sprite;
PIXI.TilingSprite = TilingSprite;
PIXI.Graphics = Graphics;
PIXI.Rectangle = Rectangle;
PIXI.Point = Point;
PIXI.TextStyle = TextStyle;
PIXI.BaseTexture = BaseTexture;
PIXI.Texture = Texture;
PIXI.ObjectRenderer = ObjectRenderer;
PIXI.Renderer = Renderer;
PIXI.Filter = Filter;
PIXI.utils = { EventEmitter };
PIXI.Loader = {
  shared: {
    add: () => {
      // No-op: no actual resource loading in headless mode
    },
    load: (cb?: () => void) => {
      // Immediately invoke callback - all resources are "loaded"
      if (cb) cb();
    },
  },
};
PIXI.filters = {
  ColorMatrixFilter,
  AlphaFilter,
  BlurFilter,
  ColorFilter,
};
PIXI.SCALE_MODES = {
  LINEAR: 1,
  NEAREST: 0,
};
PIXI.BLEND_MODES = {
  NORMAL: 0,
  ADD: 1,
  MULTIPLY: 2,
  SCREEN: 3,
};

/**
 * Inject PIXI into global scope.
 * Must be called before loading RPG Maker MZ core scripts.
 */
(global as any).PIXI = PIXI;

export { PIXI, DisplayObject, Container, Sprite, Graphics, Rectangle, Point, ObjectRenderer, Filter, Texture };
