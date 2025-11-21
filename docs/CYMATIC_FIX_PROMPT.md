# Fix Cymatic Visualization Issues

## Problem
The cymatic visualization in `oscilloscope-v2.js` has two critical issues:
1. **Size Issue**: The pattern only renders in a quarter of the oscilloscope canvas area
2. **Blurriness**: The pattern is blurry/pixelated instead of sharp and crisp

## Current State
- File: `oscilloscope-v2.js`
- The cymatic visualization uses a field-based approach with `cymaticField`, `cymaticFieldWidth`, `cymaticFieldHeight`
- Currently uses `cymaticFieldScale = 1` (should be full resolution)
- Rendering happens in `renderCymaticField()` method

## What Needs to be Fixed

### Issue 1: Size Problem
The pattern should fill the **entire** canvas area (`this.width` × `this.height`), but it's only showing in a quarter. This suggests:
- The field resolution might not match the canvas size
- The rendering loop might not be covering all pixels
- There might be incorrect coordinate mapping

### Issue 2: Blurriness
The pattern should be **sharp and crisp** like the Chladni Patterns Generator (monochromatic patterns with clear nodal lines). Currently it's blurry, which suggests:
- Image smoothing might be enabled
- Pixel mapping might be incorrect
- Field resolution might be too low

## Key Code Locations

1. **Field Initialization** (around line 30):
   - `this.cymaticFieldScale` - should be 1 for full resolution
   - `resizeCymaticField()` method - sets field dimensions

2. **Rendering Method** (around line 763):
   - `renderCymaticField()` - renders the pattern to canvas
   - Should iterate over ALL canvas pixels (`this.width` × `this.height`)
   - Should use `imageSmoothingEnabled = false` for crisp rendering
   - Should use direct pixel mapping (1:1) if field matches canvas size

## Requirements

1. **Full Canvas Coverage**: 
   - Pattern must fill entire oscilloscope area
   - Rendering loop should cover `py = 0` to `this.height` and `px = 0` to `this.width`

2. **Sharp Rendering**:
   - Disable image smoothing: `this.ctx.imageSmoothingEnabled = false`
   - Use ImageData for pixel-perfect rendering
   - Ensure field resolution matches canvas size exactly

3. **Performance**:
   - Field should be computed at full resolution (scale = 1)
   - Direct pixel mapping without scaling/interpolation

## Expected Result
- Chladni patterns fill the entire oscilloscope canvas
- Patterns are sharp, crisp, and clear (no blurriness)
- Monochromatic style (grayscale on black background)
- Clear nodal lines visible

## Files to Check
- `oscilloscope-v2.js` - main file with cymatic visualization
- Look for `renderCymaticField()` and `resizeCymaticField()` methods
- Check `cymaticFieldScale` initialization

