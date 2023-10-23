const { ipcRenderer } = require('electron');

ipcRenderer.on("timer", (event, data) => {
    const element = document.getElementById("time")
    if (element) element.innerText = data.message;
});

ipcRenderer.on("windows", (event, data) => {
    for (let i=0; i<data.message.length; i++) {
        addElemToDropDown("dropdown", i, `(${data.message[i].id}) ${data.message[i].title}`);
    }
});

ipcRenderer.on("activeWindow", (event, data) => {
    const info = document.getElementById("info");
    info.innerText = `(${data.message.id}) ${data.message.title}`;
});

document.addEventListener("DOMContentLoaded", function() {
    const startBtn = document.getElementById("start-btn");
    const restartBtn = document.getElementById("restart-btn");

    ipcRenderer.on("timerStatus", (event, data) => {
        if (data.message) {
            startBtn.classList.add("red");
            startBtn.classList.remove("green");
            startBtn.innerText = "Stop";
        } else {
            startBtn.classList.remove("red");
            startBtn.classList.add("green");
            startBtn.innerText = "Start";
        }
    });
    
    startBtn.onclick = () => {
        ipcRenderer.send("timerStatusChange", true);
    }
    
    restartBtn.onclick = () => {
        ipcRenderer.send("triggerRestart", true);
    }
});

function addElemToDropDown(id, index, title) {
    const docelowyElement = document.getElementById(id);
    const e = document.createElement("a");
    e.classList.add("dropdown-item");
    e.textContent = title;
    e.onclick = () => {
        selectWindow(index, title);
    }
    docelowyElement.appendChild(e);
}

function selectWindow(index, title) {
    ipcRenderer.send("selectWindow", index);
    const dropdownButton = document.querySelector(".btn");
    dropdownButton.innerText = title;
}