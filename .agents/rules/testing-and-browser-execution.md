# Testing & Restricted Browser Execution Rules

Whenever implementing, refactoring, verifying, or testing code across this platform, the AI agent MUST strictly and unconditionally adhere to the following testing protocol and browser execution restrictions:

---

## 1. Absolute Prohibition of Autonomous Browser Testing (Zero Exceptions)

The AI agent is **STRICTLY FORBIDDEN** from autonomously running live browser tests, calling `browser_subagent`, or executing headless/visual browser automation tools on its own initiative:

- **Prohibited Without Explicit User Request:**
  - Invoking `browser_subagent` to "verify UI", "check if the game loads", or "inspect elements".
  - Running browser-based end-to-end suites (e.g. Cypress, Playwright, Puppeteer) unless explicitly commanded in the user's prompt.
  - Spinning up background dev servers solely to trigger automated browser exploration without user instruction.
- **Why This Rule Exists:**
  - Browser subagent invocations are resource-heavy, slow, intrusive, and frequently fail on headless or GPU-dependent 3D canvas contexts (WebGL/Three.js).
  - WebGL context creation and canvas-based game physics cannot be reliably validated via generic DOM crawling.

---

## 2. Permitted Conditions for Browser Testing

The AI agent may ONLY invoke `browser_subagent` or browser automation when:
1. **Explicit User Mandate:** The user explicitly requests browser verification in the chat prompt (e.g., *"test in browser"*, *"buka browser untuk verifikasi"*, *"check with browser subagent"*).
2. **Pre-requisite Gate Satisfied:**
   - Static type checking (`npm run typecheck`) passes with 0 errors.
   - Any relevant unit or state tests are passing.
   - The user has confirmed they want live visual verification.

If the agent believes browser verification would be beneficial, it **MUST ASK** the user first and explain why headless verification is insufficient, rather than executing it directly.

---

## 3. Mandatory Testing & Verification Hierarchy (Fast Feedback First)

All verification must follow a strict bottom-up pyramid, prioritizing speed, determinism, and zero resource bloat:

```text
       ▲
      / \     Tier 4: Explicit Browser / E2E Test (User Request Only)
     /   \    ────────────────────────────────────────────────────────
    /     \   Tier 3: In-Memory Component & Store Harnesses
   /       \  ────────────────────────────────────────────────────────
  /         \ Tier 2: Pure Unit Tests (Math, Physics Formulas, Serialization)
 /           \────────────────────────────────────────────────────────
/             \ Tier 1: Static Typecheck & Build Analysis (npm run typecheck)
───────────────
```

### Tier 1: Static Typecheck (Mandatory First Step)
- Execute `npm run typecheck` (`tsc --noEmit`).
- Must pass with 0 errors and zero `any` leaks.

### Tier 2: Pure Domain & Utility Unit Tests
- Test mathematical calculations (angles, force impulses, trajectory prediction).
- Test state transitions in pure reducer or Zustand store actions.
- Test message serializers/deserializers and Zod schema validations for network packets.
- These tests must run in-memory, deterministically, in milliseconds, with zero WebGL/DOM dependencies.

### Tier 3: Network & Store Integration Mocks
- Test peer-to-peer event handling using mock data channels.
- Verify turn transitions, timeout handling, and score updates in headless environments.

### Tier 4: Browser Verification (Gated)
- Executed exclusively upon explicit user direction.

---

## 4. Diagnostic & Debugging Protocol (Terminal First)

When a bug, runtime exception, or unexpected behavior occurs:
1. **Rely on Terminal & Logs:** Inspect build output, TypeScript compiler messages, stack traces, and test runner logs.
2. **Zero "Guess-and-Look" Browsing:** Do not launch a browser hoping to spot errors visually. Instrument code with deterministic assertions, diagnostic logs, or isolated reproduction scripts.
3. **Reproduce via Isolated Unit Tests:** If a physics or multiplayer bug is reported, create a minimal headless test case verifying the input/output state transition before touching application code.
