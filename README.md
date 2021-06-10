# Topcoder - Challenge Elasticsearch Processor

This microservice processes kafka events related to challenges and updates data in ElasticSearch

### Development deployment status
[![CircleCI](https://circleci.com/gh/topcoder-platform/challenge-processor-es/tree/develop.svg?style=svg)](https://circleci.com/gh/topcoder-platform/challenge-processor-es/tree/develop)

### Production deployment status
[![CircleCI](https://circleci.com/gh/topcoder-platform/challenge-processor-es/tree/master.svg?style=svg)](https://circleci.com/gh/topcoder-platform/challenge-processor-es/tree/master)
  
## Intended use

- Processor for updating challenge data in ES  

## Related repos 
-  [Challenge API](https://github.com/topcoder-platform/challenge-api)
-  [Legacy Processor](https://github.com/topcoder-platform/legacy-challenge-processor) - Moves data from DynamoDB back to Informix
-  [Legacy Migration Script](https://github.com/topcoder-platform/legacy-challenge-migration-script) - Moves data from Informix to DynamoDB
-  [Frontend App](https://github.com/topcoder-platform/challenge-engine-ui)
  
## Prerequisites

-  [NodeJS](https://nodejs.org/en/) (v8+)
-  [Elasticsearch v6](https://www.elastic.co/)
-  [Kafka](https://kafka.apache.org/)
-  [Docker](https://www.docker.com/)
-  [Docker Compose](https://docs.docker.com/compose/)

## Configuration

Configuration for the processor is at `config/default.js` and `config/production.js`.
The following parameters can be set in config files or in env variables:

- DISABLE_LOGGING: whether to disable logging, default is false
- LOG_LEVEL: the log level; default value: 'debug'
- AUTH0_URL: AUTH0 URL, used to get M2M token
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token, default value is 'https://www.topcoder-dev.com'
- TOKEN_CACHE_TIME: AUTH0 token cache time, used to get M2M token
- AUTH0_PROXY_SERVER_URL: Auth0 proxy server url, used to get TC M2M token
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token
- KAFKA_URL: comma separated Kafka hosts; default value: 'localhost:9092'
- KAFKA_GROUP_ID: the Kafka group id; default value: 'challenge-processor-es'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional; default value is undefined;
if not provided, then SSL connection is not used, direct insecure connection is used;
if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional; default value is undefined;
if not provided, then SSL connection is not used, direct insecure connection is used;
if provided, it can be either path to private key file or private key content
- UPDATE_DATA_TOPIC: update data Kafka topic, default value is 'challenge.notification.update'
- CREATE_RESOURCE_TOPIC: create resource Kafka topic, default value is 'challenge.action.resource.create'
- UPDATE_RESOURCE_TOPIC: update resource Kafka topic, default value is 'challenge.action.resource.update'
- DELETE_RESOURCE_TOPIC: delete resource Kafka topic, default value is 'challenge.action.resource.delete'
- CREATE_SUBMISSION_TOPIC: create submission Kafka topic, default value is 'submission.notification.create'
- UPDATE_SUBMISSION_TOPIC: update submission Kafka topic, default value is 'submission.notification.update'
- DELETE_SUBMISSION_TOPIC: delete submission Kafka topic, default value is 'submission.notification.delete'
- REGISTRANT_RESOURCE_ROLE_ID: challenge registrant resource role id, if not provided then any role is considered as registrant
- SUBMISSIONS_API_URL: TC submissions API URL, default value is mock API 'http://localhost:4000/v5/submissions'
- RESOURCES_API_URL: TC resources API URL, default value is mock API 'http://localhost:4000/v5/resources'
- CONTEST_SUBMISSION_TYPE: contest submission type name, default value is 'Contest Submission'
- CHECKPOINT_SUBMISSION_TYPE: checkpoint submission type name, default value is 'Checkpoint Submission'
- REQUEST_TIMEOUT: superagent request timeout in milliseconds, default value is 20000
- esConfig: config object for Elasticsearch

Refer to `esConfig` variable in `config/default.js` for ES related configuration.

Set the following environment variables so that the app can get TC M2M token (use 'set' insted of 'export' for Windows OS):
```
export AUTH0_CLIENT_ID=EkE9qU3Ey6hdJwOsF1X0duwskqcDuElW
export AUTH0_CLIENT_SECRET=Iq7REiEacFmepPh0UpKoOmc6u74WjuoJriLayeVnt311qeKNBvhRNBe9BZ8WABYk
export AUTH0_URL=https://topcoder-dev.auth0.com/oauth/token
export AUTH0_AUDIENCE=https://m2m.topcoder-dev.com/
```

Also note that there is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable

Config for tests are at `config/test.js`, it overrides some default config.

## Available commands
1. install dependencies `npm i`
2. run code lint check `npm run lint`, running `npm run lint:fix` can fix some lint errors if any
3. initialize Elasticsearch, create configured Elasticsearch index if not present: `npm run init-es`
4. or to re-create the index: `npm run init-es force`
5. start processor app `npm start`

  
## Local Deployment

### Foreman Setup
To install foreman follow this [link](https://theforeman.org/manuals/1.24/#3.InstallingForeman)
To know how to use foreman follow this [link](https://theforeman.org/manuals/1.24/#2.Quickstart)

### Local Kafka setup

-  `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead

- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`

- extract out the doanlowded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
`bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
`bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create topics:
`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.update`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.action.resource.create`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.action.resource.update`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.action.resource.delete`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.create`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.update`

`bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic submission.notification.delete`

- verify that the topics are created:

`bin/kafka-topics.sh --list --zookeeper localhost:2181`,

it should list out the created topics
- run the producer and then write some message into the console to send to the `challenge.notification.update` topic:

`bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.update`

in the console, write message, one message per line:

`{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "7b37a31e-484c-4d1e-aa9f-cfd6656e11d8", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`

- optionally, use another terminal, go to same directory, start a consumer to view the messages:

`bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic challenge.notification.update --from-beginning`

- send/view messages to/from other topics are similar

### Local Elasticsearch setup
- in the `docker-es` folder, run `docker-compose up`

### Local deployment without Docker
- start mock API, go to `mock` folder, run `npm i` and `npm start`, mock api is running at `http://localhost:4000`
- install dependencies `npm i`
- run code lint check `npm run lint`, running `npm run lint:fix` can fix some lint errors if any
- initialize Elasticsearch, create configured Elasticsearch index if not present: `npm run init-es`
- or to re-create the index: `npm run init-es force`
- start processor app `npm start`

### Local Deployment with Docker

To run the Challenge ES Processor using docker, follow the below steps
1. Navigate to the directory `docker`
2. Rename the file `sample.api.env` to `api.env`
3. Set the required AWS credentials in the file `api.env`
4. Once that is done, run the following command
```
docker-compose up
```
5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

 
## Production deployment

- TBD

## Running tests Locally

### Configuration

Test configuration is at `config/test.js`. You don't need to change them.
The following test parameters can be set in config file or in env variables:

- esConfig: config object for Elasticsearch

Integration tests use different index `challenge-test` which is not same as the usual index `challenge`.

Please ensure to create the index `challenge-test` or the index specified in the environment variable `ES_INDEX_TEST` before running the Integration tests. You could re-use the existing scripts to create index but you would need to set the below environment variable
```
export ES_INDEX=challenge-test
```
Or, you may temporarily modify the esConfig.ES_INDEX in config/default.js to `challenge-test` and run `npm run init-es` to create test index.

### Prepare
- Mock API should be started.
- Initialize Elasticsearch.
- Various config parameters should be properly set.

### Running unit tests

To run unit tests alone
```bash
npm run test
```
To run unit tests with coverage report

```bash
npm run cov
```

### Running integration tests
To run integration tests alone
```bash
npm run e2e
```
To run integration tests with coverage report

```bash
npm run cov-e2e
```

## Running tests in CI
- TBD

## Verification
Refer to the verification document `Verification.md`

Commit to force redeployment
