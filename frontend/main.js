const { app, BrowserWindow, screen, protocol } = require('electron');

let mainWindow;
const CUSTOM_PROTOCOL = 'surveillanceapp';

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: false, 
        resizable: true,
        minimizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    // Load initial page
    mainWindow.loadFile("login.html");
}

function handleDeepLink(url) {
    if (!mainWindow) return;

    if (url.startsWith(`${CUSTOM_PROTOCOL}://`)) {
        try {
            const parsedUrl = new URL(url);
            const searchParams = new URLSearchParams(parsedUrl.search);
            
            mainWindow.loadFile('reset_password.html', {
                query: {
                    uidb64: searchParams.get('uidb64'),
                    token: searchParams.get('token')
                }
            });
            
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        } catch (error) {
            console.error('Error handling deep link:', error);
        }
    }
}

app.whenReady().then(() => {
    // Protocol registration
    if (!app.isDefaultProtocolClient(CUSTOM_PROTOCOL)) {
        app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL);
    }

    // Handle Windows/Linux deep links
    app.on('second-instance', (event, commandLine) => {
        const url = commandLine.find(arg => arg.startsWith(`${CUSTOM_PROTOCOL}://`));
        if (url) handleDeepLink(url);
    });

    // Handle macOS deep links
    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleDeepLink(url);
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

console.warn("Electron Is Running");