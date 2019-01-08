import Uploader from './core/Uploader';
import PrestoFile from './core/PrestoFile';
import EventDispatcher from './core/EventDispatcher';

import { defaultOptions } from './constants';

export default class Presto {
  constructor(options = {}) {
    this.options = Object.assign({}, defaultOptions, options);
    this.fileList = [];
    this.uploader = new Uploader(this.options, this.getNextChunk.bind(this));
    this.startTime = null;
    this.eventDispatcher = new EventDispatcher();
    if (typeof options.element === 'object') {
      this._initWithFormElement(options.element);
    }
  }

  _initWithFormElement(el) {
    el.querySelector('input[type="file"]').addEventListener('change', e => {
      this.reset.call(this, e.target.files);
    });
    el.addEventListener('submit', e => {
      e.preventDefault();
      this.send.call(this);
    });
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

  add(fileList, data = {}) {
    let addedList = [];
    Array.from(fileList).forEach(f => {
      const prestoFile = new PrestoFile(f, data, this.options);
      this.fileList.push(prestoFile);
      addedList.push(prestoFile);
      this._setFileEvents(prestoFile);
    });
    this.fire('added', [addedList]);
  }

  remove(prestoId) {
    if (prestoId === undefined || prestoId === null) {
      const removedIdList = this.fileList.map(f => {
        return f.prestoId;
      });
      this.fileList = [];
      this.fire('removed', [removedIdList]);
      return;
    }
    this.fileList = this.fileList.filter(f => {
      return f.prestoId !== prestoId;
    });
    this.fire('removed', [[prestoId]]);
  }

  reset(fileList, data = {}) {
    this.fileList = [];
    if (fileList !== undefined && fileList !== null) {
      this.add(fileList, data);
    }
    this.fire('reset');
  }

  send(prestoId) {
    if (prestoId === undefined || prestoId === null) {
      this.fileList.forEach(f => {
        f.send();
      });
    }

    const targetFile = this.fileList.find(f => {
      return f.prestoId === prestoId;
    });
    if (targetFile !== undefined) {
      targetFile.send();
    }

    const firstFile = this.fileList.find(f => {
      return f.status === 'ready';
    });
    if (firstFile === undefined) {
      return;
    }
    if (this.uploader.sending === false) {
      this.uploader.start();
      this.startTime = Date.now();
      this.fire('start');
    }
  }

  abort(prestoId) {
    if (this.uploader.sending === false) {
      return;
    }
    if (prestoId === undefined || prestoId === null) {
      this.uploader.stop();
    }
    const targetFile = this.fileList.find(f => {
      return f.prestoId === prestoId;
    });
    if (targetFile !== undefined) {
      targetFile.abort();
    }
    this.fire('abort');
  }

  progress() {
    let total = 0;
    let send = 0;
    this.fileList.forEach(f => {
      total += f.size;
      send += f.size * f.progress();
    });
    if (total === 0) {
      return 0;
    }
    return send / total;
  }

  getNextChunk() {
    const targetFile = this.fileList.find(f => {
      return ['ready', 'sending'].includes(f.status);
    });
    if (targetFile === undefined) {
      const unfinishedFile = this.fileList.find(f => {
        return ['ready', 'sending', 'closing', 'pending'].includes(f.status);
      });
      if (unfinishedFile === undefined) {
        this.uploader.stop();
        this.fire('complete', [Date.now() - this.startTime]);
      }
      return null;
    }
    return targetFile.getNextChunk();
  }

  _setFileEvents(prestoFile) {
    prestoFile.on('progress', (fileProgress, _prestoFile) => {
      this.fire('fileProgress', [fileProgress, _prestoFile]);
      this.fire('progress', [this.progress()]);
    });
    prestoFile.on('start', _prestoFile => {
      this.fire('fileStart', [_prestoFile]);
    });
    prestoFile.on('abort', _prestoFile => {
      this.fire('fileAbort', [_prestoFile]);
    });
    prestoFile.on('complete', _prestoFile => {
      this.fire('fileComplete', _prestoFile);
    });
    prestoFile.on('error', (chunkIndex, statusCode, statusText, _prestoFile) => {
      this.fire('fileError', [chunkIndex, statusCode, statusText, _prestoFile]);
    });
  }
}
