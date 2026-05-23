const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startUpdate: (url) => ipcRenderer.send('start-update-download', url),
  onProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('update-progress', listener);
    return () => ipcRenderer.removeListener('update-progress', listener);
  },
  onCompleted: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-completed', listener);
    return () => ipcRenderer.removeListener('update-completed', listener);
  },
  onError: (callback) => {
    const listener = (event, err) => callback(err);
    ipcRenderer.on('update-error', listener);
    return () => ipcRenderer.removeListener('update-error', listener);
  }
});
