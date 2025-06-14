const MAP_WIDTH = 1009;
const MAP_HEIGHT = 1604;
const FADE_DISTANCE = 0.2;

export { MAP_WIDTH, MAP_HEIGHT };


export function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function getTimeDiffString(date, fullOutput = false) {
    const now = new Date();
    let diff = Math.floor((now - date) / 1000);
    const days = Math.floor(diff / 86400);
    diff %= 86400;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0) parts.push(`${secs}s`);

    if (fullOutput) return parts.join(" ");
    return parts.slice(0, 2).join(" ");
}

export function toCanvasCoords(x_ingame, z_ingame) {
    const x_canvas = (x_ingame + 2382) * MAP_WIDTH / 4034;
    const y_canvas = (z_ingame + 6572) * MAP_HEIGHT / 6414;
    return { x: x_canvas, y: y_canvas };
}

export function drawOutlinedText(ctx, text, x, y, font, color = `rgba(255,255,255,255)`, alpha = 1.0, outlineWidth = 3) {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = color;  // color is already rgba
    ctx.fillText(text, x, y);
}

export function getTreasuryColor(acquiredDate) {
    const now = new Date();
    const heldSeconds = Math.floor((now - acquiredDate) / 1000);

    if (heldSeconds < 3600) {
        return "#00FF00"; // Green (<1h)
    } else if (heldSeconds < 86400) {
        return "#FFFF00"; // Yellow (1h-1d)
    } else if (heldSeconds < 604800) {
        return "#FF0000"; // Red (1d-7d)
    } else {
        return "#00FFFF"; // Cyan-ish (7d+)
    }
}

export function getFadeAlpha(scale, threshold, fadeDistance = FADE_DISTANCE) {
    let alpha = (scale - threshold + fadeDistance) / fadeDistance;
    return Math.max(0, Math.min(1, alpha));
}
