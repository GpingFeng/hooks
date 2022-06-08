import canUseDom from '../../../utils/canUseDom';

export default function isDocumentVisible(): boolean {
  if (canUseDom()) {
    //  Document.visibilityState （只读属性）, 返回document的可见性, 即当前可见元素的上下文环境. 由此可以知道当前文档(即为页面)是在背后, 或是不可见的隐藏的标签页，或者(正在)预渲染
    // 'hidden' : 此时页面对用户不可见. 即文档处于背景标签页或者窗口处于最小化状态，或者操作系统正处于 '锁屏状态' .
    return document.visibilityState !== 'hidden';
  }
  return true;
}
