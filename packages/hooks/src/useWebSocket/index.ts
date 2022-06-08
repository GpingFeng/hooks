import { useEffect, useRef, useState } from 'react';
import useLatest from '../useLatest';
import useMemoizedFn from '../useMemoizedFn';
import useUnmount from '../useUnmount';

export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

export interface Options {
  reconnectLimit?: number;
  reconnectInterval?: number;
  manual?: boolean;
  onOpen?: (event: WebSocketEventMap['open'], instance: WebSocket) => void;
  onClose?: (event: WebSocketEventMap['close'], instance: WebSocket) => void;
  onMessage?: (message: WebSocketEventMap['message'], instance: WebSocket) => void;
  onError?: (event: WebSocketEventMap['error'], instance: WebSocket) => void;

  protocols?: string | string[];
}

export interface Result {
  latestMessage?: WebSocketEventMap['message'];
  sendMessage?: WebSocket['send'];
  disconnect?: () => void;
  connect?: () => void;
  readyState: ReadyState;
  webSocketIns?: WebSocket;
}

export default function useWebSocket(
  // socketUrl。必填，webSocket 地址
  socketUrl: string,
  // 连接配置项
  options: Options = {},
): Result {
  const {
    reconnectLimit = 3,
    // 重试时间间隔（ms）
    reconnectInterval = 3 * 1000,
    manual = false,
    onOpen,
    onClose,
    onMessage,
    onError,
    protocols,
  } = options;

  const onOpenRef = useLatest(onOpen);
  const onCloseRef = useLatest(onClose);
  const onMessageRef = useLatest(onMessage);
  const onErrorRef = useLatest(onError);

  const reconnectTimesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const websocketRef = useRef<WebSocket>();

  const unmountedRef = useRef(false);

  const [latestMessage, setLatestMessage] = useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);

  // 重新连接
  const reconnect = () => {
    if (
      // 没有超过连接次数或者没有连接成功
      reconnectTimesRef.current < reconnectLimit &&
      websocketRef.current?.readyState !== ReadyState.Open
    ) {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      // 定时重连
      reconnectTimerRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        connectWs();
        reconnectTimesRef.current++;
      }, reconnectInterval);
    }
  };

  // 创建链接
  const connectWs = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    if (websocketRef.current) {
      websocketRef.current.close();
    }

    // new WebSocket
    const ws = new WebSocket(socketUrl, protocols);
    setReadyState(ReadyState.Connecting);

    ws.onerror = (event) => {
      if (unmountedRef.current) {
        return;
      }
      reconnect();
      // 错误的回调
      onErrorRef.current?.(event, ws);
      setReadyState(ws.readyState || ReadyState.Closed);
    };
    ws.onopen = (event) => {
      if (unmountedRef.current) {
        return;
      }
      // webSocket 连接成功回调
      onOpenRef.current?.(event, ws);
      reconnectTimesRef.current = 0;
      setReadyState(ws.readyState || ReadyState.Open);
    };
    ws.onmessage = (message: WebSocketEventMap['message']) => {
      if (unmountedRef.current) {
        return;
      }
      // webSocket 收到消息回调
      onMessageRef.current?.(message, ws);
      setLatestMessage(message);
    };
    ws.onclose = (event) => {
      if (unmountedRef.current) {
        return;
      }
      reconnect();
      // webSocket 关闭回调
      onCloseRef.current?.(event, ws);
      setReadyState(ws.readyState || ReadyState.Closed);
    };

    websocketRef.current = ws;
  };

  // 发送消息函数
  const sendMessage: WebSocket['send'] = (message) => {
    if (readyState === ReadyState.Open) {
      websocketRef.current?.send(message);
    } else {
      throw new Error('WebSocket disconnected');
    }
  };

  // 手动连接 webSocket，如果当前已有连接，则关闭后重新连接
  const connect = () => {
    reconnectTimesRef.current = 0;
    connectWs();
  };

  // 手动断开 webSocket 连接
  const disconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimesRef.current = reconnectLimit;
    websocketRef.current?.close();
  };

  useEffect(() => {
    // 如果手动，则不会触发连接
    if (!manual) {
      connect();
    }
  }, [socketUrl, manual]);

  useUnmount(() => {
    unmountedRef.current = true;
    disconnect();
  });

  return {
    latestMessage,
    sendMessage: useMemoizedFn(sendMessage),
    connect: useMemoizedFn(connect),
    disconnect: useMemoizedFn(disconnect),
    // 当前 webSocket 连接状态
    readyState,
    // webSocket 实例
    webSocketIns: websocketRef.current,
  };
}
