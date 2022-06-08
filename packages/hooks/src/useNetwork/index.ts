import { useEffect, useState } from 'react';
import { isObject } from '../utils';

export interface NetworkState {
  since?: Date;
  online?: boolean;
  rtt?: number;
  type?: string;
  downlink?: number;
  saveData?: boolean;
  downlinkMax?: number;
  effectiveType?: string;
}

enum NetworkEventType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CHANGE = 'change',
}

// 获取网络状态
function getConnection() {
  const nav = navigator as any;
  if (!isObject(nav)) return null;
  // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/type
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

function getConnectionProperty(): NetworkState {
  const c = getConnection();
  if (!c) return {};
  return {
    // NetworkInformation.rtt 是一个只读属性，返回了当前连接下评估的往返时延（RTT, round-trip time ），并保留该值为 25 千分秒的最接近的整数倍。
    rtt: c.rtt,
    // The NetworkInformation.type read-only property returns the type of connection a device is using to communicate with the network.
    type: c.type,
    // 用户代理是否设置了减少数据使用的选项
    saveData: c.saveData,
    // 有效带宽估算（单位：兆比特/秒）
    downlink: c.downlink,
    // 最大下行速度（单位：兆比特/秒）
    downlinkMax: c.downlinkMax,
    // 网络连接的类型
    effectiveType: c.effectiveType,
  };
}
// 管理网络连接状态的 Hook。
function useNetwork(): NetworkState {
  const [state, setState] = useState(() => {
    return {
      since: undefined,
      online: navigator?.onLine,
      ...getConnectionProperty(),
    };
  });

  useEffect(() => {
    const onOnline = () => {
      setState((prevState) => ({
        ...prevState,
        online: true,
        since: new Date(),
      }));
    };

    const onOffline = () => {
      setState((prevState) => ({
        ...prevState,
        online: false,
        since: new Date(),
      }));
    };

    const onConnectionChange = () => {
      setState((prevState) => ({
        ...prevState,
        ...getConnectionProperty(),
      }));
    };

    // 监听网络变化
    window.addEventListener(NetworkEventType.ONLINE, onOnline);
    window.addEventListener(NetworkEventType.OFFLINE, onOffline);

    const connection = getConnection();
    connection?.addEventListener(NetworkEventType.CHANGE, onConnectionChange);

    return () => {
      window.removeEventListener(NetworkEventType.ONLINE, onOnline);
      window.removeEventListener(NetworkEventType.OFFLINE, onOffline);
      connection?.removeEventListener(NetworkEventType.CHANGE, onConnectionChange);
    };
  }, []);

  return state;
}

export default useNetwork;
