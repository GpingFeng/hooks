import { useEffect, useState } from 'react';

type Subscriber = () => void;

// 全局订阅者
const subscribers = new Set<Subscriber>();

type ResponsiveConfig = Record<string, number>;
type ResponsiveInfo = Record<string, boolean>;

// 当前的全局信息 
let info: ResponsiveInfo;

// 默认配置
let responsiveConfig: ResponsiveConfig = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// resize 事件回调
function handleResize() {
  const oldInfo = info;
  // 计算
  calculate();
  // 假如没有更新，则直接返回
  if (oldInfo === info) return;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

let listening = false;

// 计算
function calculate() {
  const width = window.innerWidth;
  const newInfo = {} as ResponsiveInfo;
  let shouldUpdate = false;
  for (const key of Object.keys(responsiveConfig)) {
    // 如果宽度大于配置值，则为 true。
    newInfo[key] = width >= responsiveConfig[key];
    if (newInfo[key] !== info[key]) {
      shouldUpdate = true;
    }
  }
  // 假如有更新，则更新
  if (shouldUpdate) {
    info = newInfo;
  }
}

// 暴露的可以配置方法
export function configResponsive(config: ResponsiveConfig) {
  responsiveConfig = config;
  if (info) calculate();
}

export function useResponsive() {
  const windowExists = typeof window !== 'undefined';
  // listening 避免多次监听，性能考虑
  if (windowExists && !listening) {
    info = {};
    calculate();
    // 监听 resize 事件
    window.addEventListener('resize', handleResize);
    listening = true;
  }
  const [state, setState] = useState<ResponsiveInfo>(info);

  useEffect(() => {
    // 不支持非 window
    if (!windowExists) return;

    const subscriber = () => {
      setState(info);
    };
    subscribers.add(subscriber);
    return () => {
      // 组件销毁取消订阅
      subscribers.delete(subscriber);
      // 当全局订阅器不再有订阅器，则移除 resize
      if (subscribers.size === 0) {
        // 移除 resize 方法
        window.removeEventListener('resize', handleResize);
        listening = false;
      }
    };
  }, []);

  return state;
}
