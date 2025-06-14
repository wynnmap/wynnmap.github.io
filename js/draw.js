import { hexToRgba, getTimeDiffString, MAP_WIDTH, MAP_HEIGHT, drawOutlinedText, getTreasuryColor } from './utils.js';
const SHOW_TIME_THRESHOLD = 2.3;
const SHOW_NAME_THRESHOLD = 1.0;

export function draw(ctx, canvas, image, territories, offsetX, offsetY, scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);

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
