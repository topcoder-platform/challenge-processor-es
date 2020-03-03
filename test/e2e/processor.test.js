/**
 * The E2E test cases for TC challenge processor.
 * Configured external services are used.
 */

// During tests the node env is set to test
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const config = require('config')
const uuid = require('uuid/v4')
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
  updateResourceMessage,
  removeResourceMessage,
  createSubmissionMessage,
  updateSubmissionMessage,
  removeSubmissionMessage,
  requiredFields,
  stringFields,
  guidFields,
  dateFields
} = require('../common/testData')

const client = helper.getESClient()

describe('TC Challenge Processor E2E Tests', () => {
  before(async () => {
    // remove ES record if any
    try {
      await client.delete({
        index: config.get('esConfig.ES_INDEX'),
        type: config.get('esConfig.ES_TYPE'),
        id: challengeId,
        refresh: 'true'
      })
    } catch (e) {
      // ignore
    }
    // create ES record
    await client.create({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeId,
      body: challengeUpdatedMessage.payload,
      refresh: 'true'
    })
  })

  after(async () => {
    // Remove the record after running tests
    await client.delete({
      index: config.get('esConfig.ES_INDEX'),
      type: config.get('esConfig.ES_TYPE'),
      id: challengeId,
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
  })

  it('update challenge message - not found', async () => {
    const message = _.cloneDeep(challengeUpdatedMessage)
    message.payload.id = notFoundId
    try {
      await ProcessorService.update(message)
    } catch (err) {
      expect(err).to.exist // eslint-disable-line
      expect(err.statusCode).to.equal(404)
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

  const resourceOps = ['createResource', 'updateResource', 'removeResource']
  const resourceMessages = [createResourceMessage, updateResourceMessage, removeResourceMessage]

  for (let i = 0; i < resourceOps.length; i += 1) {
    const op = resourceOps[i]
    const testMessage = resourceMessages[i]

    it(`call ${op} successfully`, async () => {
      await ProcessorService[op](testMessage)
      const data = await testHelper.getESData(challengeId)
      expect(data.numberOfRegistrants).to.equal(3)
    })
  }

  const subOps = ['createSubmission', 'updateSubmission', 'removeSubmission']
  const subMessages = [createSubmissionMessage, updateSubmissionMessage, removeSubmissionMessage]

  for (let i = 0; i < subOps.length; i += 1) {
    const op = subOps[i]
    const testMessage = subMessages[i]

    it(`call ${op} successfully`, async () => {
      await ProcessorService[op](testMessage)
      const data = await testHelper.getESData(challengeId)
      expect(data.numberOfSubmissions).to.equal(2)
      expect(data.numberOfSubmitters).to.equal(2)
      expect(data.numberOfCheckpointSubmissions).to.equal(1)
      expect(data.submissions.length).to.equal(2)
      expect(data.submissions[0].submitterId).to.equal(123)
      expect(data.submissions[0].submitter).to.equal('handle1')
      expect(data.submissions[0].submissions.length).to.equal(1)
      expect(data.submissions[0].submissions[0].submissionId).to.equal('171233d3-019e-4033-b1cf-d7205c7f773a')
      expect(new Date(data.submissions[0].submissions[0].submissionTime).getTime()).to.equal(
        new Date('2020-01-02T12:11:11').getTime())
      expect(data.submissions[1].submitterId).to.equal(456)
      expect(data.submissions[1].submitter).to.equal('handle2')
      expect(data.submissions[1].submissions.length).to.equal(1)
      expect(data.submissions[1].submissions[0].submissionId).to.equal('171233d3-019e-4033-b1cf-d7205c7f773b')
      expect(new Date(data.submissions[1].submissions[0].submissionTime).getTime()).to.equal(
        new Date('2020-01-02T12:11:22').getTime())
      expect(data.checkpoints.length).to.equal(1)
      expect(data.checkpoints[0].submitterId).to.equal(789)
      expect(data.checkpoints[0].submitter).to.equal('handle3')
      expect(data.checkpoints[0].submissions.length).to.equal(1)
      expect(data.checkpoints[0].submissions[0].submissionId).to.equal('171233d3-019e-4033-b1cf-d7205c7f773c')
      expect(new Date(data.checkpoints[0].submissions[0].submissionTime).getTime()).to.equal(
        new Date('2020-01-02T12:11:33').getTime())
    })
  }

  const ops = ['createResource', 'updateResource', 'removeResource',
    'createSubmission', 'updateSubmission', 'removeSubmission']
  const messages = [createResourceMessage, updateResourceMessage, removeResourceMessage,
    createSubmissionMessage, updateSubmissionMessage, removeSubmissionMessage]

  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i]
    const testMessage = messages[i]

    if (_.get(testMessage, 'payload.challengeId')) {
      it(`${op} - not found`, async () => {
        const message = _.cloneDeep(testMessage)
        message.payload.challengeId = notFoundId
        try {
          await ProcessorService[op](message)
        } catch (err) {
          expect(err.message.indexOf('document_missing_exception') >= 0).to.equal(true)
          return
        }
        throw new Error('There should be not found error.')
      })
    }

    for (const requiredField of requiredFields) {
      if (_.get(testMessage, requiredField)) {
        it(`${op}, missing ${requiredField}`, async () => {
          let message = _.cloneDeep(testMessage)
          message = _.omit(message, requiredField)
          try {
            await ProcessorService[op](message)
          } catch (err) {
            expect(err.name).to.equal('ValidationError')
            const msg = `"${_.last(requiredField.split('.'))}" is required`
            expect(err.message.indexOf(msg) >= 0).to.equal(true)
            return
          }
          throw new Error('should not throw error here')
        })
      }
    }

    for (const stringField of stringFields) {
      if (_.get(testMessage, stringField)) {
        it(`${op}, invalid string type field ${stringField}`, async () => {
          const message = _.cloneDeep(testMessage)
          _.set(message, stringField, 123)
          try {
            await ProcessorService[op](message)
          } catch (err) {
            expect(err.name).to.equal('ValidationError')
            const msg = `"${_.last(stringField.split('.'))}" must be a string`
            expect(err.message.indexOf(msg) >= 0).to.equal(true)
            return
          }
          throw new Error('should not throw error here')
        })

        it(`${op}, empty string field ${stringField}`, async () => {
          const message = _.cloneDeep(testMessage)
          _.set(message, stringField, '')
          try {
            await ProcessorService[op](message)
          } catch (err) {
            expect(err.name).to.equal('ValidationError')
            const msg = `"${_.last(stringField.split('.'))}" is not allowed to be empty`
            expect(err.message.indexOf(msg) >= 0).to.equal(true)
            return
          }
          throw new Error('should not throw error here')
        })
      }
    }

    for (const dateField of dateFields) {
      if (_.get(testMessage, dateField)) {
        it(`${op}, invalid date type field ${dateField}`, async () => {
          const message = _.cloneDeep(testMessage)
          _.set(message, dateField, 'abc')
          try {
            await ProcessorService[op](message)
          } catch (err) {
            expect(err.name).to.equal('ValidationError')
            const msg = `"${_.last(dateField.split('.'))}" must be a number of milliseconds or valid date string`
            expect(err.message.indexOf(msg) >= 0).to.equal(true)
            return
          }
          throw new Error('should not throw error here')
        })
      }
    }

    for (const guidField of guidFields) {
      if (_.get(testMessage, guidField)) {
        it(`${op}, invalid GUID type field ${guidField}`, async () => {
          const message = _.cloneDeep(testMessage)
          _.set(message, guidField, '12345')
          try {
            await ProcessorService[op](message)
          } catch (err) {
            expect(err.name).to.equal('ValidationError')
            const msg = `"${_.last(guidField.split('.'))}" must be a valid GUID`
            expect(err.message.indexOf(msg) >= 0).to.equal(true)
            return
          }
          throw new Error('should not throw error here')
        })
      }
    }
  }
})
