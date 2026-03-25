const canvas = document.getElementById('polylineCanvas');
const ctx = canvas.getContext('2d');

let polylines = [];
let currentPolyline = null;
let currentAction = '';
let movingVertexIndex = null;
let mousePos = { x: 0, y: 0 };
let offsetX = 0;
let offsetY = 0;

// ----------------- MOUSE EVENTS -----------------

canvas.addEventListener('mousedown', function(event) {
    const x = event.offsetX;
    const y = event.offsetY;

    if (currentAction === 'moving') {
        const nearest = findNearestPointGlobal(x, y);
        if (nearest) {
            currentPolyline = polylines[nearest.polylineIndex];
            movingVertexIndex = nearest.vertexIndex;
            offsetX = x - currentPolyline[movingVertexIndex].x;
            offsetY = y - currentPolyline[movingVertexIndex].y;
        }
    } else if (currentAction === 'drawing') {
        // Ensure we have a working array
        if (!currentPolyline) {
            currentPolyline = [];
            polylines.push(currentPolyline);
        }

        const snapTarget = findNearestPointInLine(currentPolyline, x, y);

        // Check for Snap to Close (to the 1st point)
        if (snapTarget && snapTarget.index === 0 && currentPolyline.length > 2) {
            const targetPoint = currentPolyline[snapTarget.index];
            currentPolyline.push({ x: targetPoint.x, y: targetPoint.y });

            // --- THE KEY CHANGE ---
            // We do NOT stop the 'drawing' action.
            // We just clear currentPolyline so the NEXT click starts a brand new shape.
            currentPolyline = null;
        } else {
            currentPolyline.push({ x, y });
        }
        redraw();
    }
});

canvas.addEventListener('mousemove', function(event) {
    mousePos.x = event.offsetX;
    mousePos.y = event.offsetY;

    if (movingVertexIndex !== null && currentPolyline) {
        currentPolyline[movingVertexIndex] = {
            x: mousePos.x - offsetX,
            y: mousePos.y - offsetY
        };
    }
    redraw();
});

canvas.addEventListener('mouseup', () => { movingVertexIndex = null; });

// ----------------- REDRAW FUNCTION -----------------

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    polylines.forEach(polyline => {
        if (polyline.length > 0) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333';
            ctx.moveTo(polyline[0].x, polyline[0].y);
            polyline.forEach(point => ctx.lineTo(point.x, point.y));

            // Check if closed
            const isClosed = polyline.length > 2 &&
                polyline[0].x === polyline[polyline.length - 1].x &&
                polyline[0].y === polyline[polyline.length - 1].y;

            if (isClosed) {
                ctx.fillStyle = "rgba(0, 122, 255, 0.2)";
                ctx.fill();
            }
            ctx.stroke();

            // Vertices
            polyline.forEach((point, index) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = (currentPolyline === polyline && index === movingVertexIndex) ? 'red' : 'blue';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.stroke();
            });
        }
    });

    // Ghost Line - only if we are currently drawing a specific line
    if (currentAction === 'drawing' && currentPolyline && currentPolyline.length > 0) {
        const lastPoint = currentPolyline[currentPolyline.length - 1];
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ----------------- ACTION FUNCTIONS -----------------

function beginDrawing() {
    currentAction = 'drawing';
    currentPolyline = null;
    setActiveButton('beginBtn');
}

function deleteVertex() {
    // Note: This deletes from the most recently worked-on polyline
    let target = currentPolyline || polylines[polylines.length - 1];
    if (target && target.length > 0) {
        target.pop();
        if (target.length === 0) {
            polylines = polylines.filter(p => p !== target);
        }
        redraw();
    }
}

function moveVertex() {
    currentAction = 'moving';
    setActiveButton('moveBtn');
}

function refreshCanvas() {
    polylines = [];
    currentPolyline = null;
    currentAction = '';
    movingVertexIndex = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setActiveButton('refreshBtn');
}

function quitApp() {
    if (confirm('Are you sure you want to quit?')) window.close();
}

// ----------------- HELPERS -----------------

function findNearestPointGlobal(x, y) {
    let minDistance = 15;
    let result = null;
    polylines.forEach((polyline, pIdx) => {
        polyline.forEach((point, vIdx) => {
            const dist = Math.hypot(x - point.x, y - point.y);
            if (dist < minDistance) {
                minDistance = dist;
                result = { polylineIndex: pIdx, vertexIndex: vIdx };
            }
        });
    });
    return result;
}

function findNearestPointInLine(polyline, x, y) {
    let minDistance = 15;
    let result = null;
    polyline.forEach((point, index) => {
        const dist = Math.hypot(x - point.x, y - point.y);
        if (dist < minDistance) {
            minDistance = dist;
            result = { index };
        }
    });
    return result;
}

function setActiveButton(id) {
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(id);
    if (activeBtn) activeBtn.classList.add('active');
}

// ----------------- BINDINGS -----------------

document.getElementById('refreshBtn').onclick = refreshCanvas;
document.getElementById('beginBtn').onclick = beginDrawing;
document.getElementById('moveBtn').onclick = moveVertex;
document.getElementById('deleteBtn').onclick = deleteVertex;
document.getElementById('quitBtn').onclick = quitApp;

// ----------------- KEYBOARD SHORTCUTS -----------------
window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'b':
        case 'B':
            beginDrawing();
            break;
        case 'd':
        case 'D':
            deleteVertex();
            break;
        case 'm':
        case 'M':
            moveVertex();
            break;
        case 'r':
        case 'R':
            refreshCanvas();
            break;
        case 'q':
        case 'Q':
            quitApp();
            break;

            // --- THE ESCAPE KEY FIX ---
        case 'Escape':
            if (currentAction === 'drawing' && currentPolyline) {
                // 1. Stop tracking the 'active' line so the ghost line disappears
                // But do NOT remove it from the 'polylines' array.
                currentPolyline = null;

                // 2. Redraw to instantly remove the predictor line
                redraw();

                // Note: currentAction remains 'drawing' so the Begin button stays active.
                // Your next click will start a brand new, separate line.
            }
            break;
    }
});
