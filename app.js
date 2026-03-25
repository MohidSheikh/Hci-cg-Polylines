const canvas = document.getElementById('polylineCanvas');
const ctx = canvas.getContext('2d');

let polylines = []; // Stores all the polylines
let currentPolyline = []; // Active polyline being drawn
let currentAction = ''; // Keeps track of the current action (drawing, moving, etc.)
let movingVertexIndex = null; // Store index of vertex being moved
let offsetX = 0; // Offset for dragging
let offsetY = 0; // Offset for dragging

// Event listener for mouse down (to start the drag)
canvas.addEventListener('mousedown', function(event) {
    const x = event.offsetX;
    const y = event.offsetY;

    // Start moving the vertex if the Move action is active
    if (currentAction === 'moving') {
        const nearestPoint = findNearestPoint(x, y);
        if (nearestPoint) {
            movingVertexIndex = nearestPoint.index;
            offsetX = x - currentPolyline[movingVertexIndex].x;
            offsetY = y - currentPolyline[movingVertexIndex].y;
            // No need to continuously draw when moving vertices
        }
    } else if (currentAction === 'drawing') {
        // Add points to the current polyline if drawing
        currentPolyline.push({ x, y });
        redraw();
    }
});

// Event listener for mouse move (to drag the vertex)
canvas.addEventListener('mousemove', function(event) {
    if (movingVertexIndex !== null) {
        const x = event.offsetX - offsetX;
        const y = event.offsetY - offsetY;

        // Update the position of the moving vertex
        currentPolyline[movingVertexIndex] = { x, y };
        redraw(); // Redraw the canvas after moving the vertex
    }
});

// Event listener for mouse release (to stop moving)
canvas.addEventListener('mouseup', function() {
    if (movingVertexIndex !== null) {
        movingVertexIndex = null; // Stop moving the vertex
    }
});

// Function to redraw the entire canvas
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all polylines
    polylines.forEach(polyline => {
        ctx.beginPath();
        ctx.moveTo(polyline[0].x, polyline[0].y);
        polyline.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    });

    // Draw the current polyline being created
    if (currentPolyline.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPolyline[0].x, currentPolyline[0].y);
        currentPolyline.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
}

// Action Handlers (Button-Triggered and Keyboard-Triggered)
function beginDrawing() {
    currentAction = 'drawing';
    currentPolyline = [];
    polylines.push(currentPolyline);
    setActiveButton('beginBtn'); // Set the 'Begin' button as active
}

function deleteVertex() {
    if (currentPolyline.length > 0) {
        currentPolyline.pop(); // Remove the last vertex from the current polyline
        redraw();
    }
    setActiveButton('deleteBtn'); // Set the 'Delete' button as active
}

function moveVertex() {
    currentAction = 'moving'; // Set action to 'moving'
    setActiveButton('moveBtn'); // Set the 'Move' button as active
}

function refreshCanvas() {
    redraw();
    setActiveButton('refreshBtn'); // Set the 'Refresh' button as active
}

function quitApp() {
    if (confirm('Are you sure you want to quit?')) {
        window.close(); // Close the window
    }
    setActiveButton('quitBtn'); // Set the 'Quit' button as active
}

// Function to find the nearest point to the mouse click
function findNearestPoint(x, y) {
    let nearestPoint = null;
    let minDistance = 10; // Threshold distance to consider a point "near"
    polylines.forEach((polyline, polylineIndex) => {
        polyline.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < minDistance) {
                nearestPoint = { polylineIndex, index };
            }
        });
    });
    return nearestPoint;
}

// Function to toggle the active class on buttons
function setActiveButton(buttonId) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.classList.remove('active'); // Remove 'active' class from all buttons
    });
    document.getElementById(buttonId).classList.add('active'); // Add 'active' class to the clicked button
}

// Keyboard events for the PolyLine actions
window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'b':
            beginDrawing(); // Start a new polyline
            break;
        case 'r':
            refreshCanvas(); // Refresh the canvas
            break;
        case 'd':
            deleteVertex(); // Delete the last vertex
            break;
        case 'm':
            moveVertex(); // Move the nearest vertex
            break;
        case 'q':
            quitApp(); // Quit the app
            break;
        default:
            break;
    }
});