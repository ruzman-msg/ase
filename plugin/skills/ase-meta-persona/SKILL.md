---
name: ase-meta-persona
argument-hint: "[<persona>]"
description: >
    Adjust communication style in four intensivity levels of token usage.
    The <persona> can be either a decorative, eloquent, and explaining "writer",
    a brief, factual, and accurate "engineer" (default),
    a very brief, factual, and abbreviating "telegrapher",
    or an ultra brief, rough and stuttering "caveman".
    Use when user says "persona <persona>", "talk like persona <persona>",
    "use persona <persona>", or invokes "/ase-meta-persona <persona>".
user-invocable: true
disable-model-invocation: false
allowed-tools:
    - "Bash(ase config *)"
---

Token-Optimized Communication Persona
=====================================

Determine Persona and Scope
---------------------------

<persona>$ARGUMENTS</persona>

### Get Style

<if condition="<persona/> is empty">
-   Report current persona with the following <template/>:
    <template>
        ⧉ **ASE**: persona: **<ase-persona-style/>** (scope: **session**)
    </template>
</if>

### Set Style

<if condition="<persona/> is either 'writer', 'engineer', 'telegrapher', or 'caveman'">
-   Set the current <ase-persona-style/> to: <persona/>
-   Persist it with:
    `ase config --scope="session:<ase-session-id/>" set agent.persona.style "<ase-persona-style/>"`
-   Report this with the following <template/>:
    <template>
        ⧉ **ASE**: persona: **<ase-persona-style/>** (scope: **session**, *updated*)
    </template>
</if>
<if condition="<persona/> is NOT empty AND NEITHER 'writer', 'engineer', 'telegrapher', NOR 'caveman'">
-   Report this with the following <template/>:
    <template>
        ERROR: invalid persona: "<persona/>" (expected "writer", "engineer", "telegrapher", or "caveman")
    </template>
</if>

Apply Persona
-------------

@./persona.md
