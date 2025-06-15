import { hexToRgba, getTimeDiffString, MAP_WIDTH, MAP_HEIGHT, drawOutlinedText, getTreasuryColor, getFadeAlpha, getTerritoryType, hexToRgb } from './utils.js';
const SHOW_INFO_THRESHOLD = 2.3;
const SHOW_NAME_THRESHOLD = 1.0;

export function draw(ctx, canvas, image, territories, offsetX, offsetY, scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    const showResources = document.getElementById("toggle-resources").checked;
    const showConnections = document.getElementById("toggle-connections").checked;
    const showTimeHeld = document.getElementById("toggle-timeheld").checked;

    if (showConnections) {
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

        let textY = screenY;
        if (scale > SHOW_INFO_THRESHOLD) {
            textY -= 10;
        }

        // Guild Prefix fade
        let prefixAlpha = getFadeAlpha(scale, SHOW_NAME_THRESHOLD);

        if (prefixAlpha > 0) {
            drawOutlinedText(ctx, t.guildPrefix, screenX, textY, "16px Minecraft, monospace", `rgba(255,255,255,${prefixAlpha})`, prefixAlpha);
            textY += 20;
        }

        // Treasury fade
        let treasuryAlpha = getFadeAlpha(scale, SHOW_INFO_THRESHOLD);

        if (showTimeHeld && treasuryAlpha > 0) {
            const heldFor = getTimeDiffString(t.acquiredDate);
            const treasuryColor = getTreasuryColor(t.acquiredDate);

            // Convert treasury color hex to rgba with alpha
            const r = parseInt(treasuryColor.slice(1, 3), 16);
            const g = parseInt(treasuryColor.slice(3, 5), 16);
            const b = parseInt(treasuryColor.slice(5, 7), 16);
            const rgba = `rgba(${r},${g},${b},${treasuryAlpha})`;

            drawOutlinedText(ctx, heldFor, screenX, screenY + 10, "12px MinecraftRegular, monospace", rgba, treasuryAlpha);
            textY += 18;
        }

        // Resource type fade
        let typeAlpha = getFadeAlpha(scale, SHOW_INFO_THRESHOLD);
        
        if (showResources && typeAlpha > 0) {
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
                    let offsetXIcons = screenX - ((icons.length - 1) * 12);
                    for (const icon of icons) {
                        drawOutlinedText(ctx, icon.glyph, offsetXIcons, textY, "16px Icons", `rgba(${hexToRgb(icon.color)},${typeAlpha})`, typeAlpha);
                        offsetXIcons += 24;
                    }
                }
            }
        }
    }


    ctx.restore();
}
