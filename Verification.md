## Verification

- start kafka server, start elasticsearch, initialize Elasticsearch, start processor app
- Before testing update message, we need to create a record in ES. If you are using the ES from docker-es and using default configuration variables, use the below command to create a record in ES through curl.

```bash
curl -H "Content-Type: application/json" -X POST "http://localhost:9200/challenge/_doc/173803d3-019e-4033-b1cf-d7205c7f774c" -d "{\"id\":\"173803d3-019e-4033-b1cf-d7205c7f774c\",\"typeId\":\"8e17090c-465b-4c17-b6d9-dfa16300b0ff\",\"track\":\"Code\",\"name\":\"test\",\"description\":\"desc\",\"timelineTemplateId\":\"8e17090c-465b-4c17-b6d9-dfa16300b0aa\",\"phases\":[{\"id\":\"8e17090c-465b-4c17-b6d9-dfa16300b012\",\"phaseId\":\"8e17090c-465b-4c17-b6d9-dfa16300b2ba\",\"isOpen\":true,\"duration\":10000}],\"prizeSets\":[{\"type\":\"prize\",\"prizes\":[{\"type\":\"winning prize\",\"value\":500}]}],\"reviewType\":\"code review\",\"tags\":[\"code\"],\"projectId\":123,\"forumId\":456,\"status\":\"Active\",\"created\":\"2018-01-02T00:00:00\",\"createdBy\":\"admin\"}"
```

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
            "phaseId": "8e17090c-465b-4c17-b6d9-dfa16300b2ba",
            "isOpen": true,
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
    "created": "2018-01-02T00:00:00",
    "createdBy": "admin"
}
info: Done!
```
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
            "phaseId": "8e17090c-465b-4c17-b6d9-dfa16300b2ba",
            "isOpen": true,
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
    "created": "2018-01-02T00:00:00",
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
  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "45415132-79fa-4d13-a9ac-71f50020dc10", "track": "Code", "name": "test", "description": "a b c", "challengeSettings": [{ "type": "2d88c598-70f0-4054-8a45-7da38d0ca424", "value": "ab" }], "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0aa", "phases": [{ "id": "8e17090c-465b-4c17-b6d9-dfa16300b012", "phaseId": "8e17090c-465b-4c17-b6d9-dfa16300b013", "isOpen": true, "duration": 2000 }], "prizeSets": [{ "type": "prize", "prizes": [{ "type": "win", "value": 90 }] }], "reviewType": "code", "tags": ["tag1", "tag2"], "projectId": 12, "forumId": 45, "legacyId": 55, "status": "Active", "groups": ["g2"], "startDate": "2019-07-17T00:00:00", "updated": "2019-02-17T00:00:00", "updatedBy": "user" } }`
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
            "duration": 2000,
            "isOpen": true,
            "phaseId": "8e17090c-465b-4c17-b6d9-dfa16300b013",
            "id": "8e17090c-465b-4c17-b6d9-dfa16300b012"
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
    "created": "2018-01-02T00:00:00",
    "createdBy": "admin",
    "updatedBy": "user",
    "groups": [
        "g2"
    ],
    "updated": "2019-02-16T16:00:00.000Z",
    "endDate": "2019-07-16T16:33:20.000Z",
    "challengeSettings": [
        {
            "type": "2d88c598-70f0-4054-8a45-7da38d0ca424",
            "value": "ab"
        }
    ],
    "currentPhase": {
        "duration": 2000,
        "isOpen": true,
        "phaseId": "8e17090c-465b-4c17-b6d9-dfa16300b013",
        "id": "8e17090c-465b-4c17-b6d9-dfa16300b012"
    },
    "legacyId": 55,
    "startDate": "2019-07-16T16:00:00.000Z"
}
info: Done!
```

- you may write invalid message like:
  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "123", "track": "Code", "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`

  `{ "topic": "challenge.notification.update", "originator": "challenge-api", "timestamp": "2019-02-17T01:00:00", "mime-type": "application/json", "payload": { "id": "173803d3-019e-4033-b1cf-d7205c7f774c", "typeId": "8e17090c-465b-4c17-b6d9-dfa16300b0ff", "track": ["Code"], "name": "test3", "description": "desc3", "timelineTemplateId": "8e17090c-465b-4c17-b6d9-dfa16300b0dd", "groups": ["group2", "group3"], "updated": "2019-02-17T01:00:00", "updatedBy": "admin" } }`

  `[ [ [ } } }`
- then in the app console, you will see error messages

- start kafka-console-producer to write messages to `challenge.action.resource.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.action.resource.create`

- write message to create resource:
  `{ "topic": "challenge.action.resource.create", "originator": "resource-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "id": "45415132-79fa-4d13-a9ac-71f50020dc10", "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c", "memberId": "123456", "memberHandle": "test", "roleId": "45415132-79fa-4d13-a9ac-71f50020dc12" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
...
    "numOfRegistrants": 1
...
```

- start kafka-console-producer to write messages to `challenge.action.resource.delete` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.action.resource.delete`

- write message to delete resource:
  `{ "topic": "challenge.action.resource.delete", "originator": "resource-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "id": "45415132-79fa-4d13-a9ac-71f50020dc10", "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c", "memberId": "123456", "memberHandle": "test", "roleId": "45415132-79fa-4d13-a9ac-71f50020dc12" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
...
    "numOfRegistrants": 0
...
```

- start kafka-console-producer to write messages to `submission.notification.create` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.create`

- write message to create submission:
  `{ "topic": "submission.notification.create", "originator": "submission-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "resource": "submission", "id": "45415132-79fa-4d13-a9ac-71f50020dc18", "type": "ContestSubmission", "url": "http://test.com/123", "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c", "memberId": "123456", "created": "2019-02-03T01:01:00", "createdBy": "test" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
...
    "numOfSubmissions": 1
...
```

- start kafka-console-producer to write messages to `submission.notification.delete` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic submission.notification.delete`

- write message to delete submission:
  `{ "topic": "submission.notification.delete", "originator": "submission-api", "timestamp": "2019-02-17T00:00:00", "mime-type": "application/json", "payload": { "resource": "submission", "id": "45415132-79fa-4d13-a9ac-71f50020dc18", "type": "ContestSubmission", "url": "http://test.com/123", "challengeId": "173803d3-019e-4033-b1cf-d7205c7f774c", "memberId": "123456", "created": "2019-02-03T01:01:00", "createdBy": "test" } }`
- run command `npm run view-data 173803d3-019e-4033-b1cf-d7205c7f774c` to view the updated data, you will see the data are properly updated:

```bash
...
    "numOfSubmissions": 0
...
```

- to test the health check API, run `export PORT=5000`, start the processor, then browse `http://localhost:5000/health` in a browser,
  and you will see result `{"checksRun":1}`