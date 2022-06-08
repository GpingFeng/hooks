// 看能不能支持 DOM。一般用于判断是否能够在服务端进行使用
export default function canUseDom() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}
