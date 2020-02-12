const { app, BrowserWindow, screen } = require('electron');

var init = () =>{
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        resizable: false,
        frame: false,   
        titleBarStyle: 'hiddenInset'
    });

    win.webContents.openDevTools();
    //Loads the index file
    win.loadFile('index.html');

    win.on('closed', () => { win = null});

    win.setMenuBarVisibility(false);

}

app.on('ready', init);

app.on('window-all-closed', () => {
    if(process.platform != 'darwin'){
        app.quit();
    }
});

app.on('activate', () => {
    if(win == null){
        init;
    }
});





