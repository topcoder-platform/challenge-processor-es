# Topcoder - Challenge Elasticsearch Processor

## Dependencies

- nodejs https://nodejs.org/en/ (v8+)
- Kafka
- ElasticSearch
- Docker, Docker Compose

## Configuration

Configuration for the processor is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level; default value: 'debug'
- KAFKA_URL: comma separated Kafka hosts; default value: 'localhost:9092'
- KAFKA_GROUP_ID: the Kafka group id; default value: 'challenge-processor-es'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional; default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- CREATE_DATA_TOPIC: create data Kafka topic, default value is 'challenge.notification.create'
- UPDATE_DATA_TOPIC: update data Kafka topic, default value is 'challenge.notification.update'
- esConfig: config object for Elasticsearch

Refer to `esConfig` variable in `config/default.js` for ES related configuration.

Also note that there is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable

Config for tests are at `config/test.js`, it overrides some default config.


## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the doanlowded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create some topics:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.create`
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.update`
- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then write some message into the console to send to the `challenge.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.create`
  in the console, write message, one message per line:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test", "description": "desc", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "name": "review", "isActive": true, "duration": 10000 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "winning prize", "value": 500 }] }], "reviewType": "code review", "tags": ["code"], "projectId": 123, "forumId": 456, "status": "Active", "created": "2018-01-02T00:00:00", "createdBy": "admin" } }`
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic challenge.notification.create --from-beginning`
- writing/reading messages to/from other topics are similar


## Local Elasticsearch setup

- in the `docker-es` folder, run `docker-compose up`

## Local deployment

- install dependencies `npm i`
- run code lint check `npm run lint`, running `npm run lint:fix` can fix some lint errors if any
- initialize Elasticsearch, create configured Elasticsearch index if not present: `npm run init-es`
- or to re-create the index: `npm run init-es force`
- start processor app `npm start`

## Local Deployment with Docker

To run the Challenge ES Processor using docker, follow the below steps

1. Navigate to the directory `docker`

2. Rename the file `sample.api.env` to `api.env`

3. Set the required AWS credentials in the file `api.env`

4. Once that is done, run the following command

```
docker-compose up
```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Unit tests and Integration tests

Integration tests use different index `challenge-test` which is not same as the usual index `challenge`.

Please ensure to create the index `challenge-test` or the index specified in the environment variable `ES_INDEX_TEST` before running the Integration tests. You could re-use the existing scripts to create index but you would need to set the below environment variable

```
export ES_INDEX=challenge-test
```

Or, you may temporarily modify the esConfig.ES_INDEX in config/default.js to `challenge-test` and run `npm run init-es` to create test index.


#### Running unit tests and coverage

To run unit tests alone

```
npm run test
```

To run unit tests with coverage report

```
npm run cov
```

#### Running integration tests and coverage

To run integration tests alone

```
npm run e2e
```

To run integration tests with coverage report

```
npm run cov-e2e
```


## Verification

- start kafka server, start elasticsearch, initialize Elasticsearch, start processor app
- start kafka-console-producer to write messages to `challenge.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.create`
- write message:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test", "description": "desc", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "name": "review", "isActive": true, "duration": 10000 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "winning prize", "value": 500 }] }], "reviewType": "code review", "tags": ["code"], "projectId": 123, "forumId": 456, "status": "Active", "created": "2018-01-02T00:00:00", "createdBy": "admin" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the created data, you will see the data are properly created:

```bash
info: Elasticsearch data:
info: {
    "id": "173803d3-019e-4033-b1cf-d7205c7f774c",
    "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff",
    "track": "Code",
    "name": "test",
    "description": "desc",
    "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa",
    "phases": [
        {
            "id": "8e17090c-465b-4c17-b6d9-dfa16300b012",
            "name": "review",
            "isActive": true,
            "duration": 10000
        }
    ],
    "prizeSets": [
        {
            "type": "prize",
            "prizes": [
                {
                    "type": "winning prize",
                    "value": 500
                }
            ]
        }
    ],
    "reviewType": "code review",
    "tags": [
        "code"
    ],
    "projectId": 123,
    "forumId": 456,
    "status": "Active",
    "created": "2018-01-01T16:00:00.000Z",
    "createdBy": "admin"
}
info: Done!
```

- you may write invalid message like:
  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "invalid", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test", "description": "desc", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "name": "review", "isActive": true, "duration": 10000 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "winning prize", "value": 500 }] }], "reviewType": "code review", "tags": ["code"], "projectId": 123, "forumId": 456, "status": "Active", "created": "2019-02-16T00:00:00", "createdBy": "admin" } }`

  `{ "topic": "challenge.notification.create", "originator": "challenge-api", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test", "description": "desc", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "name": "review", "isActive": true, "duration": 10000 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "winning prize", "value": 500 }] }], "reviewType": "code review", "tags": ["code"], "projectId": 123, "forumId": -456, "status": "Active", "created": "2018-01-02T00:00:00", "createdBy": "admin" } }`

  `{ [ { abc`
