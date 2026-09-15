import { defineConfig } from 'nitro'

export default defineConfig({
  serverDir: './server',
  runtimeConfig: {
    mongodb: {
      uri: '',
      dbName: '',
    },
    jwt: {
      secret: '',
      accessExpiresIn: '15m',
      refreshExpiresIn: '30d',
    },
    app: {
      timezone: 'Asia/Jakarta',
      maxLimit: 100,
    },
  },
})
