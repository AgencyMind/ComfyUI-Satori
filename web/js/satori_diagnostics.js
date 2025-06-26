import { app } from "../../scripts/app.js";

// Retrotech color schemes
const RETROTECH_COLORS = {
    // Terminal phosphor
    phosphor_green: '#00ff41',
    phosphor_amber: '#ffb700',
    
    // Y2K/Vaporwave
    vapor_cyan: '#00ffff',
    vapor_magenta: '#ff00ff',
    matrix_green: '#39ff14',
    
    // ANSI palette
    ansi_red: '#ff5555',
    ansi_yellow: '#ffff55',
    ansi_green: '#55ff55',
    ansi_cyan: '#55ffff',
    ansi_blue: '#5555ff',
    ansi_magenta: '#ff55ff',
    
    // Cassette futurism
    tape_brown: '#8b6f47',
    chrome_silver: '#c0c0c0',
    led_orange: '#ff6600',
    
    // Background/structure
    crt_black: '#0a0a0a',
    terminal_bg: '#1a1a1a',
    grid_lines: '#333333'
};

// ASCII/Unicode blocks for visualization
const BLOCKS = {
    full: '█',
    dark: '▓',
    medium: '▒',
    light: '░',
    empty: ' ',
    
    // Box drawing
    h_line: '─',
    v_line: '│',
    corner_tl: '┌',
    corner_tr: '┐',
    corner_bl: '└',
    corner_br: '┘',
    cross: '┼',
    t_down: '┬',
    t_up: '┴',
    t_right: '├',
    t_left: '┤'
};

