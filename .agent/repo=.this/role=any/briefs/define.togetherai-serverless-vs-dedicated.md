# together.ai serverless vs dedicated

## .what

together.ai offers two deployment modes for model inference:

| mode | cost model | availability | use case |
|------|------------|--------------|----------|
| serverless | pay-per-token | instant, shared infra | variable workloads, development |
| dedicated | hourly/reserved | private endpoint | high-volume, low-latency production |

## .why this matters

this package (`rhachet-brains-togetherai`) only supports **serverless** models because:

- serverless = instant access via standard chat completions api
- dedicated = requires a provisioned private endpoint first
- dedicated endpoints have minimum commitments and higher base cost
- serverless models work immediately with just an api key

## .how to check if a model is serverless

### method 1: official docs (authoritative)

```
https://docs.together.ai/docs/serverless-models
```

this page lists all model IDs available via serverless api.

### method 2: model page

```
https://www.together.ai/models/{model-name}
```

if the page shows per-token rates, it's serverless.
if it only shows "deploy endpoint", it requires dedicated.

## .refs

- serverless models: https://docs.together.ai/docs/serverless-models
- dedicated models: https://docs.together.ai/docs/dedicated-models
- model catalog: https://www.together.ai/models
