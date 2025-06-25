# Satori

Diagnostic nodes for ComfyUI workflows.

## What it is

When your workflow starts acting weird and you need to know what's actually happening to your data - not just guess from looking at the output.

## Nodes

### why did i break?

Analyzes IMAGE tensors and tells you:
- Brightness stats (min/max/mean/std)
- Clipping detection  
- Channel balance
- Tensor health

Drop it anywhere in your workflow when things look wrong. Get actual numbers instead of guessing.

## Installation

1. Clone or download to your ComfyUI `custom_nodes` directory
2. Restart ComfyUI
3. Look for "satori" category in the node browser

## Usage

Perfect for debugging brightness amplification, measuring control signal processing, or understanding what any part of your pipeline is doing to your image data.

Built for creative teams who need diagnostic tools that bridge technical precision with workflow accessibility.