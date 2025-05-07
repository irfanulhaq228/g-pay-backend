const merchantSockets = {}; // Stores merchant socket connections
const adminSockets = new Set(); // Stores all admin sockets

exports.initializeSocket = (io) => {
    global.io = io;

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Register merchant or admin
        socket.on("registerUser", ({ userId, role }) => {
            if (role === "admin") {
                adminSockets.add(socket.id);
                console.log(`Admin connected: ${socket.id}`);
            } else if (role === "merchant") {
                merchantSockets[userId] = socket.id;
                console.log(`Merchant ${userId} connected with socket ${socket.id}`);
            }
        });

        // Handle disconnections
        socket.on("disconnect", () => {
            adminSockets.delete(socket.id);
            Object.keys(merchantSockets).forEach((merchantId) => {
                if (merchantSockets[merchantId] === socket.id) {
                    delete merchantSockets[merchantId];
                    console.log(`Merchant ${merchantId} disconnected`);
                }
            });
        });
    });
};

// Function to notify specific merchant and all admins
exports.notifyUsers = (merchantId, event, data) => {
    // Notify specific merchant
    if (merchantSockets[merchantId]) {
        global.io.to(merchantSockets[merchantId]).emit(event, data);
    }

    // Notify all admins
    adminSockets.forEach((socketId) => {
        global.io.to(socketId).emit(event, data);
    });
};
