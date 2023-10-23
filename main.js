const { uIOhook } = require("uiohook-napi");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { getOpenWindows } = require("active-win");
const activeWindow = require("active-win");

let openWindows = [];
let selectedWindowId = -1;

let canChangeMovedMouse = true;
let movedMouse = false;
let currentTimer = 0;
let timerState = false;

function secondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
  
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');
  
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

uIOhook.on("mousemove", (event) => {
    if (canChangeMovedMouse) movedMouse = true;
});

async function createWindow() {
    const win = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.on("resize", () => {
        const [width, height] = win.getSize();
        const targetAspectRatio = 400 / 300;
        const newWidth = Math.max(width, height * targetAspectRatio);
        const newHeight = newWidth / targetAspectRatio;
        win.setSize(Math.round(newWidth), Math.round(newHeight));
    });

    win.loadFile("index.html");
    win.removeMenu();

    setInterval(async () => {
        if (movedMouse && timerState) {
            canChangeMovedMouse = false;
            movedMouse = false;
            const curActiveWin = await activeWindow({
                screenRecordingPermission: true
            });
            if (selectedWindowId == curActiveWin?.id) currentTimer = currentTimer + 3;
            setTimeout(() => canChangeMovedMouse = true, 100);
            win.webContents.send("timer", {
                message: secondsToHMS(currentTimer)
            });
        }
    }, 3000);

    let i = setInterval(async () => {
        const curActiveWin = await activeWindow({
            screenRecordingPermission: true
        });

        win.webContents.send("activeWindow", {
            message: curActiveWin
        });

        if (!curActiveWin?.title.includes("mm-checkmouse")) {
            selectedWindowId = curActiveWin.id;
            clearInterval(i);
        }
    }, 2000);

    try {
        openWindows = await getOpenWindows();
    } catch(e) {
        console.log(e);
    }
    win.webContents.send("windows", {
        message: openWindows
    });

    ipcMain.on("triggerRestart", (event, data) => {
        currentTimer = 0;
        win.webContents.send("timer", {
            message: secondsToHMS(currentTimer)
        });
    });

    ipcMain.on("timerStatusChange", (event, data) => {
        timerState = !timerState;
        win.webContents.send("timerStatus", {
            message: timerState
        });
    });    
}

ipcMain.on("selectWindow", (event, data) => {
    selectedWindowId = openWindows[data]?.id;
});

app.whenReady().then(() => {
    createWindow()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

uIOhook.start();