- then in the app console, you will see error messages

- start kafka-console-producer to write messages to `challenge.notification.update` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.update`

- write message to partially update data:
  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": "Code", "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
info: Elasticsearch data:
info: {
    "id": "173803d3-019e-4033-b1cf-d7205c7f774c",
    "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff",
    "track": "Code",
    "name": "test3",
    "description": "desc3",
    "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd",
    "phases": [
        {
            "id": "8e17090c-465b-4c17-b6d9-dfa16300b012",
            "name": "review",
            "isActive": true,
            "duration": 10000
        }
    ],
    "prizeSets": [
        {
            "type": "prize",
            "prizes": [
                {
                    "type": "winning prize",
                    "value": 500
                }
            ]
        }
    ],
    "reviewType": "code review",
    "tags": [
        "code"
    ],
    "projectId": 123,
    "forumId": 456,
    "status": "Active",
    "created": "2018-01-01T16:00:00.000Z",
    "createdBy": "admin",
    "updatedBy": "admin",
    "groups": [
        "group2",
        "group3"
    ],
    "updated": "2019-02-16T17:00:00.000Z"
}
info: Done!
```


- write message to update data:
  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "45415132-79fa-4d13-a9ac-71f50020dc10", "track": "Code", "name": "test", "description": "a b c", "challengeSettings": [{ "type": "2d88c598-70f0-4054-8a45-7da38d0ca424", "value": "ab" }], "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "name": "review", "isActive": true, "duration": 20 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "win", "value": 90 }] }], "reviewType": "code", "tags": ["tag1", "tag2"], "projectId": 12, "forumId": 45, "legacyId": 55, "status": "Active", "attachments": [{ "id": "8e17091c-466b-4c17-b6d9-dfa16300b234", "fileSize": 88, "fileName": "t.txt", "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c" }], "groups": ["g1", "g2"], "updated": "2019-02-17T00:00:00", "updatedBy": "user" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
info: Elasticsearch data:
info: {
    "id": "173803d3-019e-4033-b1cf-d7205c7f774c",
    "typeId": "45415132-79fa-4d13-a9ac-71f50020dc10",
    "track": "Code",
    "name": "test",
    "description": "a b c",
    "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa",
    "phases": [
        {
            "duration": 20,
            "name": "review",
            "id": "8e17090c-465b-4c17-b6d9-dfa16300b012",
            "isActive": true
        }
    ],
    "prizeSets": [
        {
            "prizes": [
                {
                    "type": "win",
                    "value": 90
                }
            ],
            "type": "prize"
        }
    ],
    "reviewType": "code",
    "tags": [
        "tag1",
        "tag2"
    ],
    "projectId": 12,
    "forumId": 45,
    "status": "Active",
    "created": "2018-01-01T16:00:00.000Z",
    "createdBy": "admin",
    "updatedBy": "user",
    "groups": [
        "g1",
        "g2"
    ],
    "updated": "2019-02-16T16:00:00.000Z",
    "attachments": [
        {
            "fileName": "t.txt",
            "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c",
            "fileSize": 88,
            "id": "8e17091c-466b-4c17-b6d9-dfa16300b234"
        }
    ],
    "challengeSettings": [
        {
            "type": "2d88c598-70f0-4054-8a45-7da38d0ca424",
            "value": "ab"
        }
    ],
    "legacyId": 55
}
info: Done!
```

- you may write invalid message like:
  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "123", "track": "Code", "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`

  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": ["Code"], "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`

  `[ [ [ } } }`
- then in the app console, you will see error messages

- to test the health check API, run `export PORT=5000`, start the processor, then browse `http://localhost:5000/health` in a browser,
  and you will see result `{"checksRun":1}`

