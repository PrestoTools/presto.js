export const genUUIDv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const humanReadableSize = size => {
  let byte = Math.abs(parseFloat(size, 10));
  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let idx = -1;
  do {
    byte /= 1024;
    idx += 1;
  } while (byte >= 1024 && idx < units.length - 1);
  return byte.toFixed(1) + ' ' + units[idx];
};
