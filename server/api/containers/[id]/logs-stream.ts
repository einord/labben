import { dockerService } from '../../../services/docker'
import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'
import type { Readable } from 'node:stream'
const CONTAINER_ID_PATTERN = /\/api\/containers\/([^/]+)\/logs-stream/

export default defineWebSocketHandler({
  async open(peer) {
    // WebSocket handlers bypass Nitro middleware — validate session manually
    const cookieHeader = peer.request?.headers?.get('cookie') ?? ''
    const userId = await authService.getSessionUserIdFromCookie(cookieHeader)

    if (!userId || !databaseService.getUserById(userId)) {
      peer.send(JSON.stringify({ error: 'Authentication required' }))
      peer.close(1008, 'Authentication required')
      return
    }

    const url = peer.request?.url ?? ''
    const match = url.match(CONTAINER_ID_PATTERN)
    const containerId = match?.[1]

    if (!containerId) {
      peer.send(JSON.stringify({ error: 'Missing container id' }))
      peer.close(1008, 'Missing container id')
      return
    }

    try {
      const stream = await dockerService.streamContainerLogs(containerId)

      // Store stream reference on the peer context for cleanup
      const readableStream = stream as Readable
      peer.context.logStream = readableStream

      readableStream.on('data', (chunk: Buffer) => {
        try {
          peer.send(chunk.toString('utf-8'))
        } catch {
          // Peer may have disconnected
          readableStream.destroy()
        }
      })

      readableStream.on('error', () => {
        peer.close(1011, 'Log stream error')
      })

      readableStream.on('end', () => {
        peer.close(1000, 'Log stream ended')
      })
    } catch {
      peer.send(JSON.stringify({ error: 'Failed to start log stream' }))
      peer.close(1011, 'Failed to start log stream')
    }
  },

  close(peer) {
    const logStream = peer.context.logStream as Readable | undefined
    if (logStream) {
      logStream.destroy()
    }
  },
})
