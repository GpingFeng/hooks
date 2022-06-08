import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import useLatest from '../useLatest';

export type TDate = Date | number | string | undefined;

export type Options = {
  targetDate?: TDate;
  interval?: number;
  onEnd?: () => void;
};

export interface FormattedRes {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

const calcLeft = (t?: TDate) => {
  if (!t) {
    return 0;
  }
  // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
  // 计算剩余时间，目标时间 - 当前时间 > 0
  const left = dayjs(t).valueOf() - new Date().getTime();
  if (left < 0) {
    return 0;
  }
  return left;
};

// 格式化后的倒计时
const parseMs = (milliseconds: number): FormattedRes => {
  return {
    days: Math.floor(milliseconds / 86400000),
    hours: Math.floor(milliseconds / 3600000) % 24,
    minutes: Math.floor(milliseconds / 60000) % 60,
    seconds: Math.floor(milliseconds / 1000) % 60,
    milliseconds: Math.floor(milliseconds) % 1000,
  };
};

const useCountdown = (options?: Options) => {
  const {
    // 目标时间
    targetDate,
    // 变化时间间隔（毫秒）
    interval = 1000,
    // 倒计时结束触发
    onEnd,
  } = options || {};

  // 如果初始 state 需要通过复杂计算获得，则可以传入一个函数，在函数中计算并返回初始的 state，此函数只在初始渲染时被调用
  const [timeLeft, setTimeLeft] = useState(() => calcLeft(targetDate));

  const onEndRef = useLatest(onEnd);

  useEffect(() => {
    if (!targetDate) {
      // for stop
      setTimeLeft(0);
      return;
    }

    // 立即执行一次
    setTimeLeft(calcLeft(targetDate));

    // 定时器
    const timer = setInterval(() => {
      const targetLeft = calcLeft(targetDate);
      setTimeLeft(targetLeft);
      // 剩余为 0，则取消定时器，并执行 onEnd 回调
      if (targetLeft === 0) {
        clearInterval(timer);
        onEndRef.current?.();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetDate, interval]);

  const formattedRes = useMemo(() => {
    return parseMs(timeLeft);
  }, [timeLeft]);

  return [timeLeft, formattedRes] as const;
};

export default useCountdown;
