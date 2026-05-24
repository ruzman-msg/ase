---
name: ase-docs-proofread
argument-hint: "<docs-reference>"
description: >
    Analyze the documents for spelling, punctuation, or grammar errors.
    Use when the user wants to "proofread" or "spellcheck" a document.
user-invocable: true
disable-model-invocation: false
effort: medium
---

@${CLAUDE_SKILL_DIR}/../../meta/ase-control.md
@${CLAUDE_SKILL_DIR}/../../meta/ase-skill.md
@${CLAUDE_SKILL_DIR}/../../meta/ase-dialog.md
@${CLAUDE_SKILL_DIR}/../../meta/ase-getopt.md

Proofread Documentation
=======================

<skill name="ase-docs-proofread">
Analyze the documents for spelling, punctuation, or grammar errors.
</skill>

<expand name="getopt"
    arg1="ase-docs-proofread"
    arg2="--auto|-a">
    $ARGUMENTS
</expand>

<role>
Your role is an experienced, *expert-level proofreader*, specialized in
checking and correcting the *spelling*, *punctuation* and *grammar* of
documents.
</role>

<objective>
*Analyze* the documents of <getopt-arguments/> for problems in their *spelling*,
*punctuation* or *grammar* and immediately correct all found problems.
</objective>

<flow>

1.  <step id="STEP 1: Investigation & Checking">
    Silently investigate the document base by using the `Read` tool to
    read all referenced document files. For all contained texts in those
    files, silently check the following text problem types *ONLY* and
    *WITHOUT* any output to the user:

    - **Spelling**
    - **Punctuation**
    - **Grammar**

    You *MUST* collect *all* found problems into an internal list only,
    and then set <problems/> to the value of this list.

    You *MUST* *NOT* propose document changes in this step 1.
    You *MUST* *NOT* output anything at all in this step 1.
    </step>

2.  <step id="STEP 2: Proofreading Summary">
    Use the following <template/> to give a summary of the detected
    problems in <problems/>:

    <template>
    &#x26AA; **PROOFREADING SUMMARY**:

    | *Proofread Type* | *Proofread Result*      |
    | ---------------- | ----------------------- |
    | **SPELLING**:    | **<n/>** problems found |
    | **PUNCTUATION**: | **<m/>** problems found |
    | **GRAMMAR**:     | **<k/>** problems found |
    </template>

    Hints:

    -   <n/> is the number of spelling problems in <problems/>
    -   <m/> is the number of punctuation problems in <problems/>
    -   <k/> is the number of grammar problems in <problems/>
    </step>

3.  <step id="STEP 3: Results & Correction">

    Before iterating, you *MUST* activate the auto-approve
    gate for the `Edit` tool by setting the session-scoped
    `agent.skill` configuration value to this skill's name via the call
    `config_set(key: "agent.skill", val: "ase-docs-proofread", scope:
    "session:<ase-session-id/>")` MCP tool of the `ase` service.

    <for items="<problems/>">

    For the current <item/> from the collected list <problems/>, do the
    following:

    1.  Report the problem with the following <template/>:

        <template>
        &#x1F7E0; **<type/> PROBLEM**: `<file/>`:<line/>:

        <description/>
        </template>

        Hints:

        -   The <type/> is `SPELLING`, `PUNCTUATION` or `GRAMMAR`
            of <item/>.

        -   The <file/> is the name of the document artifact of <item/>.
            The <line/> is the line number of the document artifact of <item/>.

        -   The <description/> is an ultra brief and concise description
            of the problem <item/> with a hint of what is wrong and why
            it is wrong. In <description/>, mark up all verbatim words
            <words/> related to the checked text (or the proposed
            corrected text) as quoted strings containing monospaced text
            with the Markdown <template>"`<words/>`"</template>.

    2.  <if condition="<getopt-option-auto/> is not 'true'">
        Render the proposed correction as a *unified diff* with *one*
        line of context in a fenced block based on the following <template/>:

        <template>

        &#x1F535; **<type/> CORRECTION**:

        ```diff
        --- <file/> (original)
        +++ <file/> (corrected)
        @@ -<line/>,<n/> +<line/>,<m/> @@
         <context-before/>
        -<old-text/>
        +<new-text/>
         <context-after/>
        ```

        </template>

        Hints:

        -   The <line/> is the 1-based line number in <file/>.

        -   The <n/> is the number of lines in <old-text/>.

        -   The <m/> is the number of lines in <new-text/>.

        -   The <context-before/> is exactly *two* lines of *unchanged*
            context directly *before* <old-text/>, i.e., the lines
            (<line/> - 2) and (<line/> - 1). Reduce to just one line
            if <old-text/> is the second line of the document. Omit
            <context-before/> if <old-text/> is the first line in the
            document.

        -   The <old-text/> is the *original* text line(s) which should
            be changed. Mark up words as bold text (`**[...]**`) in
            <old-text/> which actually will change against <new-text/>.

        -   The <new-text/> is the *corrected* text line(s).
            Mark up words as bold text (`**[...]**`) in
            <new-text/> which actually changed against <old-text/>.

        -   The <context-after/> is exactly *two* lines of *unchanged*
            context directly *after* <old-text/>, i.e., the lines
            (<line/> + <n/> + 1) and (<line/> + <n/> + 2). Reduce to
            just one line if <old-text/> is the second last line of the
            document. Omit <context-after/> if <old-text/> is the last
            line in the document.
        </if>

    3.  <if condition="<getopt-option-auto/> is not 'true'">
        Ask the user how to proceed via an interactive user dialog:

        <expand name="user-dialog">
            CORRECTION: How would you like to proceed with this proposed correction?
            ACCEPT: Apply the proposed correction.
            REFINE: Discard this proposed correction and generate a new one.
            REJECT: Skip this proposed correction.
        </expand>
        </if>

        <if condition="<getopt-option-auto/> is 'true'">
        Set <result>ACCEPT</result>.
        </if>

    4.  Check the tool <result/> and dispatch accordingly:

        -   <if condition="<result/> is 'ACCEPT'">
            Invoke the `Edit` tool to apply the change exactly as shown
            in the diff. The operation will be auto-approved because of
            the active proofread marker, so *no* interactive permission
            prompt will appear. Then continue with the next <item/>.
            </if>

        -   <if condition="
                <result/> starts with 'REFINE' or
                <result/> starts with 'OTHER'
            ">
            Generate a *new* proposal for the *same* <item/>
            (incorporating the user's free-text hint from <result/> if
            provided via the "OTHER" prefix) and loop back to substep 2
            of this iteration. There is *no* cap on refinement rounds —
            keep refining until the user picks `ACCEPT` or `REJECT`.
            </if>

        -   <if condition="
                <result/> is 'REJECT' or
                <result/> is 'CANCEL' or
                <result/> starts with 'ERROR'
            ">
            Skip this <item/> without any `Edit` call and continue
            with the next <item/>.
            </if>

    </for>

    After the iteration has finished, you *MUST* clear the auto-approve
    gate via the call `config_delete(key: "agent.skill", scope:
    "session:<ase-session-id/>")` to the MCP tool of the `ase` service.

    You *MUST* *NOT* output any further additional explanations or
    summaries at the end of this skill processing.
    </step>

</flow>

