import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import io
import os

# Web directory for custom UI components
WEB_DIRECTORY = "./web"

class WhyDidItBreak:
    """
    Diagnostic node that analyzes IMAGE tensors and provides both visual and numerical feedback
    about brightness, channels, clipping, and tensor health.
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
            },
            "optional": {
                "show_overlay": ("BOOLEAN", {"default": True}),
                "analysis_depth": (["quick", "thorough"], {"default": "quick"}),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING", "STRING")
    RETURN_NAMES = ("image", "report", "stats")
    FUNCTION = "analyze"
    CATEGORY = "ComfyUI-Satori"
    
    def analyze(self, image, show_overlay=True, analysis_depth="quick"):
        """
        Analyze IMAGE tensor and return diagnostic information
        """
        # Convert tensor to numpy for analysis
        if isinstance(image, torch.Tensor):
            # ComfyUI IMAGE format is [batch, height, width, channels]
            img_np = image.cpu().numpy()
        else:
            img_np = np.array(image)
        
        # Handle batch dimension
        if len(img_np.shape) == 4:
            img_np = img_np[0]  # Take first image in batch
        
        # Ensure we have [H, W, C] format
        if len(img_np.shape) != 3 or img_np.shape[2] != 3:
            return (image, "Error: Expected RGB image with shape [H, W, 3]", "")
        
        # Basic statistics
        stats = self._calculate_stats(img_np, analysis_depth)
        
        # Generate human-readable report
        report = self._generate_report(stats)
        
        # Create output image with optional overlay
        if show_overlay:
            output_image = self._create_overlay(image, img_np, stats)
        else:
            output_image = image
        
        # Generate machine-readable stats
        stats_str = self._format_stats(stats)
        
        return (output_image, report, stats_str)
    
    def _calculate_stats(self, img_np, depth):
        """Calculate image statistics"""
        stats = {}
        
        # Basic brightness stats
        stats['mean'] = float(np.mean(img_np))
        stats['min'] = float(np.min(img_np))
        stats['max'] = float(np.max(img_np))
        stats['std'] = float(np.std(img_np))
        
        # Clipping analysis
        stats['clipped_blacks'] = float(np.mean(img_np == 0.0))
        stats['clipped_whites'] = float(np.mean(img_np == 1.0))
        
        # Channel analysis
        stats['channels'] = {
            'r_mean': float(np.mean(img_np[:, :, 0])),
            'g_mean': float(np.mean(img_np[:, :, 1])),
            'b_mean': float(np.mean(img_np[:, :, 2]))
        }
        
        if depth == "thorough":
            # Percentile analysis
            stats['percentiles'] = {
                '1%': float(np.percentile(img_np, 1)),
                '5%': float(np.percentile(img_np, 5)),
                '25%': float(np.percentile(img_np, 25)),
                '75%': float(np.percentile(img_np, 75)),
                '95%': float(np.percentile(img_np, 95)),
                '99%': float(np.percentile(img_np, 99))
            }
            
            # Histogram data
            hist, bins = np.histogram(img_np, bins=50, range=(0, 1))
            stats['histogram'] = {
                'counts': hist.tolist(),
                'bins': bins.tolist()
            }
        
        return stats
    
    def _generate_report(self, stats):
        """Generate human-readable diagnostic report"""
        report = []
        
        # Brightness analysis
        mean_bright = stats['mean']
        if mean_bright > 0.8:
            report.append(f"Very bright image (avg {mean_bright:.2f}) - check for overexposure")
        elif mean_bright < 0.2:
            report.append(f"Very dark image (avg {mean_bright:.2f}) - check if intentional")
        else:
            report.append(f"Brightness looks normal (avg {mean_bright:.2f})")
        
        # Clipping warnings
        if stats['clipped_whites'] > 0.01:  # More than 1% clipped
            report.append(f"WARNING: {stats['clipped_whites']*100:.1f}% pixels clipped to white")
        
        if stats['clipped_blacks'] > 0.01:
            report.append(f"WARNING: {stats['clipped_blacks']*100:.1f}% pixels clipped to black")
        
        # Channel balance
        channels = stats['channels']
        r, g, b = channels['r_mean'], channels['g_mean'], channels['b_mean']
        max_diff = max(r, g, b) - min(r, g, b)
        
        if max_diff > 0.1:
            report.append(f"Color imbalance detected (R:{r:.2f} G:{g:.2f} B:{b:.2f})")
        else:
            report.append("Channels look balanced")
        
        # Contrast analysis
        if stats['std'] < 0.05:
            report.append("Very low contrast - image might be washed out")
        elif stats['std'] > 0.3:
            report.append("Very high contrast - check for artifacts")
        
        return " | ".join(report)
    
    def _create_overlay(self, original_tensor, img_np, stats):
        """Create visual diagnostic overlay on the image"""
        h, w, c = img_np.shape
        
        # Create brightness heatmap
        brightness = np.mean(img_np, axis=2)  # Convert to grayscale
        
        # Create overlay image with multiple diagnostic elements
        overlay = np.zeros((h, w, 4), dtype=np.float32)  # RGBA
        
        # 1. Clipping visualization - highlight problem areas
        if stats['clipped_whites'] > 0.001:  # If any white clipping
            white_clipped = np.all(img_np >= 0.99, axis=2)
            overlay[white_clipped] = [1.0, 0.2, 0.2, 0.6]  # Red overlay
        
        if stats['clipped_blacks'] > 0.001:  # If any black clipping
            black_clipped = np.all(img_np <= 0.01, axis=2)
            overlay[black_clipped] = [0.2, 0.2, 1.0, 0.6]  # Blue overlay
        
        # 2. Create histogram in corner
        hist_size = min(w//4, h//4, 120)
        hist_x = w - hist_size - 10
        hist_y = 10
        
        self._draw_histogram(overlay, img_np, hist_x, hist_y, hist_size, stats)
        
        # 3. Channel balance indicators
        self._draw_channel_bars(overlay, w, h, stats)
        
        # 4. Critical warnings only (minimal text)
        warnings = []
        if stats['clipped_whites'] > 0.05:
            warnings.append(f"WHITE CLIP {stats['clipped_whites']*100:.0f}%")
        if stats['clipped_blacks'] > 0.05:
            warnings.append(f"BLACK CLIP {stats['clipped_blacks']*100:.0f}%")
        if stats['mean'] > 0.9:
            warnings.append("OVEREXPOSED")
        elif stats['mean'] < 0.1:
            warnings.append("UNDEREXPOSED")
        
        if warnings:
            self._draw_warnings(overlay, warnings, w, h)
        
        # Convert to PIL and composite
        img_pil = Image.fromarray((img_np * 255).astype(np.uint8))
        overlay_pil = Image.fromarray((overlay * 255).astype(np.uint8), 'RGBA')
        
        result = Image.alpha_composite(img_pil.convert('RGBA'), overlay_pil)
        
        # Convert back to tensor
        result_np = np.array(result.convert('RGB')).astype(np.float32) / 255.0
        return torch.from_numpy(result_np).unsqueeze(0)
    
    def _draw_histogram(self, overlay, img_np, x, y, size, stats):
        """Draw small histogram in corner"""
        # Calculate histogram
        hist, bins = np.histogram(img_np, bins=32, range=(0, 1))
        hist = hist / np.max(hist)  # Normalize
        
        # Draw histogram background
        overlay[y:y+size, x:x+size] = [0, 0, 0, 0.7]
        
        # Draw histogram bars
        bar_width = size // 32
        for i, height in enumerate(hist):
            bar_height = int(height * size * 0.8)
            bar_x = x + i * bar_width
            bar_y = y + size - bar_height
            
            # Color bars based on brightness level
            brightness_level = i / 32
            if brightness_level < 0.1:
                color = [0.3, 0.3, 1.0, 0.8]  # Blue for shadows
            elif brightness_level > 0.9:
                color = [1.0, 0.3, 0.3, 0.8]  # Red for highlights
            else:
                color = [0.8, 0.8, 0.8, 0.8]  # Gray for midtones
            
            if bar_height > 0:
                overlay[bar_y:y+size, bar_x:bar_x+bar_width] = color
    
    def _draw_channel_bars(self, overlay, w, h, stats):
        """Draw R/G/B channel indicators"""
        channels = stats['channels']
        bar_height = 8
        bar_width = 60
        spacing = 12
        start_y = h - 40
        start_x = 10
        
        colors = [(1.0, 0.3, 0.3, 0.8), (0.3, 1.0, 0.3, 0.8), (0.3, 0.3, 1.0, 0.8)]
        values = [channels['r_mean'], channels['g_mean'], channels['b_mean']]
        
        for i, (color, value) in enumerate(zip(colors, values)):
            y = start_y + i * spacing
            # Background bar
            overlay[y:y+bar_height, start_x:start_x+bar_width] = [0, 0, 0, 0.6]
            # Value bar
            value_width = int(value * bar_width)
            overlay[y:y+bar_height, start_x:start_x+value_width] = color
    
    def _draw_warnings(self, overlay, warnings, w, h):
        """Draw critical warnings as colored indicators"""
        # Simple colored warning dots in top-right
        dot_size = 12
        spacing = 16
        start_x = w - 25
        start_y = 10
        
        warning_color = [1.0, 0.8, 0.0, 0.9]  # Amber warning
        
        for i, warning in enumerate(warnings[:3]):  # Max 3 warnings
            y = start_y + i * spacing
            overlay[y:y+dot_size, start_x:start_x+dot_size] = warning_color
    
    def _format_stats(self, stats):
        """Format statistics as machine-readable string"""
        import json
        return json.dumps(stats, indent=2)


# Node registration
NODE_CLASS_MAPPINGS = {
    "WhyDidItBreak": WhyDidItBreak
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WhyDidItBreak": "why did it break?"
}