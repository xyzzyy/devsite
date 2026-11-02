import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {}

export default nextConfig

// Gives `next dev` access to the worker's bindings.
initOpenNextCloudflareForDev()
