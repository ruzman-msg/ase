/*
**  Agentic Software Engineering (ASE)
**  Copyright (c) 2025-2026 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z }              from "zod"

/*  reusable functionality: in-memory key/value store living inside the
    "ase service" process; per-project (one service per project) and
    not persisted; intended for sharing information between skills
    across multiple Claude Code instances connected to the same service  */
export class KV {
    /*  the actual in-memory store  */
    private static store = new Map<string, unknown>()

    /*  maximum allowed key length, to keep memory bounded  */
    private static readonly KEY_MAX_LEN = 1024

    /*  validate the key to keep it non-empty and bounded in length  */
    static validateKey (key: string): void {
        if (typeof key !== "string" || key.length === 0)
            throw new Error("kv: key must be a non-empty string")
        if (key.length > KV.KEY_MAX_LEN)
            throw new Error(`kv: key must be no longer than ${KV.KEY_MAX_LEN} characters`)
    }

    /*  test whether a value is stored under the given key  */
    static has (key: string): boolean {
        KV.validateKey(key)
        return KV.store.has(key)
    }

    /*  get a value by key; returns undefined if no value is stored  */
    static get (key: string): unknown {
        KV.validateKey(key)
        return KV.store.get(key)
    }

    /*  set a value under the given key; overwrites any existing value  */
    static set (key: string, val: unknown): void {
        KV.validateKey(key)
        KV.store.set(key, val)
    }

    /*  delete a value by key; returns true if a value existed  */
    static delete (key: string): boolean {
        KV.validateKey(key)
        return KV.store.delete(key)
    }

    /*  clear all keys; returns the number of keys removed  */
    static clear (): number {
        const n = KV.store.size
        KV.store.clear()
        return n
    }
}

/*  MCP registration entry point for in-memory key/value tools  */
export class KVMCP {
    register (mcp: McpServer): void {
        /*  key/value get  */
        mcp.registerTool("kv_get", {
            title: "ASE key/value get",
            description:
                "Get a value from the in-memory key/value store by `key`. " +
                "Returns the value as JSON-encoded `text`; returns an empty string if no value is stored.",
            inputSchema: {
                key: z.string()
                    .describe("key identifier (non-empty string, up to 1024 characters)")
            }
        }, async (args) => {
            try {
                if (!KV.has(args.key))
                    return { content: [ { type: "text", text: "" } ] }
                const val  = KV.get(args.key)
                const text = JSON.stringify(val)
                return { content: [ { type: "text", text } ] }
            }
            catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                return { isError: true, content: [ { type: "text", text: `kv_get: ERROR: ${message}` } ] }
            }
        })

        /*  key/value set  */
        mcp.registerTool("kv_set", {
            title: "ASE key/value set",
            description:
                "Store a `val` under the given `key` in the in-memory key/value store. " +
                "Overwrites any existing value for the same `key`. " +
                "The value can be any JSON-compatible type (string, number, boolean, null, array, object).",
            inputSchema: {
                key: z.string()
                    .describe("key identifier (non-empty string, up to 1024 characters)"),
                val: z.any()
                    .describe("arbitrary JSON-compatible value to store under `key`")
            }
        }, async (args) => {
            try {
                KV.set(args.key, args.val)
                return { content: [ { type: "text", text: `kv_set: OK: stored key "${args.key}"` } ] }
            }
            catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                return { isError: true, content: [ { type: "text", text: `kv_set: ERROR: ${message}` } ] }
            }
        })

        /*  key/value clear  */
        mcp.registerTool("kv_clear", {
            title: "ASE key/value clear",
            description:
                "Remove all keys from the in-memory key/value store. " +
                "Returns a status `text` indicating how many keys were removed.",
            inputSchema: {}
        }, async () => {
            try {
                const n = KV.clear()
                return { content: [ { type: "text", text: `kv_clear: OK: removed ${n} key(s)` } ] }
            }
            catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                return { isError: true, content: [ { type: "text", text: `kv_clear: ERROR: ${message}` } ] }
            }
        })

        /*  key/value delete  */
        mcp.registerTool("kv_delete", {
            title: "ASE key/value delete",
            description:
                "Delete a value from the in-memory key/value store by `key`. " +
                "Returns a status `text` indicating whether a value existed and was removed.",
            inputSchema: {
                key: z.string()
                    .describe("key identifier (non-empty string, up to 1024 characters)")
            }
        }, async (args) => {
            try {
                const removed = KV.delete(args.key)
                const msg = removed ?
                    `kv_delete: OK: removed key "${args.key}"` :
                    `kv_delete: WARNING: no key "${args.key}" to remove`
                return { content: [ { type: "text", text: msg } ] }
            }
            catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                return { isError: true, content: [ { type: "text", text: `kv_delete: ERROR: ${message}` } ] }
            }
        })
    }
}
