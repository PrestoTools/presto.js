import EventDispatcher from './EventDispatcher';
import { humanReadableSize } from '../utils';

export default class PrestoFile {
  constructor(fileObject, options) {
    this.fileObject = fileObject;
    this.prestoId = options.uniqueIdGenerator(fileObject);
    this.status = 'waiting'; //waiting,ready,sending,pending,closing,done,error
    this.chunkSize = options.chunkSize;
    this.name = this._getFileName();
    this.size = this._getFileSize();
    this.displaySize = this._getDisplaySize();
    this.totalChunkNumber = parseInt(this.size / this.chunkSize, 10) + 1;
    this.lastChunkIndex = -1;
    this.successChunkCount = 0;
    this.errorChunkIndexList = [];
    this.eventDispatcher = new EventDispatcher();
  }

  //events
  on(event, callback) {
    this.eventDispatcher.addListener(event, callback);
  }

  off(event, fn) {
    this.eventDispatcher.removeListener(event, fn);
  }

  fire(event, args) {
    this.eventDispatcher.dispatch(event, args);
  }

  send() {
    if (['waiting', 'pending', 'error'].includes(this.status)) {
      this.status = 'ready';
      this.fire('start', [this]);
    }
  }

  abort() {
    if (['ready', 'sending', 'error'].includes(this.status)) {
      this.status = 'pending';
      this.fire('abort', [this]);
    }
  }

  getNextChunk() {
    if (!['ready', 'sending'].includes(this.status)) {
      return null;
    }
    const chunkIndex = this._getNextChunkIndex();
    if (chunkIndex >= this.totalChunkNumber) {
      return null;
    }
    if (this.successChunkCount >= this.totalChunkNumber - 1) {
      this.status = 'closing';
    }
    return {
      chunkIndex: chunkIndex,
      blob: this._sliceBlob(chunkIndex),
      prestoId: this.prestoId,
      totalChunkNumber: this.totalChunkNumber,
      name: this.name,
      size: this.size,
      onSuccess: this.chunkSuccess.bind(this),
      onError: this.chunkError.bind(this)
    };
  }

  chunkSuccess() {
    this.successChunkCount += 1;
    this.fire('progress', [this.progress(), this]);
    if (this.successChunkCount < this.totalChunkNumber) {
      return;
    }
    this._fileComplete();
  }

  chunkError(chunkIndex, statusCode, statusText) {
    this.errorChunkIndexList.push(chunkIndex);
    this.status = 'sending'; //should change status when 'closing'
    this.fire('error', [chunkIndex, statusCode, statusText, this]);
  }

  progress() {
    return this.successChunkCount / this.totalChunkNumber;
  }

  _fileComplete() {
    this.status = 'done';
    this.fire('complete', [this]);
  }

  _getNextChunkIndex() {
    if (this.errorChunkIndexList.length > 0) {
      return this.errorChunkIndexList.shift();
    }
    this.lastChunkIndex += 1;
    return this.lastChunkIndex;
  }

  _sliceBlob(index) {
    const start = index * this.chunkSize;
    if (start > this.size) {
      return null;
    }
    let stop = start + this.chunkSize;
    if (stop > this.size) {
      stop = this.size;
    }
    return this.fileObject.slice(start, stop);
  }

  _getFileName() {
    return this.fileObject.name;
  }

  _getFileSize() {
    return parseInt(this.fileObject.size, 10);
  }

  _getDisplaySize() {
    return humanReadableSize(this._getFileSize());
  }
}
