"""
ComfyUI-Satori: Investigative Infrastructure for Creative Workflows
Based on the Green Tree Restaurant principle - create conditions for discovery
"""

import torch
import numpy as np
import json
from collections import deque
import time

# Web directory for custom UI components
WEB_DIRECTORY = "./web"

class InvestigationContext:
    """Tracks data through pipeline stages for pattern discovery"""
    def __init__(self):
        self.history = deque(maxlen=100)  # Rolling window of measurements
        self.patterns = {}  # Discovered patterns
        self.timestamps = deque(maxlen=100)  # Timing data
        
    def record(self, data):
        """Record investigation data without interpretation"""
        self.history.append(data)
        self.timestamps.append(time.time())
        
    def get_temporal_delta(self, frames_back=1):
        """Compare current with previous states"""
        if len(self.history) >= frames_back + 1:
            return {
                'current': self.history[-1],
                'previous': self.history[-frames_back-1],
                'frames_back': frames_back
            }
        return None

# Per-workflow investigation contexts to prevent data leakage
investigation_contexts = {}
MAX_CONTEXTS = 10  # Prevent memory leak from abandoned workflows

def cleanup_old_contexts():
    """Remove oldest contexts if we exceed maximum"""
    if len(investigation_contexts) > MAX_CONTEXTS:
        # Remove oldest half
        sorted_keys = sorted(investigation_contexts.keys())
        for key in sorted_keys[:len(sorted_keys)//2]:
            del investigation_contexts[key]

class WhyDidItBreak:
    """
    Investigative node that reveals what's happening in your workflow
    without prescribing what you should look for
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "investigation_id": ("STRING", {"default": "investigation_1"}),
            },
            "optional": {
                "analysis_modes": ("STRING", {
                    "default": "tensor,temporal,patterns",
                    "multiline": False
                }),
                "frame_memory": ("INT", {"default": 10, "min": 1, "max": 100}),
            }
        }
    
    RETURN_TYPES = ("IMAGE",)  # Only passthrough - display happens on node
    RETURN_NAMES = ("image",)
    FUNCTION = "investigate"
    CATEGORY = "ComfyUI-Satori"
    OUTPUT_NODE = True  # Important: allows execution without output connections
    
    def investigate(self, image, investigation_id, analysis_modes="tensor,temporal,patterns", frame_memory=10):
        """
        Investigate without assumptions about what matters
        All display happens via JavaScript widgets
        """
        
        # Parse analysis modes (limit to prevent DoS)
        modes = [m.strip() for m in analysis_modes.split(',')[:10]]  # Max 10 modes
        
        # Sanitize investigation_id to prevent XSS
        safe_id = str(investigation_id)[:50].replace('<', '').replace('>', '').replace('"', '').replace("'", '')
        
        # Prepare investigation data
        investigation_data = {
            'id': safe_id,
            'timestamp': time.time(),
            'modes': modes,
            'findings': {}
        }
        
        # Tensor investigation - what's actually in the data?
        if 'tensor' in modes:
            investigation_data['findings']['tensor'] = self._investigate_tensor(image)
            
        # Get or create workflow-specific context
        workflow_id = getattr(self, 'workflow_id', 'default')
        if workflow_id not in investigation_contexts:
            cleanup_old_contexts()  # Prevent memory leak
            investigation_contexts[workflow_id] = InvestigationContext()
        context = investigation_contexts[workflow_id]
        
        # Temporal investigation - what changed?
        if 'temporal' in modes and len(context.history) > 0:
            investigation_data['findings']['temporal'] = self._investigate_temporal(image, context)
            
        # Pattern investigation - what repeats or stands out?
        if 'patterns' in modes:
            investigation_data['findings']['patterns'] = self._investigate_patterns(image)
            
        # Record for future investigations
        context.record({
            'tensor_hash': self._tensor_hash(image),
            'stats': investigation_data['findings'].get('tensor', {}),
            'investigation_id': safe_id
        })
        
        # Store data for JavaScript widget to display
        self.investigation_data = investigation_data
        
        # Return image unchanged - investigation is about observation not modification
        return {"ui": {"investigation_data": investigation_data}, "result": (image,)}
    
    def _investigate_tensor(self, tensor):
        """Reveal tensor characteristics without interpretation"""
        # Convert to numpy for analysis
        if isinstance(tensor, torch.Tensor):
            data = tensor.cpu().numpy()
        else:
            data = np.array(tensor)
            
        # Get basic shape info
        findings = {
            'shape': list(data.shape),
            'dtype': str(data.dtype),
            'device': str(tensor.device) if isinstance(tensor, torch.Tensor) else 'cpu',
        }
        
        # Statistical landscape
        flat_data = data.flatten()
        findings['landscape'] = {
            'min': float(np.min(flat_data)),
            'max': float(np.max(flat_data)),
            'mean': float(np.mean(flat_data)),
            'median': float(np.median(flat_data)),
            'std': float(np.std(flat_data)),
        }
        
        # Distribution insights
        findings['distribution'] = {
            'unique_values': int(np.unique(flat_data).size),
            'zeros': float(np.sum(flat_data == 0) / flat_data.size),
            'ones': float(np.sum(flat_data == 1) / flat_data.size),
        }
        
        # Percentile mapping
        percentiles = [1, 5, 25, 50, 75, 95, 99]
        findings['percentiles'] = {
            f'p{p}': float(np.percentile(flat_data, p)) 
            for p in percentiles
        }
        
        # Channel investigation if applicable
        if len(data.shape) >= 3 and data.shape[-1] in [3, 4]:
            findings['channels'] = self._investigate_channels(data)
            
        return findings
    
    def _investigate_temporal(self, tensor, context):
        """Discover changes over time without assuming what matters"""
        current_hash = self._tensor_hash(tensor)
        
        # Find how this differs from recent history
        findings = {
            'changes_detected': [],
            'stability_score': 0.0,
            'pattern_breaks': []
        }
        
        # Look for changes at different time scales
        for frames_back in [1, 5, 10]:
            delta = context.get_temporal_delta(frames_back)
            if delta:
                change_magnitude = self._calculate_change(
                    delta['current'].get('stats', {}),
                    delta['previous'].get('stats', {})
                )
                findings['changes_detected'].append({
                    'frames_back': frames_back,
                    'magnitude': change_magnitude
                })
                
        return findings
    
    def _investigate_patterns(self, tensor):
        """Look for patterns without prescribing what patterns mean"""
        findings = {
            'spatial_patterns': [],
            'value_clusters': [],
            'anomaly_scores': {}
        }
        
        # This is where pattern detection would happen
        # For now, return structure for future expansion
        
        return findings
    
    def _investigate_channels(self, data):
        """Channel-wise investigation"""
        channels = {}
        channel_names = ['red', 'green', 'blue', 'alpha'] if data.shape[-1] == 4 else ['red', 'green', 'blue']
        
        for i, name in enumerate(channel_names[:data.shape[-1]]):
            channel_data = data[..., i].flatten()
            channels[name] = {
                'mean': float(np.mean(channel_data)),
                'std': float(np.std(channel_data)),
                'active': float(np.sum(channel_data > 0.01) / channel_data.size)
            }
            
        # Channel relationships
        if data.shape[-1] >= 3:
            channels['balance'] = {
                'rg_correlation': float(np.corrcoef(data[..., 0].flatten(), data[..., 1].flatten())[0, 1]),
                'gb_correlation': float(np.corrcoef(data[..., 1].flatten(), data[..., 2].flatten())[0, 1]),
                'rb_correlation': float(np.corrcoef(data[..., 0].flatten(), data[..., 2].flatten())[0, 1]),
            }
            
        return channels
    
    def _tensor_hash(self, tensor):
        """Create a hash for comparing tensors"""
        if isinstance(tensor, torch.Tensor):
            return hash(tuple(tensor.shape) + (tensor.sum().item(),))
        else:
            return hash(tuple(tensor.shape) + (np.sum(tensor),))
    
    def _calculate_change(self, current_stats, previous_stats):
        """Calculate magnitude of change between states"""
        if not current_stats or not previous_stats:
            return 0.0
            
        # Compare landscapes
        current_landscape = current_stats.get('landscape', {})
        previous_landscape = previous_stats.get('landscape', {})
        
        changes = []
        for key in ['mean', 'std', 'min', 'max']:
            if key in current_landscape and key in previous_landscape:
                if previous_landscape[key] != 0:
                    change = abs(current_landscape[key] - previous_landscape[key]) / abs(previous_landscape[key])
                    changes.append(change)
                    
        return float(np.mean(changes)) if changes else 0.0


class TemporalInvestigator:
    """
    Specialized node for frame-by-frame investigation
    Useful for FOUC-type issues where timing matters
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "frame_identifier": ("STRING", {"default": ""}),
            },
            "optional": {
                "reference_frame": ("INT", {"default": 0, "min": 0}),
                "comparison_window": ("INT", {"default": 5, "min": 1, "max": 50}),
            }
        }
    
    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("image",)
    FUNCTION = "investigate_temporal"
    CATEGORY = "ComfyUI-Satori"
    OUTPUT_NODE = True
    
    def investigate_temporal(self, image, frame_identifier="", reference_frame=0, comparison_window=5):
        """
        Track changes across frames without assuming what changes matter
        """
        # Implementation focused on temporal patterns
        # Display happens via widgets
        
        return (image,)


# Node registration
NODE_CLASS_MAPPINGS = {
    "WhyDidItBreak": WhyDidItBreak,
    "TemporalInvestigator": TemporalInvestigator,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WhyDidItBreak": "why did it break?",
    "TemporalInvestigator": "temporal investigator",
}