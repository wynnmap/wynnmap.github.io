import { hexToRgba, MAP_WIDTH, MAP_HEIGHT, drawOutlinedText, getFadeAlpha, getTerritoryType, hexToRgb, fixHexCode, shortenName } from './utils.js';
const SHOW_INFO_THRESHOLD = 2.3;
const SHOW_NAME_THRESHOLD = 1.0;

export function draw(ctx, canvas, mapImage, crownImage, territories, selectedTerritories, guilds, offsetX, offsetY, scale, globalAlpha) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(mapImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    ctx.globalAlpha = globalAlpha;

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
        ctx.fillStyle = hexToRgba(guilds[t.guild].color, 0.4);
        ctx.fillRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

        ctx.strokeStyle = fixHexCode(guilds[t.guild].color);
        ctx.lineWidth = 1;
        ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);

    }

    for (const t of territories) {
        const centerX = t.rect.x + t.rect.w / 2;
        const centerY = t.rect.y + t.rect.h / 2;
        const screenX = offsetX + centerX * scale;
        const screenY = offsetY + centerY * scale;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (guilds[t.guild].hq == t.name) {
            const iconSize = 35;
            const halfSize = iconSize / 2;
            ctx.globalAlpha = getFadeAlpha(scale, SHOW_NAME_THRESHOLD)

            ctx.drawImage(crownImage, screenX - halfSize, screenY - halfSize, iconSize, iconSize);
            ctx.globalAlpha = 1;
            continue;
        }

        let textY = screenY;
        if (scale > SHOW_INFO_THRESHOLD) {
            textY -= 10;
        }

        // Territory name fade
        let nameAlpha = getFadeAlpha(scale, SHOW_NAME_THRESHOLD);

        if (nameAlpha > 0) {
            drawOutlinedText(ctx, shortenName(t.name), screenX, textY, "16px Minecraft, monospace", `rgba(255,255,255,${nameAlpha})`, nameAlpha);
            textY += 20;
        }

        // Resource type fade
        let typeAlpha = getFadeAlpha(scale, SHOW_INFO_THRESHOLD);
        
        if (typeAlpha > 0) {
            if (t.resources) {
                const { type, icons } = getTerritoryType(t.resources);

                if (type === "rainbow") {
                    // 2x2 grid layout for rainbow
                    const gridSize = 10;
                    const startX = screenX - gridSize / 2;
                    const startY = textY - gridSize / 2;

                    for (let i = 0; i < icons.length; i++) {
                        const icon = icons[i];
                        const dx = startX + (i % 2) * gridSize;
                        const dy = startY + Math.floor(i / 2) * gridSize + 5;
                        drawOutlinedText(ctx, icon.glyph, dx, dy, `${gridSize}px Icons`, `rgba(${hexToRgb(icon.color)},${typeAlpha})`, typeAlpha);
                    }
                } else {
                    // normal linear layout
                    const fontSize = icons.length > 1 ? 14 : 16;
                    let offsetXIcons = screenX - ((icons.length - 1) * 7);
                    for (const icon of icons) {
                        drawOutlinedText(ctx, icon.glyph, offsetXIcons, textY, `${fontSize}px Icons`, `rgba(${hexToRgb(icon.color)},${typeAlpha})`, typeAlpha);
                        offsetXIcons += 14;
                    }
                }
            }
        }
    }

    // Highlight selected territories
    if (selectedTerritories && selectedTerritories.length > 0) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        for (const t of selectedTerritories) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);
        }

        ctx.restore(); // restore zoomed transform
    }


    ctx.globalAlpha = 1;
    ctx.restore();
}
