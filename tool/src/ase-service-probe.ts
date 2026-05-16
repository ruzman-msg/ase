/*
**  Agentic Software Engineering (ASE)
**  Copyright (c) 2025-2026 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

import axios               from "axios"
import type { AxiosError } from "axios"
import * as v              from "valibot"

/*  shared service host  */
export const SERVICE_HOST = "127.0.0.1"

/*  schema for ".ase/service.yaml"  */
export const serviceSchema = v.nullish(v.strictObject({
    port: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1024), v.maxValue(65535)))
}))

/*  distinguish ECONNREFUSED from other Axios transport errors  */
export const isConnRefused = (err: unknown): boolean => {
    const e = err as AxiosError & { code?: string, cause?: { code?: string } }
    return e?.code === "ECONNREFUSED" || e?.cause?.code === "ECONNREFUSED"
}

/*  probe the service and verify ASE identity banner  */
export const probe = async (port: number, projectId: string): Promise<boolean | null> => {
    try {
        const r = await axios.request({
            method:         "OPTIONS",
            url:            `http://${SERVICE_HOST}:${port}/`,
            timeout:        2000,
            validateStatus: () => true
        })
        if (r.status < 200 || r.status >= 300)
            return false
        const d = r.data as { ase?: boolean, projectId?: string } | null
        return d?.ase === true && d?.projectId === projectId
    }
    catch (err: unknown) {
        if (isConnRefused(err))
            return null
        throw err
    }
}

