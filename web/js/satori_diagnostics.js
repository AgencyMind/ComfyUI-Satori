import { app } from "../../scripts/app.js";

// Satori diagnostic extension for ComfyUI
app.registerExtension({
    name: "ComfyUI-Satori.WhyDidItBreak",
    
    async init() {
        // Add custom CSS for diagnostic displays
        const style = document.createElement("style");
        style.textContent = `
            .satori-diagnostic-widget {
                background: #1a1a1a !important;
                border: 1px solid #333 !important;
                border-radius: 4px !important;
                padding: 8px !important;
                margin: 4px 0 !important;
                font-family: 'Courier New', monospace !important;
                font-size: 11px !important;
                color: #e0e0e0 !important;
            }
            
            .satori-diagnostic-canvas {
                border: 1px solid #444 !important;
                border-radius: 2px !important;
                background: #0a0a0a !important;
            }
            
            .satori-stats-display {
                background: #111 !important;
                color: #00ff88 !important;
                font-weight: bold !important;
                line-height: 1.2 !important;
                white-space: pre-wrap !important;
            }
            
            .satori-warning {
                color: #ff6b35 !important;
                font-weight: bold !important;
            }
            
            .satori-normal {
                color: #88cc88 !important;
            }
        `;
        document.head.appendChild(style);
    },
    
    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "WhyDidItBreak") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                // Create diagnostic canvas for visual display
                const diagnosticCanvas = document.createElement("canvas");
                diagnosticCanvas.width = 320;
                diagnosticCanvas.height = 240;
                diagnosticCanvas.className = "satori-diagnostic-canvas";
                
                // Create stats display container
                const statsContainer = document.createElement("div");
                statsContainer.className = "satori-stats-display";
                statsContainer.style.width = "320px";
                statsContainer.style.height = "120px";
                statsContainer.style.overflow = "auto";
                statsContainer.textContent = "Awaiting image analysis...";
                
                // Add widgets using verified Q2 2025 API
                this.addDOMWidget("visual_diagnostics", "CANVAS", diagnosticCanvas, {
                    hideOnZoom: false,
                    getHeight: () => 240
                });
                
                this.addDOMWidget("stats_display", "TEXT", statsContainer, {
                    hideOnZoom: false,
                    getHeight: () => 120
                });
                
                // Store references for updates
                this.diagnosticCanvas = diagnosticCanvas;
                this.statsContainer = statsContainer;
                
                // Initialize canvas context
                this.canvasCtx = diagnosticCanvas.getContext('2d');
                this.canvasCtx.fillStyle = '#0a0a0a';
                this.canvasCtx.fillRect(0, 0, 320, 240);
                
                // Draw initial placeholder
                this.canvasCtx.fillStyle = '#333';
                this.canvasCtx.font = '12px Courier New';
                this.canvasCtx.fillText('Satori diagnostic ready', 10, 20);
                this.canvasCtx.fillText('Feed me an image tensor...', 10, 40);
            };
            
            // Hook into execution to update displays
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                if (onExecuted) {
                    onExecuted.apply(this, arguments);
                }
                
                // Update diagnostic displays when node executes
                if (message && this.diagnosticCanvas && this.statsContainer) {
                    this.updateDiagnosticDisplays(message);
                }
            };
            
            // Method to update diagnostic displays
            nodeType.prototype.updateDiagnosticDisplays = function(message) {
                try {
                    // Parse stats from node output (assuming it's in message data)
                    let stats = null;
                    let report = "Analysis complete";
                    
                    // Try to extract stats from the node's outputs
                    if (this.outputs && this.outputs.length >= 3) {
                        // Look for stats in the node's widget values or outputs
                        const widgets = this.widgets || [];
                        for (let widget of widgets) {
                            if (widget.name === "stats_display" && widget.value) {
                                try {
                                    stats = JSON.parse(widget.value);
                                    break;
                                } catch (e) {
                                    // Not JSON, continue
                                }
                            }
                        }
                    }
                    
                    if (stats) {
                        this.drawHistogram(stats);
                        this.updateStatsDisplay(stats, report);
                    } else {
                        // Fallback display
                        this.drawPlaceholder();
                        this.statsContainer.textContent = "Analysis complete - check node outputs";
                        this.statsContainer.className = "satori-stats-display satori-normal";
                    }
                } catch (error) {
                    console.error("Satori diagnostic update error:", error);
                    this.drawError();
                    this.statsContainer.textContent = `Error: ${error.message}`;
                    this.statsContainer.className = "satori-stats-display satori-warning";
                }
            };
            
            // Method to draw histogram visualization
            nodeType.prototype.drawHistogram = function(stats) {
                const ctx = this.canvasCtx;
                const canvas = this.diagnosticCanvas;
                
                // Clear canvas
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw title
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 14px Courier New';
                ctx.fillText('Satori Diagnostics', 10, 20);
                
                // Draw basic stats
                ctx.font = '11px Courier New';
                ctx.fillStyle = '#e0e0e0';
                ctx.fillText(`Mean: ${stats.mean?.toFixed(3) || 'N/A'}`, 10, 40);
                ctx.fillText(`Min: ${stats.min?.toFixed(3) || 'N/A'}`, 100, 40);
                ctx.fillText(`Max: ${stats.max?.toFixed(3) || 'N/A'}`, 180, 40);
                ctx.fillText(`Std: ${stats.std?.toFixed(3) || 'N/A'}`, 250, 40);
                
                // Draw clipping warnings
                if (stats.clipped_whites > 0.01) {
                    ctx.fillStyle = '#ff6b35';
                    ctx.fillText(`⚠ WHITE CLIP: ${(stats.clipped_whites * 100).toFixed(1)}%`, 10, 60);
                }
                
                if (stats.clipped_blacks > 0.01) {
                    ctx.fillStyle = '#ff6b35';
                    ctx.fillText(`⚠ BLACK CLIP: ${(stats.clipped_blacks * 100).toFixed(1)}%`, 10, 80);
                }
                
                // Draw histogram if available
                if (stats.histogram && stats.histogram.counts) {
                    this.drawHistogramBars(ctx, stats.histogram, 10, 100, 300, 120);
                }
                
                // Draw channel bars
                if (stats.channels) {
                    this.drawChannelBars(ctx, stats.channels, 10, canvas.height - 30);
                }
            };
            
            // Method to draw histogram bars
            nodeType.prototype.drawHistogramBars = function(ctx, histogram, x, y, width, height) {
                const counts = histogram.counts;
                const maxCount = Math.max(...counts);
                const barWidth = width / counts.length;
                
                ctx.fillStyle = '#333';
                ctx.fillRect(x, y, width, height);
                
                // Draw histogram bars
                for (let i = 0; i < counts.length; i++) {
                    const barHeight = (counts[i] / maxCount) * height;
                    const barX = x + i * barWidth;
                    const barY = y + height - barHeight;
                    
                    // Color based on brightness level
                    const brightness = i / counts.length;
                    if (brightness < 0.1) {
                        ctx.fillStyle = '#4a90e2'; // Blue for shadows
                    } else if (brightness > 0.9) {
                        ctx.fillStyle = '#e24a4a'; // Red for highlights
                    } else {
                        ctx.fillStyle = '#888'; // Gray for midtones
                    }
                    
                    ctx.fillRect(barX, barY, barWidth - 1, barHeight);
                }
                
                // Draw histogram outline
                ctx.strokeStyle = '#666';
                ctx.strokeRect(x, y, width, height);
            };
            
            // Method to draw channel balance bars
            nodeType.prototype.drawChannelBars = function(ctx, channels, x, y) {
                const colors = ['#ff4444', '#44ff44', '#4444ff'];
                const labels = ['R', 'G', 'B'];
                const values = [channels.r_mean, channels.g_mean, channels.b_mean];
                const barWidth = 80;
                const barHeight = 8;
                const spacing = 90;
                
                for (let i = 0; i < 3; i++) {
                    const barX = x + i * spacing;
                    const value = values[i];
                    
                    // Background
                    ctx.fillStyle = '#222';
                    ctx.fillRect(barX, y, barWidth, barHeight);
                    
                    // Value bar
                    ctx.fillStyle = colors[i];
                    ctx.fillRect(barX, y, value * barWidth, barHeight);
                    
                    // Label
                    ctx.fillStyle = '#ccc';
                    ctx.font = '10px Courier New';
                    ctx.fillText(`${labels[i]}: ${value.toFixed(2)}`, barX, y - 2);
                }
            };
            
            // Method to draw placeholder
            nodeType.prototype.drawPlaceholder = function() {
                const ctx = this.canvasCtx;
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 320, 240);
                
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 14px Courier New';
                ctx.fillText('Satori Diagnostics', 10, 20);
                
                ctx.fillStyle = '#666';
                ctx.font = '12px Courier New';
                ctx.fillText('Connect an IMAGE input', 10, 120);
                ctx.fillText('to see tensor analysis', 10, 140);
            };
            
            // Method to draw error state
            nodeType.prototype.drawError = function() {
                const ctx = this.canvasCtx;
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 320, 240);
                
                ctx.fillStyle = '#ff6b35';
                ctx.font = 'bold 14px Courier New';
                ctx.fillText('Satori Error', 10, 20);
                
                ctx.fillStyle = '#ff6b35';
                ctx.font = '12px Courier New';
                ctx.fillText('Check console for details', 10, 120);
            };
            
            // Method to update stats text display
            nodeType.prototype.updateStatsDisplay = function(stats, report) {
                let display = `SATORI ANALYSIS\n\n`;
                display += `Brightness: ${stats.mean?.toFixed(3)} (${this.getBrightnessCategory(stats.mean)})\n`;
                display += `Range: ${stats.min?.toFixed(3)} → ${stats.max?.toFixed(3)}\n`;
                display += `Contrast: ${stats.std?.toFixed(3)}\n\n`;
                
                if (stats.channels) {
                    display += `Channels:\n`;
                    display += `  R: ${stats.channels.r_mean?.toFixed(3)}\n`;
                    display += `  G: ${stats.channels.g_mean?.toFixed(3)}\n`;
                    display += `  B: ${stats.channels.b_mean?.toFixed(3)}\n\n`;
                }
                
                if (stats.clipped_whites > 0.001 || stats.clipped_blacks > 0.001) {
                    display += `Clipping:\n`;
                    if (stats.clipped_whites > 0.001) {
                        display += `  White: ${(stats.clipped_whites * 100).toFixed(1)}%\n`;
                    }
                    if (stats.clipped_blacks > 0.001) {
                        display += `  Black: ${(stats.clipped_blacks * 100).toFixed(1)}%\n`;
                    }
                    display += `\n`;
                }
                
                display += `Report: ${report}`;
                
                this.statsContainer.textContent = display;
                
                // Set class based on warnings
                if (stats.clipped_whites > 0.05 || stats.clipped_blacks > 0.05 || 
                    stats.mean > 0.9 || stats.mean < 0.1) {
                    this.statsContainer.className = "satori-stats-display satori-warning";
                } else {
                    this.statsContainer.className = "satori-stats-display satori-normal";
                }
            };
            
            // Helper method for brightness categorization
            nodeType.prototype.getBrightnessCategory = function(mean) {
                if (mean > 0.8) return "very bright";
                if (mean > 0.6) return "bright";
                if (mean > 0.4) return "normal";
                if (mean > 0.2) return "dark";
                return "very dark";
            };
        }
    }
});