const fs = require('fs');

module.exports = class App {
  upload(fields, files) {
    const fileId = fields.prestoId;
    const fileName = fields.name;
    const fileSize = parseInt(fields.size, 10);

    const saveDir = '../tmp';
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
    if (!fs.existsSync(`${saveDir}/part`)) fs.mkdirSync(`${saveDir}/part`);

    const saveChunkPath = `${saveDir}/part/${fields.prestoId}part${fields.prestoChunkIndex}`;
    fs.renameSync(files.chunk.path, saveChunkPath);

    const totalChunkNumber = parseInt(fields.totalChunkNumber, 10);
    fs.readdir(`${saveDir}/part`, (readErr, list) => {
      if (readErr) throw err;
      const partFileCount = list.filter(l => {
        return l.includes(fileId);
      }).length;
      if (partFileCount >= totalChunkNumber) {
        this.createFileFromChunks(saveDir, fileName, fileId, fileSize, partFileCount);
      }
    });

    return;
  }

  createFileFromChunks(saveDir, fileName, fileId, fileSize, partFileCount) {
    const savePartDir = `${saveDir}/part`;
    let deleteFileList = [];
    for (let i = 0; i < partFileCount; i += 1) {
      const partFilePath = `${savePartDir}/${fileId}part${i}`;
      fs.appendFileSync(`${saveDir}/${fileName}`, fs.readFileSync(partFilePath));
      deleteFileList.push(partFilePath);
    }

    const stats = fs.statSync(`${saveDir}/${fileName}`);
    if (stats.size !== fileSize) {
      throw new Error();
    }

    deleteFileList.forEach(partFilePath => {
      fs.unlink(partFilePath, readErr => {
        if (readErr) throw err;
      });
    });

    return;
  }
};
