// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop
const getScrollTop = (el: Document | Element) => {
  if (el === document || el === document.body) {
    return Math.max(
      window.pageYOffset,
      document.documentElement.scrollTop,
      document.body.scrollTop,
    );
  }
  return (el as Element).scrollTop;
};
// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight
const getScrollHeight = (el: Document | Element) => {
  return (
    (el as Element).scrollHeight ||
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  );
};

// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/clientHeight
const getClientHeight = (el: Document | Element) => {
  return (
    (el as Element).clientHeight ||
    Math.max(document.documentElement.clientHeight, document.body.clientHeight)
  );
};

export { getScrollTop, getScrollHeight, getClientHeight };
