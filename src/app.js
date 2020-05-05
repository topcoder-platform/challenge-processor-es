/**
 * The application entry point
 */

global.Promise = require('bluebird')
const config = require('config')
const logger = require('./common/logger')
const Kafka = require('no-kafka')
const ProcessorService = require('./services/ProcessorService')
const healthcheck = require('topcoder-healthcheck-dropin')

// create consumer
const options = { connectionString: config.KAFKA_URL, handlerConcurrency: 1, groupId: config.KAFKA_GROUP_ID }
if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
}
const consumer = new Kafka.GroupConsumer(options)

// data handler
const dataHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
  const message = m.message.value.toString('utf8')
  logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
    m.offset}; Message: ${message}.`)
  let messageJSON
  try {
    messageJSON = JSON.parse(message)
  } catch (e) {
    logger.error('Invalid message JSON.')
    logger.logFullError(e)
    // ignore the message
    return
  }
  if (messageJSON.topic !== topic) {
    logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`)
    // ignore the message
    return
  }
  return (async () => {
    switch (topic) {
      case config.UPDATE_DATA_TOPIC:
        await ProcessorService.update(messageJSON)
        break
      // Moved to the API
      // case config.CREATE_RESOURCE_TOPIC:
      //   await ProcessorService.createResource(messageJSON)
      //   break
      case config.UPDATE_RESOURCE_TOPIC:
        await ProcessorService.updateResource(messageJSON)
        break
      case config.DELETE_RESOURCE_TOPIC:
        await ProcessorService.removeResource(messageJSON)
        break
      case config.CREATE_SUBMISSION_TOPIC:
        await ProcessorService.createSubmission(messageJSON)
        break
      case config.UPDATE_SUBMISSION_TOPIC:
        await ProcessorService.updateSubmission(messageJSON)
        break
      case config.DELETE_SUBMISSION_TOPIC:
        await ProcessorService.removeSubmission(messageJSON)
        break
      default:
        throw new Error(`Invalid topic: ${topic}`)
    }
  })()
    // commit offset
    .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
    .catch((err) => logger.logFullError(err))
})

// check if there is kafka connection alive
function check () {
  if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
    return false
  }
  let connected = true
  consumer.client.initialBrokers.forEach(conn => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
    connected = conn.connected & connected
  })
  return connected
}

logger.info('Starting kafka consumer')
consumer
  .init([{
    subscriptions: [
      config.UPDATE_DATA_TOPIC,
      config.CREATE_RESOURCE_TOPIC,
      config.UPDATE_RESOURCE_TOPIC,
      config.DELETE_RESOURCE_TOPIC,
      config.CREATE_SUBMISSION_TOPIC,
      config.UPDATE_SUBMISSION_TOPIC,
      config.DELETE_SUBMISSION_TOPIC
    ],
    handler: dataHandler
  }])
  .then(() => {
    healthcheck.init([check])
    logger.info('Kafka consumer initialized successfully')
  })
  .catch(logger.logFullError)
