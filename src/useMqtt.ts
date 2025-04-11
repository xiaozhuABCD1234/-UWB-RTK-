import { ref, onMounted, onUnmounted } from 'vue'
import * as mqtt from 'mqtt'

export function useMqtt() {
  const client = ref<mqtt.MqttClient | null>(null)
  const isConnected = ref<boolean>(false)
  const messages = ref<{ topic: string; message: string }[]>([])

  const initMqtt = () => {
    const clientId = 'emqx_vue3_' + Math.random().toString(16).substring(2, 8)
    const username = 'test'
    const password = 'test'

    const options: mqtt.IClientOptions = {
      connectTimeout: 4000,
      clientId,
      username,
      password,
    }

    client.value = mqtt.connect('ws://106.14.209.20:8083/mqtt', options)

    client.value.on('connect', () => {
      isConnected.value = true
      console.log('MQTT connected')
    })

    client.value.on('message', (topic: string, message: Buffer) => {
      messages.value.push({ topic, message: message.toString() })
      console.log('Received message:', topic, message.toString())
    })

    client.value.on('error', (error: Error) => {
      console.error('MQTT error:', error)
    })

    client.value.on('close', () => {
      isConnected.value = false
      console.log('MQTT disconnected')
    })
  }

  const subscribe = (topic: string) => {
    if (client.value && isConnected.value) {
      client.value.subscribe(topic, (err: Error | null) => {
        if (err) {
          console.error('Subscribe error:', err)
        } else {
          console.log(`Subscribed to topic: ${topic}`)
        }
      })
    }
  }

  const publish = (topic: string, message: string) => {
    if (client.value && isConnected.value) {
      client.value.publish(topic, message, { qos: 0, retain: false })
      console.log(`Published message to topic ${topic}:`, message)
    }
  }

  const disconnect = () => {
    if (client.value) {
      client.value.end()
      client.value = null
    }
  }

  onMounted(() => {
    initMqtt()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    messages,
    subscribe,
    publish,
  }
}
