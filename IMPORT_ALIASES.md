# Import Aliases untuk Nitro v3

## Konfigurasi

### package.json (untuk runtime)
```json
{
  "imports": {
    "#server/*": "./server/*"
  }
}
```

### tsconfig.json (untuk TypeScript)
```json
{
  "compilerOptions": {
    "paths": {
      "~server/*": ["server/*"]
    }
  }
}
```

## Cara Penggunaan

### Gunakan alias `#server/` (runtime)
```typescript
import { sendSuccess } from '#server/utils/response'
import { ValidationError } from '#server/utils/errors'
import { PropertyService } from '#server/services/PropertyService'
```

### Gunakan alias `~server/` (TypeScript types)
```typescript
import type { User } from '~server/models/User'
import type { Property } from '~server/models/Property'
```

## Contoh Lengkap

```typescript
// server/api/auth/login.post.ts
import { defineHandler, readBody } from 'h3'
import { sendSuccess, sendError } from '#server/utils/response'
import { ValidationError } from '#server/utils/errors'
import { AuthService } from '#server/services/AuthService'
import { loginSchema } from '#server/schemas/auth'
import type { LoginInput } from '#server/schemas/auth'
```

## Catatan Penting

1. **Tidak menggunakan `~/server/`** - Ini bukan path yang valid
2. **Gunakan `#server/`** untuk runtime imports
3. **Gunakan `~server/`** untuk TypeScript type imports
4. Alias harus dikonfigurasi di kedua file: `package.json` dan `tsconfig.json`
