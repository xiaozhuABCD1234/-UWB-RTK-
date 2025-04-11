import mqtt from 'mqtt';

const url = 'ws://139.224.66.191:8083/mqtt';
const options = {
  clean: true,
  connectTimeout: 4000,
  clientId: 'emqx_testpub',
  username: '',
  password: ''
};

const client = mqtt.connect(url, options);

const xy = [
  // { x: 40, y: 150 },    // 起点
  { x: 40, y: 220 },
  // { x: 87, y: 340 },

  { x: 87, y: 220 },
  { x: 130, y: 220 },
  { x: 130, y: 210 },
  { x: 150, y: 210 },
  { x: 150, y: 220 },

  { x: 300, y: 195 },
  { x: 300, y: 200 },
  // { x: 335, y: 240 },
];
function generatePoints(path, step) {
  const points = [];

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    // 计算两点之间的距离
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 计算需要插入的点数
    const numPoints = Math.ceil(distance / step);

    // 生成中间点
    for (let j = 0; j <= numPoints; j++) {
      const t = j / numPoints;
      const x = current.x + t * dx;
      const y = current.y + t * dy;

      // 添加随机波动（-2 到 2 的随机值）
      const randomOffsetX = (Math.random() - 0.5) * 4; // -2 到 2
      const randomOffsetY = (Math.random() - 0.5) * 4; // -2 到 2

      points.push({
        x: Math.round(x + randomOffsetX),
        y: Math.round(y + randomOffsetY)
      });
    }
  }

  return points;
}

// 定义要依次发送的坐标点数组
const points = generatePoints(xy, 2);
client.on('connect', () => {
  console.log('Connected to MQTT broker');

  client.subscribe('location/sensors/1', (err) => {
    if (err) {
      console.error('Subscription error:', err);
      client.end();
      return;
    }

    console.log('Subscribed to topic: location/sensors/1');
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= points.length) {
        console.log('Finished sending path');
        clearInterval(interval);
        client.end();
        return;
      }

      const point = points[currentIndex];
      currentIndex++;

      client.publish('location/sensors/1', JSON.stringify(point), (err) => {
        if (err) {
          console.error('Publish error:', err);
          clearInterval(interval);
          client.end();
        } else {
          console.log('Message published:', point);
        }
      });
    }, 1000); // 每秒发送一个点
  });
});

client.on('error', (err) => {
  console.error('MQTT client error:', err);
  client.end();
});

client.on('close', () => {
  console.log('MQTT client disconnected');
});
