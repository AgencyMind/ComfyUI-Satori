import { app } from "../../scripts/app.js";

// Debug logging
console.log("Satori diagnostics loading...");

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

// Default loading screen frames for animation
const LOADING_FRAMES = [
    `
╔══════════════════════════════╗
║  SATORI DIAGNOSTIC SYSTEM    ║
║    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄    ║
║   ▐░░░░░░░░░░░░░░░░░░░░▌   ║
║   ▐░█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█░▌   ║
║   ▐░▌               ▐░▌   ║
║   ▐░▌ INITIALIZING  ▐░▌   ║
║   ▐░▌               ▐░▌   ║
║   ▐░█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█░▌   ║
║   ▐░░░░░░░░░░░░░░░░░░░░▌   ║
║    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    ║
║                              ║
║  [████████████░░░░░] 75%    ║
╚══════════════════════════════╝`,
    `
╔══════════════════════════════╗
║  SATORI DIAGNOSTIC SYSTEM    ║
║    ╱╲    ╱╲    ╱╲    ╱╲    ║
║   ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲   ║
║  ╱    ╲╱    ╲╱    ╲╱    ╲  ║
║  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  ║
║   SCANNING TENSOR SPACE...   ║
║  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁  ║
║  ╲    ╱╲    ╱╲    ╱╲    ╱  ║
║   ╲  ╱  ╲  ╱  ╲  ╱  ╲  ╱   ║
║    ╲╱    ╲╱    ╲╱    ╲╱    ║
║                              ║
║  [██████████████░░] 85%     ║
╚══════════════════════════════╝`,
    `
╔══════════════════════════════╗
║  SATORI DIAGNOSTIC SYSTEM    ║
║   ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐   ║
║   │▓│░│▓│░│▓│░│▓│░│▓│░│   ║
║   ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤   ║
║   │░│▓│░│▓│░│▓│░│▓│░│▓│   ║
║   ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤   ║
║   │▓│░│▓│░│▓│░│▓│░│▓│░│   ║
║   └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘   ║
║   PATTERN MATRIX: READY      ║
║                              ║
║  AWAITING INVESTIGATION...   ║
║  [████████████████] 100%    ║
╚══════════════════════════════╝`
];

// Oscilloscope-style waveform generator
function generateOscilloscopeWave(width = 30, phase = 0) {
    const wave = [];
    for (let i = 0; i < width; i++) {
        const x = (i / width) * Math.PI * 2 + phase;
        const y = Math.sin(x) * 0.5 + Math.sin(x * 3) * 0.3 + Math.sin(x * 7) * 0.2;
        const height = Math.floor((y + 1) * 4);
        const char = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'][Math.max(0, Math.min(7, height))];
        wave.push(char);
    }
    return wave.join('');
}

// VU meter style display
function generateVUMeter(value = 0.5, width = 20) {
    const filled = Math.floor(value * width);
    const meter = [];
    for (let i = 0; i < width; i++) {
        if (i < filled) {
            if (i < width * 0.6) meter.push('▪');
            else if (i < width * 0.8) meter.push('▫');
            else meter.push('▪');
        } else {
            meter.push('·');
        }
    }
    return meter.join('');
}

// Create default loading display
function createLoadingDisplay() {
    const displays = [
        {
            type: 'oscilloscope',
            render: (phase) => {
                return `
┌─ WAVEFORM ANALYZER ─────────┐
│ ${generateOscilloscopeWave(28, phase)}│
│ ${generateOscilloscopeWave(28, phase + 0.5)}│
│ ${generateOscilloscopeWave(28, phase + 1.0)}│
└─────────────────────────────┘`;
            }
        },
        {
            type: 'spectrum',
            render: (phase) => {
                const bars = [];
                for (let i = 0; i < 8; i++) {
                    const height = Math.floor((Math.sin(phase + i * 0.5) + 1) * 4);
                    const bar = ['▁', '▃', '▅', '▇', '█'][Math.max(0, Math.min(4, height))];
                    bars.push(bar.repeat(3));
                }
                return `
┌─ SPECTRUM ANALYZER ─────────┐
│ ${bars.join(' ')} │
│ 1k  2k  4k  8k  16k 32k    │
└─────────────────────────────┘`;
            }
        },
        {
            type: 'matrix',
            render: (phase) => {
                const matrix = [];
                for (let y = 0; y < 3; y++) {
                    const row = [];
                    for (let x = 0; x < 10; x++) {
                        const intensity = (Math.sin(phase + x * 0.3 + y * 0.7) + 1) * 0.5;
                        if (intensity > 0.7) row.push('◆');
                        else if (intensity > 0.4) row.push('◇');
                        else row.push('·');
                    }
                    matrix.push(row.join(' '));
                }
                return `
┌─ PATTERN MATRIX ────────────┐
│ ${matrix[0]}     │
│ ${matrix[1]}     │
│ ${matrix[2]}     │
└─────────────────────────────┘`;
            }
        },
        {
            type: 'meters',
            render: (phase) => {
                const cpu = Math.sin(phase * 1.2) * 0.3 + 0.5;
                const mem = Math.sin(phase * 0.8) * 0.3 + 0.6;
                const gpu = Math.sin(phase * 1.5) * 0.3 + 0.4;
                return `
┌─ SYSTEM MONITORS ───────────┐
│ CPU [${generateVUMeter(cpu, 20)}]│
│ MEM [${generateVUMeter(mem, 20)}]│
│ GPU [${generateVUMeter(gpu, 20)}]│
└─────────────────────────────┘`;
            }
        }
    ];
    
    return displays;
}

