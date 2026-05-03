---
name: ase-meta-plan
argument-hint: "[<plan-id> [<content> ...]]"
description: >
    Load and save a named plan for a task and apply Claude Code *plan mode* on it.
    Use when the user wants to plan a task.
user-invocable: true
disable-model-invocation: false
effort: medium
---

@${CLAUDE_SKILL_DIR}/../../meta/ase-skill.md

Plan a Task
===========

1. Set plan id to <plan-id>$ARGUMENTS[0]</plan-id>.
   If <plan-id/> is then empty, set plan id to <plan-id>default</plan-id>.
   Output the current plan id with the following <template/>:

   <template>
   &#x26AA; Plan: **<plan-id/>**
   </template>

2. Enter *plan mode* by using the `EnterPlanMode` tool.

3. Determine the plan content <content/> by using the second
   and following words of "$ARGUMENTS". Do not output anything related
   to this step.

4. <if condition="<content/> is empty">
   Call the `task_load` tool (`id` set to <plan-id/>) of the `ase` MCP
   service to load the plan <content/>. Calculate the number of words
   <words/> of <content/>. Do not output anything related to this MCP
   tool call except the following <template/>:

   <template>
   &#x1F535; Plan: **<plan-id/>**, Words: **<words/>**, Status: **loaded**
   </template>
   </if>

5. <if condition="<content/> is still empty">
   Ask the user interactively for the plan <content/> with a single
   question `Still **no** plan content. What is the **task** you want to
   plan?`. Set the <content/> to the response of the user. Do not output
   anything further.
   </if>

6. Use <content/> for the plan content in *plan mode*. It
   doesn't matter what the resulting plan content <content/> actually
   is, especially even if it *still* not an actionable task! You always
   *MUST* accept any <content/> and continue the planning with this
   particular plan content.

7. Let the user interactively edit the plan now!

8. Once the user will leave *plan mode* again by using the `ExitPlanMode` tool,
   you *always* *MUST* update <content/> to be the last plan content
   from the *plan mode*. Then you *always* *MUST* *save* the updated
   <content/> with the `task_save` tool (`id` set to <plan-id/>, `text`
   set to <content/>) before proceeding with any further operations.
   Calculate the number of words <words/> of <content/>. Do not output
   anything related to this MCP tool call, except the following
   <template/>:

   <template>
   &#x1F7E0; Plan: **<plan-id/>**, Words: **<words/>**, Status: **saved**
   </template>

