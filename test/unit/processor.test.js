/**
 * The test cases for TC challenge processor.
 */

// During tests the node env is set to test
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const uuid = require('uuid/v4')
const config = require('config')
const expect = require('chai').expect
const ProcessorService = require('../../src/services/ProcessorService')
const testHelper = require('../common/testHelper')
const helper = require('../../src/common/helper')
const {
  challengeId,
  notFoundId,
  challengeUpdatedMessage,
  challengePartiallyUpdatedMessage,
  createResourceMessage,
  removeResourceMessage,
  createSubmissionMessage,
  removeSubmissionMessage
} = require('../common/testData')

const client = helper.getESClient()

describe('TC Challenge Processor Unit Tests', () => {
  // Create record to be used in tests later
  before(async () => {
    await client.create({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeUpdatedMessage.payload.id,
      body: challengeUpdatedMessage.payload,
      refresh: 'true'
    })
  })

  // Remove the record after running tests
  after(async () => {
    await client.delete({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeUpdatedMessage.payload.id,
      refresh: 'true'
    })
  })

  it('update challenge message', async () => {
    await ProcessorService.update(challengeUpdatedMessage)
    const data = await testHelper.getESData(challengeId)
    testHelper.expectObj(data, challengeUpdatedMessage.payload,
      ['created', 'updated', 'currentPhase', 'startDate', 'endDate', 'phases'])
    expect(new Date(data.created).getTime()).to.equal(new Date(challengeUpdatedMessage.payload.created).getTime())
    expect(new Date(data.updated).getTime()).to.equal(new Date(challengeUpdatedMessage.payload.updated).getTime())
    expect(new Date(data.startDate).getTime()).to.equal(new Date(challengeUpdatedMessage.payload.startDate).getTime())
    expect(data.currentPhase).to.exist // eslint-disable-line
    testHelper.expectSamePhase(data.currentPhase, challengeUpdatedMessage.payload.phases[1])
    expect(data.phases.length).to.equal(challengeUpdatedMessage.payload.phases.length)
    for (let i = 0; i < data.phases.length; i += 1) {
      testHelper.expectSamePhase(data.phases[i], challengeUpdatedMessage.payload.phases[i])
    }
    expect(data.endDate).to.exist // eslint-disable-line
    expect(new Date(data.endDate).getTime() - new Date(challengeUpdatedMessage.payload.startDate).getTime()).to.equal(300000)
    expect(testHelper.deepCompareArrays(challengeUpdatedMessage.payload.terms, data.terms), true)
  })

  it('partially update challenge message', async () => {
    await ProcessorService.update(challengePartiallyUpdatedMessage)
    const data = await testHelper.getESData(challengeId)
    const expectedData = _.assignIn({}, challengeUpdatedMessage.payload, challengePartiallyUpdatedMessage.payload)
    testHelper.expectObj(data, expectedData,
      ['created', 'updated', 'currentPhase', 'startDate', 'endDate', 'phases'])
    expect(new Date(data.created).getTime()).to.equal(new Date(expectedData.created).getTime())
    expect(new Date(data.updated).getTime()).to.equal(new Date(expectedData.updated).getTime())
    expect(new Date(data.startDate).getTime()).to.equal(new Date(expectedData.startDate).getTime())
    expect(data.currentPhase).to.exist // eslint-disable-line
    testHelper.expectSamePhase(data.currentPhase, expectedData.phases[1])
    expect(data.phases.length).to.equal(expectedData.phases.length)
    for (let i = 0; i < data.phases.length; i += 1) {
      testHelper.expectSamePhase(data.phases[i], expectedData.phases[i])
    }
    expect(data.endDate).to.exist // eslint-disable-line
    expect(new Date(data.endDate).getTime() - new Date(expectedData.startDate).getTime()).to.equal(300000)
    expect(testHelper.deepCompareArrays(challengePartiallyUpdatedMessage.payload.terms, data.terms), true)
  })

  it('update challenge message - invalid parameters, terms with negative id message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.terms[0].id = -20
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"id" must be a positive number'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, terms with invalid aggreeability type message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.terms[0].agreeabilityType = 800
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"agreeabilityType" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, terms with missing aggreeability type message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    delete message.payload.terms[0].agreeabilityType
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"agreeabilityType" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, terms with invalid title message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.terms[0].title = 800
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"title" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, terms with invalid url message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.terms[0].url = 800
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"url" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('update challenge message - invalid parameters, terms with invalid templateId message', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.terms[0].templateId = 800
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"templateId" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
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
    message.payload.phases = [{
      id: uuid(),
      phaseId: uuid(),
      isOpen: true,
      duration: 0
    }]
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

  it('create resource message', async () => {
    await ProcessorService.createResource(createResourceMessage)
    const data = await testHelper.getESData(challengeId)
    expect(data.numOfRegistrants).to.equal(1)
  })

  it('create resource message - invalid parameters, missing challengeId', async () => {
    const message = _.cloneDeep(createResourceMessage)
    delete message.payload.challengeId
    try {
      await ProcessorService.createResource(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"challengeId" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('create resource message - invalid parameters, missing roleId', async () => {
    const message = _.cloneDeep(createResourceMessage)
    delete message.payload.roleId
    try {
      await ProcessorService.createResource(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"roleId" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('remove resource message', async () => {
    await ProcessorService.removeResource(removeResourceMessage)
    const data = await testHelper.getESData(challengeId)
    expect(data.numOfRegistrants).to.equal(0)
  })

  it('remove resource message - invalid parameters, invalid challengeId', async () => {
    const message = _.cloneDeep(removeResourceMessage)
    message.payload.challengeId = [123]
    try {
      await ProcessorService.removeResource(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"challengeId" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('create submission message', async () => {
    await ProcessorService.createSubmission(createSubmissionMessage)
    const data = await testHelper.getESData(challengeId)
    expect(data.numOfSubmissions).to.equal(1)
  })

  it('create submission message - invalid parameters, missing challengeId', async () => {
    const message = _.cloneDeep(createSubmissionMessage)
    delete message.payload.challengeId
    try {
      await ProcessorService.createSubmission(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"challengeId" is required'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })

  it('remove submission message', async () => {
    await ProcessorService.removeSubmission(removeSubmissionMessage)
    const data = await testHelper.getESData(challengeId)
    expect(data.numOfSubmissions).to.equal(0)
  })

  it('remove submission message - invalid parameters, invalid challengeId', async () => {
    const message = _.cloneDeep(removeSubmissionMessage)
    message.payload.challengeId = [123]
    try {
      await ProcessorService.removeSubmission(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.name).to.equal('ValidationError')
      const msg = '"challengeId" must be a string'
      expect(err.message.indexOf(msg) >= 0).to.equal(true)
      return
    }
    throw new Error('There should be validation error.')
  })
})