// Satori diagnostic extension
app.registerExtension({
    name: "ComfyUI-Satori.Diagnostics",
    
    async beforeRegisterNodeDef(nodeType, nodeData) {
        console.log("Satori checking node:", nodeData.name);
        
        if (nodeData.name === "WhyDidItBreak" || nodeData.name === "TemporalInvestigator") {
            console.log("Satori: Hooking", nodeData.name);
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                console.log("Satori: Node created", this.type);
                
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
                    min-height: 200px;
                    width: 350px;
                    max-width: 100%;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                `;
                
                // Let ComfyUI handle node sizing naturally
                
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
                    white-space: pre;
                    line-height: 1.2;
                `;
                container.appendChild(display);
                
                // Initialize with loading animation
                let loadingPhase = 0;
                let loadingFrame = 0;
                const loadingDisplays = createLoadingDisplay();
                let currentDisplay = 0;
                
                // Default loading animation
                const animateLoading = () => {
                    // Check if we have real data or just the default empty object
                    const hasRealData = this.investigation_data && 
                                       (this.investigation_data.id || 
                                        this.investigation_data.findings || 
                                        this.investigation_data.timestamp);
                    
                    if (!hasRealData && this.satori_display) {
                        // Check container width for responsive display
                        const containerWidth = this.satori_container.offsetWidth;
                        const isNarrow = containerWidth < 300;
                        
                        // Combine displays
                        this.satori_display.innerHTML = '';
                        
                        if (isNarrow) {
                            // Simplified display for narrow nodes
                            const simpleDiv = document.createElement("div");
                            simpleDiv.style.cssText = `
                                color: ${RETROTECH_COLORS.phosphor_amber};
                                text-align: center;
                                padding: 20px 0;
                            `;
                            simpleDiv.innerHTML = `
                                SATORI DIAGNOSTIC<br>
                                <span style="color: ${RETROTECH_COLORS.phosphor_green}">
                                ${generateOscilloscopeWave(20, loadingPhase)}
                                </span><br>
                                <span style="font-size: 10px; color: ${RETROTECH_COLORS.vapor_cyan}">
                                INITIALIZING...
                                </span>
                            `;
                            this.satori_display.appendChild(simpleDiv);
                        } else {
                            // Full display for wider nodes
                            const mainFrame = LOADING_FRAMES[Math.floor(loadingFrame) % LOADING_FRAMES.length];
                            
                            // Dynamic displays
                            const dynamicDisplay = loadingDisplays[currentDisplay].render(loadingPhase);
                            
                            // Main frame
                            const mainDiv = document.createElement("div");
                            mainDiv.style.color = RETROTECH_COLORS.phosphor_amber;
                            mainDiv.textContent = mainFrame;
                            this.satori_display.appendChild(mainDiv);
                            
                            // Dynamic display
                            const dynDiv = document.createElement("div");
                            dynDiv.style.cssText = `
                                color: ${RETROTECH_COLORS.phosphor_green};
                                margin-top: 8px;
                                text-shadow: 0 0 3px ${RETROTECH_COLORS.phosphor_green};
                            `;
                            dynDiv.textContent = dynamicDisplay;
                            this.satori_display.appendChild(dynDiv);
                            
                            // Status line
                            const statusDiv = document.createElement("div");
                            statusDiv.style.cssText = `
                                color: ${RETROTECH_COLORS.vapor_cyan};
                                margin-top: 8px;
                                font-size: 10px;
                                text-align: center;
                            `;
                            const dots = '.'.repeat((Math.floor(loadingPhase * 2) % 4));
                            statusDiv.textContent = `READY FOR INVESTIGATION${dots}`;
                            this.satori_display.appendChild(statusDiv);
                        }
                        
                        // Update animation state
                        loadingPhase += 0.05;
                        loadingFrame += 0.03;
                        currentDisplay = Math.floor(loadingPhase / 2) % loadingDisplays.length;
                    }
                };
                
                // Start loading animation
                this.loadingInterval = setInterval(animateLoading, 100);
                animateLoading(); // Initial render
                
                // Try to add the widget - with error handling
                try {
                    console.log("Satori: Adding DOM widget");
                    
                    this.addDOMWidget("satori_investigation", "div", container, {
                        getValue: () => {
                            return this.investigation_data;  // Return undefined instead of {}
                        },
                        setValue: (v) => {
                            console.log("Satori: setValue called", v);
                            // Only set if we have real data, not empty objects
                            if (v && (v.id || v.findings || v.timestamp)) {
                                this.investigation_data = v;
                                this.updateDisplay();
                            }
                        },
                        onDraw: () => {
                            // Don't update if we don't have real data
                            if (this.investigation_data && 
                                (this.investigation_data.id || 
                                 this.investigation_data.findings || 
                                 this.investigation_data.timestamp)) {
                                this.updateDisplay();
                            }
                        }
                    });
                    
                    console.log("Satori: DOM widget added successfully");
                } catch (e) {
                    console.error("Satori: Failed to add DOM widget", e);
                    
                    // Fallback: Try older widget method
                    try {
                        this.addCustomWidget({
                            name: "satori_display",
                            draw: function(ctx, node, widget_width, y, H) {
                                // Canvas fallback - just show text
                                ctx.fillStyle = RETROTECH_COLORS.phosphor_green;
                                ctx.font = "12px monospace";
                                ctx.fillText("Satori Investigation Active", 10, y + 20);
                            }
                        });
                        console.log("Satori: Fallback widget added");
                    } catch (e2) {
                        console.error("Satori: Fallback also failed", e2);
                    }
                }
                
                // Store references
                this.satori_display = display;
                this.satori_container = container;
                
                // Update display method
                this.updateDisplay = function() {
                    console.log("Satori: updateDisplay called", this.investigation_data);
                    
                    // Stop loading animation when we have data
                    if (this.investigation_data && this.loadingInterval) {
                        clearInterval(this.loadingInterval);
                        this.loadingInterval = null;
                    }
                    
                    if (!this.satori_display) {
                        console.error("Satori: No display element!");
                        return;
                    }
                    
                    // Check if we have real data or just the default empty object
                    const hasRealData = this.investigation_data && 
                                       (this.investigation_data.id || 
                                        this.investigation_data.findings || 
                                        this.investigation_data.timestamp);
                    
                    console.log("Satori: hasRealData =", hasRealData, "data =", this.investigation_data);
                    
                    if (!hasRealData) {
                        console.log("Satori: No real data, keeping loading animation");
                        // Keep showing loading animation
                        return;
                    }
                    
                    const data = this.investigation_data;
                    const findings = data.findings || {};
                    
                    // Clear current display
                    this.satori_display.innerHTML = '';
                    
                    // Header with arcade-style graphics
                    const headerContainer = document.createElement("div");
                    headerContainer.style.cssText = `
                        border: 2px solid ${RETROTECH_COLORS.phosphor_amber};
                        padding: 4px;
                        margin-bottom: 8px;
                        text-align: center;
                    `;
                    
                    const header = document.createElement("div");
                    header.style.cssText = `
                        color: ${RETROTECH_COLORS.phosphor_amber};
                        text-shadow: 0 0 8px ${RETROTECH_COLORS.phosphor_amber};
                        font-size: 12px;
                        font-weight: bold;
                    `;
                    header.textContent = `◆ INVESTIGATION: ${data.id || 'unnamed'} ◆`;
                    headerContainer.appendChild(header);
                    
                    this.satori_display.appendChild(headerContainer);
                    
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
                    const mean_normalized = range > 0 ? (landscape.mean - landscape.min) / range : 0;
                    
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
                this.displayPatternFindings = function(patterns) {
                    // Future implementation for pattern visualization
                };
                
                // Hook into execution - FIX: Handle ComfyUI's ui structure
                const originalOnExecuted = this.onExecuted;
                this.onExecuted = function(message) {
                    console.log("Satori: onExecuted called", message);
                    
                    if (originalOnExecuted) {
                        originalOnExecuted.apply(this, arguments);
                    }
                    
                    // Update display with new investigation data
                    // Handle both possible data locations
                    if (message?.ui?.investigation_data) {
                        console.log("Satori: Found data in ui.investigation_data", message.ui.investigation_data);
                        this.investigation_data = message.ui.investigation_data;
                        this.updateDisplay();
                    } else if (message?.investigation_data) {
                        console.log("Satori: Found data in investigation_data", message.investigation_data);
                        this.investigation_data = message.investigation_data;
                        this.updateDisplay();
                    } else {
                        console.log("Satori: No investigation data found in message", message);
                    }
                };
                
                // Also hook into onExecutionOutput if it exists
                const originalOnExecutionOutput = this.onExecutionOutput;
                this.onExecutionOutput = function(data) {
                    console.log("Satori: onExecutionOutput called", data);
                    if (originalOnExecutionOutput) {
                        originalOnExecutionOutput.apply(this, arguments);
                    }
                };
                
                // Cleanup on node removal
                const onRemoved = this.onRemoved;
                this.onRemoved = function() {
                    if (this.loadingInterval) {
                        clearInterval(this.loadingInterval);
                    }
                    onRemoved?.apply(this, arguments);
                };
                
                console.log("Satori: Node setup complete");
                return r;
            };
        }
    },
    
    // Add phosphor glow animation
    async setup() {
        console.log("Satori: Extension setup");
        
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
            
            /* CRT curve effect */
            .satori-investigation-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(
                    ellipse at center,
                    transparent 0%,
                    transparent 60%,
                    rgba(0, 0, 0, 0.1) 100%
                );
                pointer-events: none;
                z-index: 3;
            }
        `;
        document.head.appendChild(style);
        
        console.log("Satori: Setup complete");
    }
});

console.log("Satori diagnostics loaded");