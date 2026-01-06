/**
 * Unit tests for PIXI.js shim
 *
 * Tests focus on:
 * 1. Container hierarchy management (addChild/removeChild)
 * 2. Rectangle.contains() edge cases (CRITICAL)
 * 3. Global PIXI namespace injection
 * 4. Sprite instantiation with texture structure
 *
 * @see src/infrastructure/runtime/shims/pixi_shim.ts
 */

import {
  PIXI,
  DisplayObject,
  Container,
  Sprite,
  Graphics,
  Rectangle,
  Point,
} from '@/infrastructure/runtime/shims/pixi_shim';

describe('PIXI Shim', () => {
  describe('DisplayObject', () => {
    it('should initialize with default properties', () => {
      const obj = new (DisplayObject as any)();

      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
      expect(obj.parent).toBeNull();
      expect(obj.worldAlpha).toBe(1);
      expect(obj.visible).toBe(true);
      expect(obj.renderable).toBe(true);
    });

    it('should have transform with worldTransform', () => {
      const obj = new (DisplayObject as any)();

      expect(obj.transform).toBeDefined();
      expect(obj.transform.worldTransform).toEqual({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        tx: 0,
        ty: 0,
      });
    });

    it('should return global position', () => {
      const obj = new (DisplayObject as any)();
      const pos = obj.getGlobalPosition();

      expect(pos).toEqual({ x: 0, y: 0 });
    });

    it('should set parent via setParent', () => {
      const obj = new (DisplayObject as any)();
      const parent = new (Container as any)();

      obj.setParent(parent);

      expect(obj.parent).toBe(parent);
    });

    it('should destroy without errors', () => {
      const obj = new (DisplayObject as any)();

      expect(() => obj.destroy()).not.toThrow();
    });
  });

  describe('Container', () => {
    describe('addChild', () => {
      it('should add child and set parent relationship', () => {
        const container = new (Container as any)();
        const child = new (DisplayObject as any)();

        const result = container.addChild(child);

        expect(result).toBe(child);
        expect(container.children).toContain(child);
        expect(child.parent).toBe(container);
      });

      it('should remove child from previous parent when adding', () => {
        const parent1 = new (Container as any)();
        const parent2 = new (Container as any)();
        const child = new (DisplayObject as any)();

        parent1.addChild(child);
        parent2.addChild(child);

        expect(parent1.children).not.toContain(child);
        expect(parent2.children).toContain(child);
        expect(child.parent).toBe(parent2);
      });

      it('should handle null child gracefully', () => {
        const container = new (Container as any)();

        const result = container.addChild(null);

        expect(result).toBeNull();
        expect(container.children.length).toBe(0);
      });

      it('should add multiple children', () => {
        const container = new (Container as any)();
        const child1 = new (DisplayObject as any)();
        const child2 = new (DisplayObject as any)();

        container.addChild(child1);
        container.addChild(child2);

        expect(container.children).toHaveLength(2);
        expect(container.children[0]).toBe(child1);
        expect(container.children[1]).toBe(child2);
      });
    });

    describe('removeChild', () => {
      it('should remove child and clear parent reference', () => {
        const container = new (Container as any)();
        const child = new (DisplayObject as any)();

        container.addChild(child);
        const result = container.removeChild(child);

        expect(result).toBe(child);
        expect(container.children).not.toContain(child);
        expect(child.parent).toBeNull();
      });

      it('should handle removing non-existent child gracefully', () => {
        const container = new (Container as any)();
        const child = new (DisplayObject as any)();

        const result = container.removeChild(child);

        expect(result).toBe(child);
        expect(container.children.length).toBe(0);
      });

      it('should remove correct child from multiple children', () => {
        const container = new (Container as any)();
        const child1 = new (DisplayObject as any)();
        const child2 = new (DisplayObject as any)();
        const child3 = new (DisplayObject as any)();

        container.addChild(child1);
        container.addChild(child2);
        container.addChild(child3);

        container.removeChild(child2);

        expect(container.children).toHaveLength(2);
        expect(container.children).toContain(child1);
        expect(container.children).toContain(child3);
        expect(container.children).not.toContain(child2);
      });
    });

    describe('updateTransform', () => {
      it('should recursively call updateTransform on all children', () => {
        const container = new (Container as any)();
        const child1 = new (Container as any)();
        const child2 = new (Container as any)();

        const spy1 = jest.spyOn(child1, 'updateTransform');
        const spy2 = jest.spyOn(child2, 'updateTransform');

        container.addChild(child1);
        container.addChild(child2);

        container.updateTransform();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
      });

      it('should handle children without updateTransform', () => {
        const container = new (Container as any)();
        const plainChild = { parent: null };

        container.addChild(plainChild);

        expect(() => container.updateTransform()).not.toThrow();
      });
    });
  });

  describe('Sprite', () => {
    it('should initialize with anchor, scale, and texture', () => {
      const sprite = new (Sprite as any)();

      expect(sprite.anchor).toEqual({ x: 0, y: 0 });
      expect(sprite.scale).toEqual({ x: 1, y: 1 });
      expect(sprite.blendMode).toBe(0);
      expect(sprite.texture).toBeDefined();
    });

    it('should have texture with baseTexture and frame', () => {
      const sprite = new (Sprite as any)();

      expect(sprite.texture.baseTexture).toEqual({ width: 0, height: 0 });
      expect(sprite.texture.frame).toBeInstanceOf(Rectangle);
    });

    it('should inherit Container functionality', () => {
      const sprite = new (Sprite as any)();
      const child = new (DisplayObject as any)();

      sprite.addChild(child);

      expect(sprite.children).toContain(child);
    });
  });

  describe('Graphics', () => {
    it('should support method chaining for drawing operations', () => {
      const graphics = new (Graphics as any)();

      const result = graphics.clear().beginFill(0xff0000).drawRect(0, 0, 100, 100).endFill();

      expect(result).toBe(graphics);
    });

    it('should inherit Container functionality', () => {
      const graphics = new (Graphics as any)();
      const child = new (DisplayObject as any)();

      graphics.addChild(child);

      expect(graphics.children).toContain(child);
    });
  });

  describe('Rectangle (CRITICAL)', () => {
    describe('constructor', () => {
      it('should initialize with default values', () => {
        const rect = new (Rectangle as any)();

        expect(rect.x).toBe(0);
        expect(rect.y).toBe(0);
        expect(rect.width).toBe(0);
        expect(rect.height).toBe(0);
      });

      it('should initialize with provided values', () => {
        const rect = new (Rectangle as any)(10, 20, 100, 50);

        expect(rect.x).toBe(10);
        expect(rect.y).toBe(20);
        expect(rect.width).toBe(100);
        expect(rect.height).toBe(50);
      });
    });

    describe('clone() and pad()', () => {
      it('should clone rectangle with identical dimensions', () => {
        const rect = new (Rectangle as any)(10, 20, 30, 40);
        const cloned = rect.clone();

        expect(cloned).toBeInstanceOf(Rectangle);
        expect(cloned).not.toBe(rect);
        expect(cloned.x).toBe(10);
        expect(cloned.y).toBe(20);
        expect(cloned.width).toBe(30);
        expect(cloned.height).toBe(40);
      });

      it('should pad rectangle symmetrically when paddingY omitted', () => {
        const rect = new (Rectangle as any)(10, 10, 10, 10);
        rect.pad(2);

        expect(rect.x).toBe(8);
        expect(rect.y).toBe(8);
        expect(rect.width).toBe(14);
        expect(rect.height).toBe(14);
      });

      it('should pad rectangle with different X/Y paddings', () => {
        const rect = new (Rectangle as any)(10, 10, 10, 10);
        rect.pad(2, 1);

        expect(rect.x).toBe(8);
        expect(rect.y).toBe(9);
        expect(rect.width).toBe(14);
        expect(rect.height).toBe(12);
      });
    });

    describe('contains() - Basic Cases', () => {
      it('should return true for point inside rectangle', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(10, 10)).toBe(true);
      });

      it('should return false for point outside rectangle', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(25, 25)).toBe(false);
      });

      it('should return true for point at top-left corner', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(0, 0)).toBe(true);
      });
    });

    describe('contains() - Edge Cases (CRITICAL)', () => {
      it('should return false for degenerate rectangle (width = 0)', () => {
        const rect = new (Rectangle as any)(10, 10, 0, 20);

        expect(rect.contains(10, 15)).toBe(false);
        expect(rect.contains(10, 10)).toBe(false);
      });

      it('should return false for degenerate rectangle (height = 0)', () => {
        const rect = new (Rectangle as any)(10, 10, 20, 0);

        expect(rect.contains(15, 10)).toBe(false);
        expect(rect.contains(10, 10)).toBe(false);
      });

      it('should return false for point at right edge (exclusive upper bound)', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(20, 10)).toBe(false);
      });

      it('should return false for point at bottom edge (exclusive upper bound)', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(10, 20)).toBe(false);
      });

      it('should return false for point at bottom-right corner', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(20, 20)).toBe(false);
      });

      it('should return true for point one pixel before right edge', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(19, 10)).toBe(true);
      });

      it('should return true for point one pixel before bottom edge', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(10, 19)).toBe(true);
      });
    });

    describe('contains() - Negative Coordinates', () => {
      it('should handle negative rectangle coordinates', () => {
        const rect = new (Rectangle as any)(-10, -10, 20, 20);

        expect(rect.contains(0, 0)).toBe(true);
        expect(rect.contains(-5, -5)).toBe(true);
        expect(rect.contains(-11, 0)).toBe(false);
      });

      it('should handle negative point coordinates', () => {
        const rect = new (Rectangle as any)(0, 0, 20, 20);

        expect(rect.contains(-1, 10)).toBe(false);
        expect(rect.contains(10, -1)).toBe(false);
      });
    });

    describe('contains() - Large Values', () => {
      it('should handle large coordinate values', () => {
        const rect = new (Rectangle as any)(1000, 2000, 500, 300);

        expect(rect.contains(1250, 2150)).toBe(true);
        expect(rect.contains(1500, 2300)).toBe(false);
      });
    });

    describe('contains() - Floating Point', () => {
      it('should handle floating point coordinates', () => {
        const rect = new (Rectangle as any)(0.5, 0.5, 10.5, 10.5);

        expect(rect.contains(5.5, 5.5)).toBe(true);
        expect(rect.contains(0.5, 0.5)).toBe(true);
        expect(rect.contains(11, 11)).toBe(false);
      });
    });

    describe('contains() - NaN Prevention (CRITICAL)', () => {
      it('should NOT return NaN for any valid input', () => {
        const rect = new (Rectangle as any)(10, 10, 20, 20);

        const result = rect.contains(15, 15);

        expect(result).not.toBeNaN();
        expect(typeof result).toBe('boolean');
      });

      it('should handle edge case that could produce NaN', () => {
        const rect = new (Rectangle as any)(0, 0, 0, 0);

        const result = rect.contains(0, 0);

        expect(result).toBe(false);
        expect(result).not.toBeNaN();
      });
    });
  });

  describe('Point', () => {
    it('should initialize with default values', () => {
      const point = new (Point as any)();

      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    it('should initialize with provided values', () => {
      const point = new (Point as any)(10, 20);

      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
    });
  });

  describe('TextStyle', () => {
    it('should be instantiable', () => {
      const style = new PIXI.TextStyle();

      expect(style).toBeDefined();
    });
  });

  describe('BaseTexture / Texture / TilingSprite', () => {
    it('should set BaseTexture size', () => {
      const base = new (PIXI.BaseTexture as any)();
      base.setSize(320, 240);
      expect(base.width).toBe(320);
      expect(base.height).toBe(240);
    });

    it('should create Texture with default baseTexture and frame', () => {
      const tex = new (PIXI.Texture as any)();
      expect(tex.baseTexture).toBeDefined();
      expect(tex.frame).toBeInstanceOf(PIXI.Rectangle);
    });

    it('should create TilingSprite as Sprite subclass', () => {
      const tiling = new (PIXI.TilingSprite as any)();
      expect(tiling).toBeDefined();
      // Inherit Sprite's child container API
      expect(typeof tiling.addChild).toBe('function');
    });
  });

  describe('Global PIXI Namespace', () => {
    it('should expose PIXI in global scope', () => {
      expect((global as any).PIXI).toBeDefined();
      expect((global as any).PIXI).toBe(PIXI);
    });

    it('should have all required classes', () => {
      expect(PIXI.DisplayObject).toBe(DisplayObject);
      expect(PIXI.Container).toBe(Container);
      expect(PIXI.Sprite).toBe(Sprite);
      expect(PIXI.Graphics).toBe(Graphics);
      expect(PIXI.Rectangle).toBe(Rectangle);
      expect(PIXI.Point).toBe(Point);
      expect(PIXI.TextStyle).toBeDefined();
    });

    it('should have utils.EventEmitter', () => {
      expect(PIXI.utils).toBeDefined();
      expect(PIXI.utils.EventEmitter).toBeDefined();
    });

    it('should have Loader.shared', () => {
      expect(PIXI.Loader).toBeDefined();
      expect(PIXI.Loader.shared).toBeDefined();
      expect(typeof PIXI.Loader.shared.add).toBe('function');
      expect(typeof PIXI.Loader.shared.load).toBe('function');
    });

    it('should have filters.ColorMatrixFilter', () => {
      expect(PIXI.filters).toBeDefined();
      expect(PIXI.filters.ColorMatrixFilter).toBeDefined();
    });

    it('should invoke Loader.shared.load callback immediately', () => {
      const callback = jest.fn();

      PIXI.Loader.shared.load(callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('EventEmitter', () => {
    it('should have event methods that do not throw', () => {
      const emitter = new PIXI.utils.EventEmitter();

      expect(() => emitter.on()).not.toThrow();
      expect(() => emitter.off()).not.toThrow();
      expect(() => emitter.emit()).not.toThrow();
    });
  });

  describe('ColorMatrixFilter', () => {
    it('should be instantiable', () => {
      const filter = new PIXI.filters.ColorMatrixFilter();

      expect(filter).toBeDefined();
    });
  });

  describe('Integration: RPG Maker MZ Usage Patterns', () => {
    it('should support typical Sprite creation pattern', () => {
      const sprite = new PIXI.Sprite();

      sprite.x = 100;
      sprite.y = 200;
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;

      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);
      expect(sprite.anchor.x).toBe(0.5);
    });

    it('should support typical Container hierarchy pattern', () => {
      const scene = new PIXI.Container();
      const spriteset = new PIXI.Container();
      const sprite = new PIXI.Sprite();

      scene.addChild(spriteset);
      spriteset.addChild(sprite);

      expect(scene.children).toContain(spriteset);
      expect(spriteset.children).toContain(sprite);
      expect(sprite.parent).toBe(spriteset);
    });

    it('should support Window layout Rectangle usage', () => {
      // Typical Window_Base layout calculation
      const windowRect = new PIXI.Rectangle(0, 0, 816, 624);
      const padding = 12;

      const contentsRect = new PIXI.Rectangle(
        windowRect.x + padding,
        windowRect.y + padding,
        windowRect.width - padding * 2,
        windowRect.height - padding * 2
      );

      // Test hit detection
      expect(contentsRect.contains(100, 100)).toBe(true);
      expect(contentsRect.contains(10, 10)).toBe(false); // Inside padding
    });

    it('should support Graphics drawing pattern', () => {
      const graphics = new PIXI.Graphics();

      // Typical background drawing
      const result = graphics
        .clear()
        .beginFill(0x000000, 0.8)
        .drawRect(0, 0, 100, 100)
        .endFill();

      expect(result).toBe(graphics); // Method chaining works
    });
  });
});
