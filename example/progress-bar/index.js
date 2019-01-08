const presto = new Presto({ url: '../server-php/index.php' });

const inputEl = document.querySelector('.fileInput_input');
const messageEl = document.querySelector('.message_text');
const startButton = document.querySelector('.operation_button-start');
const abortButton = document.querySelector('.operation_button-abort');
const resetButton = document.querySelector('.operation_button-reset');
const fileListEl = document.querySelector('.fileList_ul');
const totalProgressText = document.querySelector('.totalProgress_text');
const totalProgressBar = document.querySelector('.totalProgress_bar');

presto.on('reset', () => {
  if (presto.fileList.length === 0) {
    showMessage('empty', 'Nothing to upload');
    updateFileList();
    totalProgressText.textContent = '';
    totalProgressBar.setAttribute('style', 'width: 0%');
    return;
  }
  showMessage('ready', 'Uploader is ready');
  updateFileList();
});

presto.on('added', prestoFileList => {
  showMessage('ready', 'Uploader is ready');
  updateFileList();
});

presto.on('removed', prestoIdList => {
  prestoIdList.forEach(prestoId => {
    removeFile(prestoId);
  });
  if (presto.fileList.length === 0) {
    showMessage('empty', 'Nothing to upload');
  }
});

presto.on('start', () => {
  showMessage('running', 'Uploader is running');
});

presto.on('abort', () => {
  showMessage('ready', 'Uploader is ready');
});

presto.on('fileProgress', (fileProgress, prestoFile) => {
  updateProgress(prestoFile.prestoId, fileProgress);
  const progress = presto.progress();
  const percentage = parseInt(progress * 100, 10);
  totalProgressText.textContent = `${percentage}%`;
  totalProgressBar.setAttribute('style', `width: ${percentage}%`);
});

presto.on('complete', msec => {
  messageEl.dataset.status = 'complete';
  messageEl.textContent = `Upload completed in ${parseInt(msec / 1000, 10)} seconds`;
});

inputEl.addEventListener('change', () => {
  presto.add(inputEl.files, { testParam: 'Set additional form data here' });
});

startButton.addEventListener('click', () => {
  presto.send();
});

abortButton.addEventListener('click', () => {
  presto.abort();
});

resetButton.addEventListener('click', () => {
  inputEl.value = '';
  presto.reset();
});

const updateFileList = () => {
  document.querySelectorAll('.fileList_ul > li').forEach(el => {
    el.remove();
  });
  const fileListItems = presto.fileList.map(prestoFile => {
    const el = document.createElement('li');
    el.dataset.prestoId = prestoFile.prestoId;

    const textEl = document.createElement('p');
    textEl.classList.add('fileList_fileName');
    textEl.append(`${prestoFile.name} (${prestoFile.displaySize})`);

    const removeEl = document.createElement('button');
    removeEl.classList.add('fileList_remove');
    removeEl.append('Remove');
    removeEl.addEventListener('click', () => {
      presto.remove(prestoFile.prestoId);
    });

    const progressEl = document.createElement('div');
    progressEl.classList.add('fileList_progress');
    const fileProgress = prestoFile.progress();
    progressEl.setAttribute('style', `width: ${parseInt(fileProgress * 100, 10)}%`);

    el.append(textEl, removeEl, progressEl);

    return el;
  });
  fileListEl.append(...fileListItems);
};

const showMessage = (status, text) => {
  messageEl.dataset.status = status;
  messageEl.textContent = text;
};

const removeFile = prestoId => {
  const fileEl = document.querySelector(`.fileList_ul > li[data-presto-id="${prestoId}"]`);
  fileEl.remove();
};

const updateProgress = (prestoId, fileProgress) => {
  const progressEl = document.querySelector(
    `.fileList_ul > li[data-presto-id="${prestoId}"] > .fileList_progress`
  );
  progressEl.setAttribute('style', `width: ${parseInt(fileProgress * 100, 10)}%`);
};
