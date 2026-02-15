# ref: chutes & openrouter — alternative inference providers

> should we build rhachet-brains adapters for chutes and/or openrouter?

---

## 1. chutes (chutes.ai)

### 1.1 what is it?

a **decentralized serverless ai compute platform** built on the bittensor blockchain network (subnet 64). built by rayon labs / chutes global corp — a decentralized collective with no traditional ceo.

| attribute | value |
|-----------|-------|
| type | decentralized compute (bittensor subnet 64) |
| founded | ~2024 (rayon labs) |
| funded by | tao token economics (no vc) |
| scale | ~3T tokens/month, largest bittensor subnet by market cap |
| philosophy | open-source only, decentralized, crypto-incentivized |

### 1.2 how it works

gpu miners join the bittensor network and register as compute providers. when you call the chutes api, your request is routed to a miner that hosts the model. miners are incentivized by tao token emissions, not cash payments — which is how they subsidize the low rates.

### 1.3 api access

| attribute | value |
|-----------|-------|
| base url | `https://llm.chutes.ai/v1` (hosted inference) |
| auth | bearer token, key prefix `cpk_` |
| env var | `CHUTES_API_KEY` |
| openai compatible | yes — drop-in with openai sdk |

```typescript
import OpenAI from 'openai';
const client = new OpenAI({
  baseURL: 'https://llm.chutes.ai/v1',
  apiKey: process.env.CHUTES_API_KEY,
});
```

### 1.4 rates (vs together ai)

| model | chutes (in/out per 1M) | together ai (in/out per 1M) | delta |
|-------|------------------------|------------------------------|-------|
| qwen3-coder-next | $0.07 / $0.30 | $0.50 / $1.20 | 7x / 4x cheaper |
| deepseek-v3 | available | $0.60 / $1.70 | varies |

**how they achieve $0.07/$0.30:**
1. miners are paid via tao token emissions, not cash — crypto subsidizes compute
2. miners may run on commodity or underutilized hardware
3. qwen3-coder-next activates only 3B of 80B params (moe), low compute per token
4. no traditional enterprise infrastructure overhead

### 1.5 reliability

- **claims 99.9% uptime** — but reality is more nuanced
- decentralized miners can disconnect at any time, which yields "no instances available" errors
- models can lose capacity when popular traffic spikes overwhelm miner availability
- suitable for cost-sensitive workloads that can tolerate retries
- **not enterprise-grade** for production-critical paths

### 1.6 fine-tune

- supports custom model deployment via docker containers
- supports on-platform custom train workflows with pytorch/transformers
- but this is **not managed fine-tune** like together ai — you deploy and manage your own instances

### 1.7 risks

1. **reliability** — miner-dependent, unpredictable instance failures
2. **crypto dependency** — sustainability depends on tao token value; if tao drops, miners leave
3. **data privacy** — requests routed to anonymous miners; different trust model than cloud providers
4. **no vc, no traditional accountability** — decentralized collective governance
5. **rate stability** — crypto-subsidized rates may not be sustainable long-term

---

## 2. openrouter (openrouter.ai)

### 2.1 what is it?

an **api aggregator and route layer** that provides a single openai-compatible endpoint to access 500+ models from 60+ upstream providers. one integration, all models.

| attribute | value |
|-----------|-------|
| type | route layer / inference gateway |
| founded | feb 2023 |
| founders | alex atallah (ex-opensea cto), louis vichy |
| funded | $40.5M total ($12.5M seed a16z, $28M series a menlo ventures + sequoia) |
| valuation | ~$500M (post series a) |
| scale | 250k+ apps, 4.2M+ users, $100M+ annualized inference spend |
| philosophy | universal api gateway, one integration for all models |

### 2.2 how it works

openrouter does **not run gpus**. it connects to 60+ upstream providers (together ai, chutes, fireworks, anthropic, openai, google, etc.) and routes your requests through a single normalized endpoint.

route logic:
1. exclude providers with recent outages (last 30s)
2. among stable providers, weight selection by inverse-square of cost (cheapest gets most traffic)
3. fallback to rest of providers on failure

**chutes is itself a provider on openrouter** — so chutes' low rates are available through openrouter too.

### 2.3 api access

| attribute | value |
|-----------|-------|
| base url | `https://openrouter.ai/api/v1` |
| auth | bearer token |
| env var | `OPENROUTER_API_KEY` |
| openai compatible | yes — drop-in with openai sdk |
| model format | `provider/model-name` (e.g., `qwen/qwen3-coder-next`) |

