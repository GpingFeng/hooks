import { useRef, useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isNumber } from '../utils';

interface IData<T> {
  present?: T;
  past: T[];
  future: T[];
}

const dumpIndex = <T>(step: number, arr: T[]) => {
  let index =
    step > 0
      ? step - 1 // move forward
      : arr.length + step; // move backward
  if (index >= arr.length - 1) {
    index = arr.length - 1;
  }
  if (index < 0) {
    index = 0;
  }
  return index;
};

// 根据第几步，分成当前状态、之前、未来的状态
const split = <T>(step: number, targetArr: T[]) => {
  const index = dumpIndex(step, targetArr);
  return {
    _current: targetArr[index],
    _before: targetArr.slice(0, index),
    _after: targetArr.slice(index + 1),
  };
};

export default function useHistoryTravel<T>(initialValue?: T) {
  const [history, setHistory] = useState<IData<T | undefined>>({
    // 前一个
    present: initialValue,
    // 过去记录
    past: [],
    // 未来记录
    future: [],
  });

  const { present, past, future } = history;

  const initialValueRef = useRef(initialValue);

  // 重置
  const reset = (...params: any[]) => {
    const _initial = params.length > 0 ? params[0] : initialValueRef.current;
    initialValueRef.current = _initial;

    setHistory({
      present: _initial,
      future: [],
      past: [],
    });
  };

  // 更新，都是往过去的list中添加
  const updateValue = (val: T) => {
    setHistory({
      present: val,
      future: [],
      past: [...past, present],
    });
  };

  // 前进
  const _forward = (step: number = 1) => {
    if (future.length === 0) {
      return;
    }
    const { _before, _current, _after } = split(step, future);
    setHistory({
      // 旧状态，加上现在以及刚过去的
      past: [...past, present, ..._before],
      // 当前
      present: _current,
      future: _after,
    });
  };

  // 后退
  const _backward = (step: number = -1) => {
    if (past.length === 0) {
      return;
    }

    const { _before, _current, _after } = split(step, past);
    setHistory({
      past: _before,
      present: _current,
      future: [..._after, present, ...future],
    });
  };

  // 跳到第几步
  const go = (step: number) => {
    const stepNum = isNumber(step) ? step : Number(step);
    if (stepNum === 0) {
      return;
    }
    if (stepNum > 0) {
      return _forward(stepNum);
    }
    _backward(stepNum);
  };

  return {
    // 当前值
    value: present,
    // 可回退历史长度
    backLength: past.length,
    // 可前进历史长度
    forwardLength: future.length,
    // 设置 value
    setValue: useMemoizedFn(updateValue),
    // 前进步数, step < 0 为后退， step > 0 时为前进
    go: useMemoizedFn(go),
    // 向后回退一步
    back: useMemoizedFn(() => {
      go(-1);
    }),
    // 向前前进一步
    forward: useMemoizedFn(() => {
      go(1);
    }),
    // 重置到初始值，或提供一个新的初始值
    reset: useMemoizedFn(reset),
  };
}
