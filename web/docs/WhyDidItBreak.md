# why did it break?

Diagnostic node that tells you what's actually happening to your image data when workflows start acting weird.

## What it does

Analyzes IMAGE tensors and gives you both visual feedback and actual numbers about:
- Brightness distribution (min/max/mean/std)
- Clipping detection (pixels hitting 0 or 1)
- Channel balance (R/G/B analysis)
- Tensor health metrics

## When to use it

Drop this node anywhere in your workflow when:
- Images look too bright/dark and you don't know why
- Colors seem off or washed out
- You suspect clipping or data corruption
- You need to measure the effect of processing nodes
- Your 400-node workflow is doing something weird

## Parameters

**image** (IMAGE): The tensor you want to analyze

**show_overlay** (BOOLEAN): Display diagnostic info overlaid on the image
- `True`: Shows brightness stats as text overlay
- `False`: Returns original image unchanged

**analysis_depth** (["quick", "thorough"]): How much to analyze
- `quick`: Basic stats (brightness, clipping, channels)
- `thorough`: + percentiles, histogram data

## Outputs

**image** (IMAGE): Original image with optional diagnostic overlay

**report** (STRING): Human-readable diagnosis like:
- "Very bright image (avg 0.89) - check for overexposure"
- "WARNING: 15.2% pixels clipped to white"
- "Color imbalance detected (R:0.45 G:0.67 B:0.32)"

**stats** (STRING): Machine-readable JSON data for logging/comparison

## Usage example

Place after ImageBlend nodes to measure brightness amplification:
```
Load Image → ImageBlend (screen mode) → why did it break? → your workflow continues...
```

The overlay shows immediate visual feedback, the report explains what's wrong, and the stats give you precise numbers for systematic analysis.

Perfect for debugging FOUC, measuring control signal processing, or just understanding what your pipeline is actually doing to your data.