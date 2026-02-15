# ref: tee (trusted execution environments) deep-dive

> what tee actually protects, what it doesn't, and real-world attacks

---

## 1. what is a tee?

a **trusted execution environment** is a hardware-isolated area where code and data are protected from:
- the host operating system
- the hypervisor
- other vms on the same machine
- (in theory) physical access

| component | role |
|-----------|------|
| **cpu tee** | intel tdx, intel sgx, amd sev-snp |
| **gpu tee** | nvidia h100 confidential compute |
| **memory encryption** | aes-xts per-domain keys |
| **attestation** | cryptographic proof that code runs in tee |

source: [intel tdx overview](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html)

---

## 2. intel tdx (trust domain extensions)

### 2.1 how it works

```
┌─────────────────────────────────────────────────────────┐
│                     host system                         │
├─────────────────────────────────────────────────────────┤
│  hypervisor (UNTRUSTED - cannot see TD memory)          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ trust domain 1  │  │ trust domain 2  │  ...          │
│  │ (encrypted mem) │  │ (encrypted mem) │               │
│  └─────────────────┘  └─────────────────┘               │
├─────────────────────────────────────────────────────────┤
│  TDX module (cpu secure arbitration mode - SEAM)        │
│  (TRUSTED - manages TD lifecycle)                       │
├─────────────────────────────────────────────────────────┤
│  cpu hardware root of trust                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 key mechanisms

| mechanism | what it does |
|-----------|--------------|
| **seam mode** | new cpu mode where tdx module runs as trusted peer to hypervisor |
| **tme-mk** | total memory encryption with multi-key — each td gets unique aes key |
| **secure ept** | extended page tables that prevent hypervisor from map of td memory |
| **rtmr** | runtime measurement registers — record boot measurements for attestation |

### 2.3 what tdx protects

| protected | not protected |
|-----------|---------------|
| td memory (encrypted with per-td key) | code bugs inside the td |
| cpu registers | side-channel leakage (partial) |
| control flow from hypervisor snoops | physical memory bus interposer |
| attestation of td identity | malicious code in the td itself |

source: [intel tdx demystified (acm)](https://dl.acm.org/doi/full/10.1145/3652597)

---

## 3. nvidia h100 confidential compute

### 3.1 the problem: cpu-gpu data transfer

gpus don't have their own tee — they rely on cpu tee + encrypted transfer.

```
┌─────────────┐                      ┌─────────────┐
│  cpu tee    │  ←── PCIe bus ───→   │  gpu        │
│  (tdx/sev)  │     (UNTRUSTED)      │  (h100)     │
└─────────────┘                      └─────────────┘
       ↓                                    ↓
  encrypted                           on-die HBM3
  bounce buffer                       (unencrypted
  in shared mem                        but isolated)
```

### 3.2 how h100 confidential compute works

| layer | protection |
|-------|------------|
| **gpu hbm3 memory** | physically on-package, no encryption needed (isolated) |
| **pcie transfer** | aes-gcm-256 encryption via dma engine |
| **bounce buffer** | encrypted area in shared system memory |
| **attestation** | device identity certs signed by nvidia ca |

### 3.3 the bottleneck

| metric | value |
|--------|-------|
| cpu encryption throughput | ~4 gb/sec |
| h100 hbm3 bandwidth | ~3.35 tb/sec |
| ratio | **838x slower for encrypted transfers** |

> **implication**: workloads with high cpu↔gpu data transfer pay significant performance penalty.

source: [nvidia h100 confidential compute blog](https://developer.nvidia.com/blog/confidential-computing-on-h100-gpus-for-secure-and-trustworthy-ai/)

---

## 4. attestation: "don't trust, verify"

### 4.1 what attestation proves

| claim | how verified |
|-------|--------------|
| "code runs in tee" | measurement of boot sequence matches expected |
| "td has not been tampered" | runtime measurements in rtmr |
| "gpu is genuine h100" | device cert signed by nvidia ca |
| "software is as expected" | hash of loaded code matches known-good |

### 4.2 attestation flow

```
1. td boots → measurements recorded in rtmr
2. user requests attestation quote
3. cpu signs quote with hardware-fused key
4. user verifies quote against intel/amd public keys
5. user checks measurements match expected values
```

### 4.3 the catch

> **attestation proves the tee is real. it does NOT prove the code inside is safe.**

if malicious code is loaded into a valid tee, attestation still passes.

---

## 5. known attacks (as of 2025)

### 5.1 physical interposer attacks

| attack | year | cost | what it breaks |
|--------|------|------|----------------|
| **tee.fail** | 2025 | <$1,000 | intel tdx, amd sev-snp, nvidia gpu cc |
| **wiretap** | 2025 | ~$1,000 | intel sgx attestation keys |
| **battering ram** | 2025 | ~$50 | intel sgx, amd sev-snp |

### 5.2 how tee.fail works

from [hacker news: tee.fail](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html):

1. attacker places interposer device on ddr5 memory bus
2. intercepts all memory traffic between cpu and dram
3. exploits **deterministic encryption** — aes-xts produces identical ciphertext for repeated plaintext
4. correlates patterns to extract cryptographic keys
5. **can forge attestation quotes** — pretend code runs in tee when it doesn't

> **"attackers can pretend that your data and code is run inside a cvm when in reality it is not"**

### 5.3 what tee.fail extracted

| target | extracted |
|--------|-----------|
| intel tdx | attestation keys |
| amd sev-snp | attestation keys |
| nvidia gpu cc | full compromise — "run ai workloads without any tee protections" |
| ethereum buildernet | confidential transaction data + keys |

### 5.4 vendor response

from [bleepingcomputer](https://www.bleepingcomputer.com/news/security/teefail-attack-breaks-confidential-computing-on-intel-amd-nvidia-cpus/):

> **"intel, amd, and arm responded that physical attacks are currently considered out of scope of their product's threat model."**

translation: if attacker has physical access to the server, tee is not designed to protect you.

source: [sgx.fail](https://sgx.fail/)

---

## 6. what tee protects vs what it doesn't

### 6.1 threat model

| attacker | protected? |
|----------|------------|
| malicious hypervisor (software) | ✓ yes |
| other vms on same host (software) | ✓ yes |
| cloud provider admin (software) | ✓ yes |
| physical access to server | ✗ **no** (interposer attacks) |
| malicious code inside tee | ✗ **no** (tee runs whatever you load) |
| side-channel (time, power) | ⚠️ partial (mitigations exist) |

### 6.2 the trust boundary

```
┌─────────────────────────────────────────────────────────┐
│                    TRUSTED                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  cpu hardware root of trust                     │   │
│  │  tee module (tdx/sgx/sev)                       │   │
│  │  your code (if not malicious)                   │   │
│  │  your data (encrypted in memory)                │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    UNTRUSTED                            │
│  hypervisor, host os, cloud provider, other vms        │
├─────────────────────────────────────────────────────────┤
│                    OUTSIDE THREAT MODEL                 │
│  physical access, supply chain, side-channels          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. chutes' tee implementation

