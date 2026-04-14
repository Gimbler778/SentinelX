import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

let connection = null;
let channel = null;
let reconnectTimeout = null;

const QUEUES = ['logs', 'alerts', 'scans'];
const EXCHANGE = 'sentinelx';

export async function initRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    channel = await connection.createChannel();

    // Set prefetch for fair dispatch
    await channel.prefetch(10);

    // Assert exchange
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Assert queues
    for (const queue of QUEUES) {
      await channel.assertQueue(queue, {
        durable: true,
        arguments: { 'x-message-ttl': 86400000 }, // 24h TTL
      });
      // Bind queues to exchange
      await channel.bindQueue(queue, EXCHANGE, `${queue}.#`);
    }

    console.log('✅ RabbitMQ connected — exchange: sentinelx, queues:', QUEUES.join(', '));

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      scheduleReconnect();
    });
    connection.on('close', () => {
      console.warn('RabbitMQ connection closed. Reconnecting...');
      scheduleReconnect();
    });

    return { connection, channel };
  } catch (error) {
    console.warn('⚠️  RabbitMQ unavailable — will retry in 10s:', error.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  reconnectTimeout = setTimeout(async () => {
    reconnectTimeout = null;
    await initRabbitMQ();
  }, 10000);
}

export function getChannel() {
  return channel;
}

// Publish message to exchange
export async function publish(routingKey, data) {
  if (!channel) return;
  const msg = JSON.stringify({ ...data, publishedAt: new Date().toISOString() });
  channel.publish(EXCHANGE, routingKey, Buffer.from(msg), { persistent: true });
}

// Subscribe to a queue
export async function subscribe(queue, handler) {
  if (!channel) return;
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      channel.ack(msg);
    } catch (err) {
      console.error(`Error processing message from ${queue}:`, err.message);
      channel.nack(msg, false, false); // dead-letter
    }
  });
}
