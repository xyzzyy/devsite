const deploymentUrl = process.env.NEXT_PUBLIC_SITE_URL

export const baseUrl = (deploymentUrl
  ? /^https?:\/\//.test(deploymentUrl) ? deploymentUrl : `https://${deploymentUrl}`
  : 'http://localhost:3000'
).replace(/\/+$/, '')

export const site = {
  name: 'Andrew MacKenzie',
  description: 'Notes on code, editors, and the tools I use.',
  profiles: [
    { platform: 'x the everything app', handle: '@xyzzydev', href: 'https://x.com/xyzzydev' },
    { platform: 'github', handle: '@xyzzyy', href: 'https://github.com/xyzzyy' },
  ],
  source: 'https://github.com/xyzzyy/devsite',
}