### 7.1 what chutes uses

from [chutes tee blog](https://chutes.ai/news/confidential-compute-for-ai-inference-how-chutes-delivers-verifiable-privacy-with-trusted-execution-environments):

| component | implementation |
|-----------|----------------|
| cpu tee | intel tdx via sek8s (security-hardened kubernetes) |
| gpu protection | nvidia protected pcie |
| memory encryption | tdx per-td keys |
| disk encryption | luks (key released after attestation) |
| egress control | net-nanny (blocks outbound traffic) |

### 7.2 chutes' layered defense

```
layer 1: tdx memory encryption
layer 2: nvidia protected pcie (cpu↔gpu)
layer 3: cosign verified container images
layer 4: net-nanny egress block
layer 5: watchtower integrity challenges
layer 6: per-token model verification hashes
```

### 7.3 the critical caveat (again)

from chutes' own documentation:

> **"a tee protects you from the host, but it doesn't inherently protect you from malicious code inside the tee (e.g., a chute that logs prompts)."**

chutes mitigates this with:
- verified builds (cosign signatures)
- net-nanny (blocks data exfiltration)
- continuous monitor

but if malicious code gets signed and deployed, tee won't save you.

---

## 8. performance overhead

### 8.1 intel tdx overhead

| workload type | overhead |
|---------------|----------|
| compute-bound | 2-5% |
| memory-bound | 5-15% |
| i/o-bound | varies |

### 8.2 nvidia h100 cc overhead

| operation | overhead |
|-----------|----------|
| gpu compute | ~0% (hbm3 is already isolated) |
| cpu↔gpu transfer | **significant** (~4gb/sec encrypted vs 3.35tb/sec native) |
| high compute-to-data ratio | minimal impact |
| high data transfer | major bottleneck |

source: [nvidia h100 cc performance benchmark](https://arxiv.org/html/2409.03992v2)

---

## 9. bottom line: when to trust tee

### 9.1 tee is good for

- protection from **software attacks** by cloud provider / other tenants
- **attestation** that code runs in expected environment
- **compliance** requirements (hipaa, pci) that mandate isolation

### 9.2 tee is NOT good for

- protection from **physical attacks** (interposer, supply chain)
- protection from **malicious code inside the tee**
- protection from **sophisticated side-channels** (time, power)
- **absolute privacy guarantees** (attacks exist, threat model has gaps)

### 9.3 the honest assessment

| claim | reality |
|-------|---------|
| "hardware-protected from everyone" | from software attacks, not physical |
| "even the cloud provider can't see your data" | true for software access, not physical |
| "cryptographically verified" | attestation works, but can be forged with physical access |
| "your prompts are private" | from hypervisor, not from malicious chute code |

---

## 10. sources

1. [intel tdx overview](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html)
2. [intel tdx demystified (acm)](https://dl.acm.org/doi/full/10.1145/3652597)
3. [nvidia h100 confidential compute](https://developer.nvidia.com/blog/confidential-computing-on-h100-gpus-for-secure-and-trustworthy-ai/)
4. [nvidia gpu confidential compute demystified](https://arxiv.org/html/2507.02770v1)
5. [tee.fail attack (hacker news)](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)
6. [tee.fail attack (bleepingcomputer)](https://www.bleepingcomputer.com/news/security/teefail-attack-breaks-confidential-computing-on-intel-amd-nvidia-cpus/)
7. [battering ram attack](https://thehackernews.com/2025/10/50-battering-ram-attack-breaks-intel.html)
8. [wiretap attack](https://thehackernews.com/2025/10/new-wiretap-attack-extracts-intel-sgx.html)
9. [sgx.fail](https://sgx.fail/)
10. [chutes tee implementation](https://chutes.ai/news/confidential-compute-for-ai-inference-how-chutes-delivers-verifiable-privacy-with-trusted-execution-environments)
11. [tee vulnerabilities survey (sciencedirect)](https://www.sciencedirect.com/science/article/pii/S0167404823000901)
12. [h100 cc performance benchmark](https://arxiv.org/html/2409.03992v2)
