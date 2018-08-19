const fs = require('fs');

module.exports = class App {
  upload(fields, files) {
    const fileId = fields.prestoId;
    const fileName = fields.name;
    const fileSize = parseInt(fields.size, 10);

    const saveDir = '../tmp';
    const savePartDir = '../tmp/part';
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir);
    }
    if (!fs.existsSync(savePartDir)) {
      fs.mkdirSync(savePartDir);
    }

    const tmpPath = files.chunk.path;
    const saveFilePath = `${savePartDir}/${fields.prestoId}part${fields.prestoChunkIndex}`;

    fs.rename(tmpPath, saveFilePath, err => {
      if (err) throw err;

      const totalChunkNumber = parseInt(fields.totalChunkNumber, 10);
      let partFileCount = 0;
      fs.readdir(savePartDir, (readErr, list) => {
        if (readErr) throw err;

        list.forEach(file => {
          if (file.includes(fileId)) {
            partFileCount += 1;
          }
        });
        if (partFileCount >= totalChunkNumber) {
          this.createFileFromChunks(savePartDir, saveDir, fileName, fileId, fileSize);
        }
      });
    });

    return;
  }

  createFileFromChunks(savePartDir, saveDir, fileName, fileId, fileSize) {
    let toalFiles = 0;

    fs.readdirSync(savePartDir, (readErr, list) => {
      list.forEach(file => {
        if (file.includes(fileId)) {
          totalFiles += 1;
        }
      });
    });

    let deleteFileList = [];
    for (let i = 0; i < totalFiles; i += 1) {
      const partFilePath = `${savePartDir}/${fileId}part${i}`;
      fs.appendFileSync(`${saveDir}/${fileName}`, fs.readFileSync(partFilePath));
      deleteFileList.push(partFilePath);
    }

    const stats = fs.statSync(`${saveDir}/${fileName}`);
    if (stats.size !== fileSize) {
      throw new Error();
    }

    deleteFileList.forEach(partFilePath => {
      fs.unlink(partFilePath);
    });

    return;
  }
};
