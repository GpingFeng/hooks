import { useRef, useState } from 'react';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useEffectWithTarget from '../utils/useEffectWithTarget';

interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  height: number;
  width: number;
}
export interface State extends Rect {
  text: string;
}

const initRect: Rect = {
  top: NaN,
  left: NaN,
  bottom: NaN,
  right: NaN,
  height: NaN,
  width: NaN,
};

// 初始值
const initState: State = {
  text: '',
  ...initRect,
};

function getRectFromSelection(selection: Selection | null): Rect {
  if (!selection) {
    return initRect;
  }

  if (selection.rangeCount < 1) {
    return initRect;
  }
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Selection/getRangeAt
  // 返回一个包含当前选区内容的区域对象。
  const range = selection.getRangeAt(0);
  // 获取它的位置
  const { height, width, top, left, right, bottom } = range.getBoundingClientRect();
  return {
    height,
    width,
    top,
    left,
    right,
    bottom,
  };
}

function useTextSelection(
  // DOM element or ref
  target?: BasicTarget<Document | Element>,
): State {
  const [state, setState] = useState(initState);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffectWithTarget(
    () => {
      const el = getTargetElement(target, document);
      if (!el) {
        return;
      }

      const mouseupHandler = () => {
        let selObj: Selection | null = null;
        let text = '';
        let rect = initRect;
        if (!window.getSelection) return;
        selObj = window.getSelection();
        text = selObj ? selObj.toString() : '';
        if (text) {
          rect = getRectFromSelection(selObj);
          setState({ ...state, text, ...rect });
        }
      };

      // 任意点击都需要清空之前的 range
      const mousedownHandler = () => {
        if (!window.getSelection) return;
        if (stateRef.current.text) {
          setState({ ...initState });
        }
        // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getSelection
        // 返回一个 Selection 对象，表示用户选择的文本范围或光标的当前位置。
        const selObj = window.getSelection();
        if (!selObj) return;
        // https://developer.mozilla.org/zh-CN/docs/Web/API/Selection/removeAllRanges
        // Selection.removeAllRanges() 方法会从当前 selection 对象中移除所有的 range 对象，取消所有的选择只 留下anchorNode 和focusNode属性并将其设置为 null。
        selObj.removeAllRanges();
      };

      // 监听 mouseup 和 mousedown
      el.addEventListener('mouseup', mouseupHandler);

      document.addEventListener('mousedown', mousedownHandler);

      return () => {
        el.removeEventListener('mouseup', mouseupHandler);
        document.removeEventListener('mousedown', mousedownHandler);
      };
    },
    [],
    // 目标元素
    target,
  );

  return state;
}

export default useTextSelection;
