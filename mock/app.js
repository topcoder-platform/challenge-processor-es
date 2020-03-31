/**
 * The application entry point for mock TC APIs
 */

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const winston = require('winston')

const app = express()
app.set('port', config.PORT)

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// get resources
app.get('/v5/resources', (req, res) => {
  winston.info('Get resources mock API is called.')
  res.json([{
    id: '271233d3-019e-4033-b1cf-d7205c7f7731',
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    memberId: 123,
    memberHandle: 'handle1',
    roleId: '173803d3-019e-4033-b1cf-d7205c7f773a',
    created: '2020-01-02T12:11:11',
    updated: '2020-01-02T12:11:11',
    createdBy: 'admin',
    updatedBy: 'admin'
  }, {
    id: '271233d3-019e-4033-b1cf-d7205c7f7731',
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    memberId: 456,
    memberHandle: 'handle2',
    roleId: '173803d3-019e-4033-b1cf-d7205c7f773a',
    created: '2020-01-02T12:11:22',
    updated: '2020-01-02T12:11:22',
    createdBy: 'admin',
    updatedBy: 'admin'
  }, {
    id: '271233d3-019e-4033-b1cf-d7205c7f7731',
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    memberId: 789,
    memberHandle: 'handle3',
    roleId: '173803d3-019e-4033-b1cf-d7205c7f773a',
    created: '2020-01-02T12:11:33',
    updated: '2020-01-02T12:11:33',
    createdBy: 'admin',
    updatedBy: 'admin'
  }])
})

// get submissions
app.get('/v5/submissions', (req, res) => {
  winston.info('Get submissions mock API is called.')
  if (req.query.page && Number(req.query.page) >= 2) {
    res.json([])
    return
  }
  res.json([{
    id: '171233d3-019e-4033-b1cf-d7205c7f773a',
    type: 'Contest Submission',
    url: 'http://test.com/111.zip',
    memberId: 123,
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    created: '2020-01-02T12:11:11'
  }, {
    id: '171233d3-019e-4033-b1cf-d7205c7f773b',
    type: 'Contest Submission',
    url: 'http://test.com/222.zip',
    memberId: 456,
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    created: '2020-01-02T12:11:22'
  }, {
    id: '171233d3-019e-4033-b1cf-d7205c7f773c',
    type: 'Checkpoint Submission',
    url: 'http://test.com/333.zip',
    memberId: 789,
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    created: '2020-01-02T12:11:33'
  }])
})

// get single submission
app.get('/v5/submissions/:id', (req, res) => {
  winston.info('Get single submission mock API is called.')
  res.json({
    id: '171233d3-019e-4033-b1cf-d7205c7f773d',
    type: 'Contest Submission',
    url: 'http://test.com/444.zip',
    challengeId: '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8',
    memberId: 123,
    created: '2020-01-02T12:11:11'
  })
})

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' })
})

app.use((err, req, res, next) => {
  winston.error(err)
  res.status(500).json({
    error: err.message
  })
})

app.listen(app.get('port'), '0.0.0.0', () => {
  winston.info(`Express server listening on port ${app.get('port')}`)
})
