import { appConfig } from '@/config'

export type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface BaseWebSocketClientOptions<TMessage> {
  path: string
  heartbeatIntervalMs?: number
  heartbeatPayload?: Record<string, unknown>
  parseMessage?: (raw: string) => TMessage
}

export class BaseWebSocketClient<TMessage> {
  private ws: WebSocket | null = null
  private status: WebSocketStatus = 'idle'
  private readonly wsUrl: string
  private readonly heartbeatIntervalMs: number | null
  private readonly heartbeatPayload: Record<string, unknown> | null
  private readonly parseMessage: (raw: string) => TMessage
  private heartbeatInterval: number | null = null
  private onMessageCallback: ((message: TMessage) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private onStatusChangeCallback: ((status: WebSocketStatus) => void) | null = null

  constructor(options: BaseWebSocketClientOptions<TMessage>) {
    const apiUrl = new URL(appConfig.apiBaseUrl)
    const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    this.wsUrl = `${wsProtocol}//${apiUrl.host}${apiUrl.pathname}${options.path}`
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? null
    this.heartbeatPayload = options.heartbeatPayload ?? null
    this.parseMessage = options.parseMessage ?? ((raw) => JSON.parse(raw) as TMessage)
  }

  onMessage(callback: (message: TMessage) => void): void {
    this.onMessageCallback = callback
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback
  }

  onStatusChange(callback: (status: WebSocketStatus) => void): void {
    this.onStatusChangeCallback = callback
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.setStatus('connecting')

    const socket = new WebSocket(this.wsUrl)
    this.ws = socket

    socket.onopen = () => {
      this.setStatus('connected')
      this.startHeartbeat()
    }

    socket.onclose = () => {
      this.stopHeartbeat()
      this.ws = null
      this.setStatus('disconnected')
    }

    socket.onerror = () => {
      this.setStatus('error')
      this.onErrorCallback?.('WebSocket connection failed')
    }

    socket.onmessage = (event) => {
      try {
        const message = this.parseMessage(event.data)
        this.onMessageCallback?.(message)
      } catch {
        // ignore non-json messages
      }
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    this.ws?.close()
    this.ws = null
    this.setStatus('idle')
  }

  sendJson(payload: Record<string, unknown>): boolean {
    if (!this.isOpen()) {
      this.reportError('WebSocket not connected')
      return false
    }
    this.ws?.send(JSON.stringify(payload))
    return true
  }

  get currentStatus(): WebSocketStatus {
    return this.status
  }

  protected isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  protected reportError(error: string): void {
    this.onErrorCallback?.(error)
  }

  private setStatus(status: WebSocketStatus): void {
    this.status = status
    this.onStatusChangeCallback?.(status)
  }

  private startHeartbeat(): void {
    if (!this.heartbeatIntervalMs || !this.heartbeatPayload) return

    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isOpen()) {
        this.ws?.send(JSON.stringify(this.heartbeatPayload))
      }
    }, this.heartbeatIntervalMs)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
