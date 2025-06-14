import { hexToRgba, getTimeDiffString, MAP_WIDTH, MAP_HEIGHT, drawOutlinedText, getTreasuryColor } from './utils.js';
const SHOW_TIME_THRESHOLD = 2.3;
const SHOW_NAME_THRESHOLD = 1.0;

export function draw(ctx, canvas, image, territories, offsetX, offsetY, scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Determine line alpha based on zoom level
    let routeAlpha = (scale - 0.5) / (SHOW_NAME_THRESHOLD - 0.5);
    routeAlpha = Math.max(0, Math.min(1, routeAlpha));  // clamp between 0 and 1
    let routeWidth = 0.25 + routeAlpha;  // varies between 0.5px and 3px thickness

    // Draw trading routes first
    for (const t of territories) {
        const centerX1 = t.rect.x + t.rect.w / 2;
        const centerY1 = t.rect.y + t.rect.h / 2;

        for (const destName of t.tradingRoutes) {
            const dest = territories.find(tt => tt.name === destName);
            if (!dest) continue; // ignore invalid destinations

            const centerX2 = dest.rect.x + dest.rect.w / 2;
            const centerY2 = dest.rect.y + dest.rect.h / 2;

            ctx.beginPath();
            ctx.moveTo(centerX1, centerY1);
            ctx.lineTo(centerX2, centerY2);
            ctx.strokeStyle = `rgba(0, 0, 0, ${routeAlpha * 0.5})`;  // dark gray, max opacity 0.5
            ctx.lineWidth = routeWidth;
            ctx.stroke();
        }
    }

    // Draw territory bounds
    for (const t of territories) {
        ctx.fillStyle = hexToRgba(t.color, 0.4);
        ctx.fillRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

        ctx.strokeStyle = t.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

    }

    for (const t of territories) {
        const centerX = t.rect.x + t.rect.w / 2;
        const centerY = t.rect.y + t.rect.h / 2;
        const screenX = offsetX + centerX * scale;
        const screenY = offsetY + centerY * scale;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (scale > SHOW_NAME_THRESHOLD) {
            let textY = screenY;
            if (scale > SHOW_TIME_THRESHOLD) {
                textY = screenY - 10;
            }
            drawOutlinedText(ctx, t.guildPrefix, screenX, textY, "16px Minecraft, monospace");
        }

        if (scale > SHOW_TIME_THRESHOLD) {
            const heldFor = getTimeDiffString(t.acquiredDate)
            drawOutlinedText(ctx, heldFor, screenX, screenY + 10, "12px Minecraft, monospace", getTreasuryColor(t.acquiredDate));

        }
    }

    ctx.restore();
}