```typescript
import OpenAI from 'openai';
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

### 2.4 rate model

- **pass-through** — you pay the same per-token rate as the upstream provider
- **revenue**: 5.5% fee on credit purchases ($0.80 minimum)
- **byok**: 5% fee on upstream usage when you use your own provider keys
- no per-token markup

### 2.5 provider selection

customizable per-request via `provider` object:
- `order`: prioritize specific providers in sequence
- `only`: restrict to specific providers
- `ignore`: skip certain providers
- `sort`: route by `"price"`, `"throughput"`, or `"latency"`
- convenience shortcuts: append `:floor` (cheapest) or `:nitro` (fastest) to model slug

### 2.6 fine-tune

**no.** openrouter is a route layer, not a compute provider. no fine-tune service. you can access fine-tuned models from upstream providers that expose them, but openrouter itself does not run or train models.

### 2.7 risks

1. **single point of failure** — if openrouter's infrastructure goes down, all routes go down (40+ outages tracked in 12 months)
2. **vendor dependency** — one more intermediary between you and the model
3. **provider quality variance** — same model from different providers may yield different quality (quantized vs full)
4. **no compute ownership** — in a capacity crunch, you have no priority
5. **cost opacity** — while per-token rates match providers, the credit purchase fee adds 5.5%

---

## 3. should we build rhachet-brains adapters?

### 3.1 the question

since all three providers (together ai, chutes, openrouter) use openai-compatible apis, the `genBrainAtom` factory only differs in:
1. `baseURL`
2. `apiKey` env var name
3. model catalog and `BrainSpec` (cost per token, context, swe-bench grades)

so: separate adapters per provider? or one multi-provider adapter?

### 3.2 recommendation: separate adapters

**build separate packages**: `rhachet-brains-togetherai`, `rhachet-brains-chutes`, `rhachet-brains-openrouter`

**rationale:**

| reason | detail |
|--------|--------|
| **provider identity matters for BrainSpec** | the same model at different providers has different costs, latency, and reliability. qwen3-coder-next is $0.07/$0.30 on chutes vs $0.50/$1.20 on together ai. these are fundamentally different atoms with different cost profiles. |
| **matches the established pattern** | `rhachet-brains-xai` sets the template. each provider gets its own adapter. consumers understand the convention. |
| **single responsibility** | a package named `rhachet-brains-togetherai` should not route to chutes. the name is the contract. |
| **different reliability profiles** | together ai = enterprise sla. chutes = miner-dependent. openrouter = multi-provider failover. consumers should choose consciously. |
| **different auth** | each provider has its own env var and key format. separate packages keep auth clean. |
| **fine-tune is provider-specific** | only together ai offers managed fine-tune. this is a material differentiator that belongs in the provider-specific adapter. |

### 3.3 build priority

| priority | adapter | why |
|----------|---------|-----|
| 1 (now) | `rhachet-brains-togetherai` | well-funded, enterprise reliability, fine-tune access, primary open-source target |
| 2 (later) | `rhachet-brains-chutes` | cheapest rates for cost-sensitive workloads; build when demand exists |
| 3 (later) | `rhachet-brains-openrouter` | meta-adapter with route logic; architecturally distinct (BrainSpec represents a range, not fixed values); build when multi-provider fallback is needed |

### 3.4 openrouter is architecturally different

an openrouter adapter would be distinct because:
- it routes to multiple upstream providers per model
- the `BrainSpec` cost could vary per request (depends on which provider handles it)
- it requires route config (provider preferences, sort order) that other adapters don't
- it's a meta-adapter, not a direct-provider adapter

this makes it a separate concern worth its own design pass, not a simple clone of the together ai adapter.

---

## 4. summary

| dimension | together ai | chutes | openrouter |
|-----------|-------------|--------|------------|
| type | direct compute | decentralized compute | route layer |
| reliability | enterprise sla | miner-dependent | multi-provider failover |
| qwen3-coder-next cost | $0.50 / $1.20 | $0.07 / $0.30 | pass-through (varies) |
| fine-tune | yes (managed) | yes (self-managed) | no |
| adapter priority | build first | build second | build third |
| slug prefix | `together/` | `chutes/` | `openrouter/` |
| env var | `TOGETHER_API_KEY` | `CHUTES_API_KEY` | `OPENROUTER_API_KEY` |
| base url | `api.together.xyz/v1` | `llm.chutes.ai/v1` | `openrouter.ai/api/v1` |

---

## sources

1. [chutes about page](https://chutes.ai/about)
2. [chutes docs - authentication](https://chutes.ai/docs/getting-started/authentication)
3. [chutes rates](https://chutes.ai/pricing)
4. [chutes on bittensor subnet 64](https://www.bittensor.ai/subnets/64)
5. [openrouter $40M raise — the block](https://www.theblock.co/post/360093/opensea-co-founder-alex-atallah-raises-40-million-for-ai-startup-openrouter)
6. [openrouter docs - provider route](https://openrouter.ai/docs/guides/routing/provider-selection)
7. [openrouter docs - quickstart](https://openrouter.ai/docs/quickstart)
8. [openrouter rates](https://openrouter.ai/pricing)
9. [qwen3-coder-next provider comparison — pricepertoken.com](https://pricepertoken.com/pricing-page/model/qwen-qwen3-coder-next)
10. [artificial analysis — qwen3-coder-next providers](https://artificialanalysis.ai/models/qwen3-coder-next/providers)
