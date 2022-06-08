import canUseDom from '../../../utils/canUseDom';
// 判断是否在线
export default function isOnline(): boolean {
  if (canUseDom() && typeof navigator.onLine !== 'undefined') {
    // Returns the online status of the browser. The property returns a boolean value, with true meaning online and false meaning offline.
    // 返回浏览器的在线情况
    return navigator.onLine;
  }
  return true;
}
