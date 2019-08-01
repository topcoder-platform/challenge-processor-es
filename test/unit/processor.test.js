/**
 * The test cases for TC challenge processor.
 */

// During tests the node env is set to test
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const config = require('config')
const expect = require('chai').expect
const ProcessorService = require('../../src/services/ProcessorService')
const testHelper = require('../common/testHelper')
const helper = require('../../src/common/helper')
const {
  challengeId,
  notFoundId,
  challengeUpdatedMessage,
  challengePartiallyUpdatedMessage
} = require('../common/testData')

const client = helper.getESClient()

describe('TC Challenge Processor Unit Tests', () => {
  // Create record to be used in tests later
  before(async () => {
    await client.create({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeUpdatedMessage.payload.id,
      body: challengeUpdatedMessage.payload
    })
  })

  // Remove the record after running tests
  after(async () => {
    await client.delete({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeUpdatedMessage.payload.id
    })
  })

  it('update challenge message', async () => {
    await ProcessorService.update(challengeUpdatedMessage)
    const data = await testHelper.getESData(challengeId)
    // Joi re-formats dates, so ignore comparing date fields
    testHelper.expectObj(data, challengeUpdatedMessage.payload, ['created', 'updated'])
  })

  it('partially update challenge message', async () => {
    await ProcessorService.update(challengePartiallyUpdatedMessage)
    const data = await testHelper.getESData(challengeId)
    const expectedData = _.assignIn({}, challengeUpdatedMessage.payload, challengePartiallyUpdatedMessage.payload)
    // Joi re-formats dates, so ignore comparing date fields
    testHelper.expectObj(data, expectedData, ['created', 'updated'])
  })

  it('update challenge message - not found', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.id = notFoundId
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.statusCode).to.equal(404)
      expect(err.message).to.equal('Not Found')
      return
    }
    throw new Error('There should be not found error.')
  })

  it('update challenge message - invalid parameters, empty message', async () => {
    try {
      await ProcessorService.update({})
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"topic" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, null topic', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.topic = null
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"topic" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid topic', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.topic = [1, 2]
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"topic" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid originator', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.originator = { a: 1 }
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"originator" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid timestamp', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.timestamp = 'abc'
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"timestamp" must be a number of milliseconds or valid date string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, empty timestamp', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.timestamp = ''
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"timestamp" must be a number of milliseconds or valid date string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid mime-type', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    message['mime-type'] = 123
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"mime-type" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, missing payload', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    delete message.payload
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"payload" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, missing payload id', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    delete message.payload.id
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"id" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid payload id', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.id = 'abc'
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"id" must be a valid GUID'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid timelineTemplateId', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.timelineTemplateId = ['xyz']
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"timelineTemplateId" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid challenge setting', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.challengeSettings[0].other = 123
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"other" is not allowed'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid phase duration', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.phases[0].duration = 0
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"duration" must be a positive number'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid prize', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    message.payload.prizeSets[0].prizes[0].value = -2
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"value" must be a positive number'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid forumId', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    message.payload.forumId = 'abc'
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"forumId" must be a number'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid groups', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    message.payload.groups = { x: 1 }
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"groups" must be an array'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, invalid updated date', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    message.payload.updated = 'xyz'
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"updated" must be a number of milliseconds or valid date string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, missing updatedBy', async () => {
    const message = _.cloneDeep(challengePartiallyUpdatedMessage)
    delete message.payload.updatedBy
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"updatedBy" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })
})