// Satori diagnostic extension
app.registerExtension({
    name: "ComfyUI-Satori.Diagnostics",
    
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "WhyDidItBreak" || nodeData.name === "TemporalInvestigator") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // Create investigative display widget
                const container = document.createElement("div");
                container.className = "satori-investigation-container";
                container.style.cssText = `
                    background: ${RETROTECH_COLORS.terminal_bg};
                    border: 1px solid ${RETROTECH_COLORS.grid_lines};
                    border-radius: 2px;
                    padding: 8px;
                    margin: 4px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: ${RETROTECH_COLORS.phosphor_green};
                    min-height: 120px;
                    position: relative;
                    overflow: hidden;
                `;
                
                // Add scanline effect
                const scanlines = document.createElement("div");
                scanlines.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 255, 65, 0.03) 2px,
                        rgba(0, 255, 65, 0.03) 4px
                    );
                    pointer-events: none;
                    z-index: 1;
                `;
                container.appendChild(scanlines);
                
                // Main display area
                const display = document.createElement("div");
                display.className = "satori-display";
                display.style.cssText = `
                    position: relative;
                    z-index: 2;
                `;
                container.appendChild(display);
                
                // Add the widget to the node
                this.addDOMWidget("satori_investigation", "div", container, {
                    getValue: () => {
                        return this.investigation_data || {};
                    },
                    setValue: (v) => {
                        this.investigation_data = v;
                        this.updateDisplay();
                    },
                    onDraw: () => {
                        this.updateDisplay();
                    }
                });
                
                // Store references
                this.satori_display = display;
                this.satori_container = container;
                
                // Update display method
                this.updateDisplay = function() {
                    if (!this.investigation_data || !this.satori_display) return;
                    
                    const data = this.investigation_data;
                    const findings = data.findings || {};
                    
                    // Clear current display
                    this.satori_display.innerHTML = '';
                    
                    // Header
                    const header = document.createElement("div");
                    header.style.cssText = `
                        color: ${RETROTECH_COLORS.phosphor_amber};
                        margin-bottom: 8px;
                        text-shadow: 0 0 8px ${RETROTECH_COLORS.phosphor_amber};
                    `;
                    header.textContent = `◆ INVESTIGATION: ${data.id || 'unnamed'}`;
                    this.satori_display.appendChild(header);
                    
                    // Display findings based on modes
                    if (findings.tensor) {
                        this.displayTensorFindings(findings.tensor);
                    }
                    
                    if (findings.temporal) {
                        this.displayTemporalFindings(findings.temporal);
                    }
                    
                    if (findings.patterns) {
                        this.displayPatternFindings(findings.patterns);
                    }
                };
                
                // Tensor findings display
                this.displayTensorFindings = function(tensor) {
                    const section = document.createElement("div");
                    section.style.marginTop = "8px";
                    
                    // ASCII histogram
                    if (tensor.landscape) {
                        const histogram = this.createASCIIHistogram(tensor);
                        section.appendChild(histogram);
                    }
                    
                    // Channel balance bars
                    if (tensor.channels) {
                        const channels = this.createChannelBars(tensor.channels);
                        section.appendChild(channels);
                    }
                    
                    // Stats readout
                    const stats = this.createStatsReadout(tensor);
                    section.appendChild(stats);
                    
                    this.satori_display.appendChild(section);
                };
                
                // ASCII histogram visualization
                this.createASCIIHistogram = function(tensor) {
                    const container = document.createElement("div");
                    container.style.cssText = `
                        margin: 8px 0;
                        font-size: 10px;
                        line-height: 1.0;
                    `;
                    
                    const landscape = tensor.landscape;
                    const range = landscape.max - landscape.min;
                    const mean_normalized = (landscape.mean - landscape.min) / range;
                    
                    // Create histogram bar
                    const bar_width = 20;
                    const filled = Math.floor(mean_normalized * bar_width);
                    const bar = BLOCKS.full.repeat(filled) + BLOCKS.light.repeat(bar_width - filled);
                    
                    // Color based on value
                    let color = RETROTECH_COLORS.phosphor_green;
                    if (landscape.mean > 0.8) color = RETROTECH_COLORS.ansi_red;
                    else if (landscape.mean < 0.2) color = RETROTECH_COLORS.ansi_blue;
                    
                    const line1 = document.createElement("div");
                    line1.style.color = RETROTECH_COLORS.phosphor_amber;
                    line1.textContent = `BRIGHTNESS:`;
                    
                    const line2 = document.createElement("div");
                    line2.style.color = color;
                    line2.innerHTML = `[${bar}] ${landscape.mean.toFixed(3)}`;
                    
                    container.appendChild(line1);
                    container.appendChild(line2);
                    
                    return container;
                };
                
                // Channel balance visualization
                this.createChannelBars = function(channels) {
                    const container = document.createElement("div");
                    container.style.cssText = `
                        margin: 8px 0;
                        font-size: 10px;
                    `;
                    
                    const channel_names = ['red', 'green', 'blue'];
                    const channel_colors = [RETROTECH_COLORS.ansi_red, RETROTECH_COLORS.ansi_green, RETROTECH_COLORS.ansi_blue];
                    
                    channel_names.forEach((name, i) => {
                        if (channels[name]) {
                            const value = channels[name].mean;
                            const bar_width = 10;
                            const filled = Math.floor(value * bar_width);
                            const bar = BLOCKS.dark.repeat(filled) + BLOCKS.light.repeat(bar_width - filled);
                            
                            const line = document.createElement("div");
                            line.style.color = channel_colors[i];
                            line.textContent = `${name[0].toUpperCase()}: [${bar}] ${value.toFixed(2)}`;
                            container.appendChild(line);
                        }
                    });
                    
                    // Channel balance indicator
                    if (channels.balance) {
                        const balance = channels.balance;
                        const avg_correlation = (balance.rg_correlation + balance.gb_correlation + balance.rb_correlation) / 3;
                        
                        const line = document.createElement("div");
                        line.style.color = avg_correlation > 0.9 ? RETROTECH_COLORS.ansi_yellow : RETROTECH_COLORS.phosphor_green;
                        line.style.marginTop = "4px";
                        line.textContent = `BALANCE: ${avg_correlation > 0.9 ? '⚠ HIGH' : '✓ OK'}`;
                        container.appendChild(line);
                    }
                    
                    return container;
                };
                
                // Stats readout
                this.createStatsReadout = function(tensor) {
                    const container = document.createElement("div");
                    container.style.cssText = `
                        margin: 8px 0;
                        font-size: 9px;
                        color: ${RETROTECH_COLORS.chrome_silver};
                    `;
                    
                    const lines = [];
                    
                    // Shape info
                    lines.push(`SHAPE: ${tensor.shape.join('×')} | ${tensor.device}`);
                    
                    // Distribution info
                    if (tensor.distribution) {
                        const dist = tensor.distribution;
                        lines.push(`UNIQUE: ${dist.unique_values} | ZEROS: ${(dist.zeros * 100).toFixed(1)}%`);
                    }
                    
                    // Percentiles
                    if (tensor.percentiles) {
                        const p = tensor.percentiles;
                        lines.push(`P1: ${p.p1.toFixed(3)} | P50: ${p.p50.toFixed(3)} | P99: ${p.p99.toFixed(3)}`);
                    }
                    
                    lines.forEach(line => {
                        const div = document.createElement("div");
                        div.textContent = line;
                        container.appendChild(div);
                    });
                    
                    return container;
                };
                
                // Temporal findings display
                this.displayTemporalFindings = function(temporal) {
                    const section = document.createElement("div");
                    section.style.cssText = `
                        margin-top: 12px;
                        padding-top: 8px;
                        border-top: 1px solid ${RETROTECH_COLORS.grid_lines};
                    `;
                    
                    const header = document.createElement("div");
                    header.style.cssText = `
                        color: ${RETROTECH_COLORS.vapor_cyan};
                        margin-bottom: 4px;
                    `;
                    header.textContent = '◇ TEMPORAL ANALYSIS';
                    section.appendChild(header);
                    
                    if (temporal.changes_detected && temporal.changes_detected.length > 0) {
                        temporal.changes_detected.forEach(change => {
                            const line = document.createElement("div");
                            const magnitude = change.magnitude;
                            let indicator = '▪▪▪';
                            let color = RETROTECH_COLORS.phosphor_green;
                            
                            if (magnitude > 0.5) {
                                indicator = '▪▪▪▪▪';
                                color = RETROTECH_COLORS.ansi_red;
                            } else if (magnitude > 0.1) {
                                indicator = '▪▪▪▪';
                                color = RETROTECH_COLORS.ansi_yellow;
                            }
                            
                            line.style.cssText = `
                                color: ${color};
                                font-size: 10px;
                            `;
                            line.textContent = `Δ${change.frames_back}: ${indicator} ${(magnitude * 100).toFixed(1)}%`;
                            section.appendChild(line);
                        });
                    } else {
                        const line = document.createElement("div");
                        line.style.cssText = `
                            color: ${RETROTECH_COLORS.chrome_silver};
                            font-size: 10px;
                        `;
                        line.textContent = 'No temporal data yet';
                        section.appendChild(line);
                    }
                    
                    this.satori_display.appendChild(section);
                };
                
                // Pattern findings display (placeholder for now)
                this.displayPatternFindings = function() {
                    // Future implementation for pattern visualization
                };
                
                // Hook into execution
                const onExecuted = this.onExecuted;
                this.onExecuted = function(message) {
                    onExecuted?.apply(this, arguments);
                    
                    // Update display with new investigation data
                    if (message?.investigation_data) {
                        this.investigation_data = message.investigation_data;
                        this.updateDisplay();
                    }
                };
                
                return r;
            };
        }
    },
    
    // Add phosphor glow animation
    async setup() {
        const style = document.createElement("style");
        style.textContent = `
            @keyframes phosphor-glow {
                0% { opacity: 0.9; }
                50% { opacity: 1.0; }
                100% { opacity: 0.9; }
            }
            
            .satori-investigation-container {
                animation: phosphor-glow 4s ease-in-out infinite;
            }
            
            /* Subtle flicker effect */
            @keyframes flicker {
                0% { opacity: 1; }
                50% { opacity: 0.98; }
                100% { opacity: 1; }
            }
            
            .satori-display {
                animation: flicker 0.15s infinite;
            }
        `;
        document.head.appendChild(style);
    }
});