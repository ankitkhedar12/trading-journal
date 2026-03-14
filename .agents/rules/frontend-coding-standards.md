---
trigger: always_on
---

# Raffy Admin Panel - Coding Standards

## Project Structure

This React + Vite + TypeScript admin panel follows a feature-organized structure:

```
src/
├── assets/             # Static images, fonts, icons
├── components/         # Reusable UI components
│   ├── common/         # Shared components (Loader, Pagination, etc.)
│   ├── formElements/   # Form components (Button, Textbox, Select, etc.)
│   ├── svgElements/    # SVG icon components
│   ├── charts/         # Chart components (DonutChart, BarChart)
│   └── layout/         # Layout components (AdminLayout, Sidebar, Header)
├── constants/          # Route paths, API endpoints, app constants
├── contexts/           # React Context providers (AuthContext)
├── hooks/              # Custom React hooks
├── routes/             # Route definitions (PublicRoutes, ProtectedRoutes)
├── services/           # API service layer (Axios calls)
├── types/              # TypeScript type/interface definitions
├── utils/              # Utility functions
├── views/              # Page components (organized by feature)
│   ├── auth/           # Login, ForgotPassword, ResetPassword, Verification
│   ├── dashboard/      # Dashboard page
│   ├── users/          # UserList, UserDetail, UserForm, ChildAnalytics
│   ├── content/        # ContentList, ContentForm
│   ├── alerts/         # AlertRules
│   └── profile/        # Admin profile
└── styles/             # Global SCSS (abstracts, components)
```

---

## TypeScript

- **Strict mode is ON** — enforced via `tsconfig.app.json`
- **Never use `any`** — use `unknown` if the type is truly unknown, then narrow with type guards
- **Define interfaces** for all component props, API request/response shapes, and state
- **Use `type` for unions/intersections**, `interface` for object shapes
- **Explicitly type function parameters and return types** for exported functions
- **Use `satisfies`** for type-safe object literals when inference is preferred

```typescript
// Good
interface UserProps {
  name: string;
  email: string;
  role: "admin" | "viewer";
}

// Good — type for unions
type Status = "active" | "inactive" | "suspended";

// Bad
const user: any = fetchUser();
```

---

## Components

- **Functional components only** — no class components
- **Use `React.FC<Props>`** for component typing
- **Keep components small** — extract into sub-components when exceeding ~150 lines
- **One component per file** — file name matches component name in PascalCase
- **Co-locate styles** — component-specific `.scss` file lives next to the `.tsx` file

```typescript
// Good — src/views/users/UserList.tsx
const UserList: React.FC = () => {
  // ...
};
export default UserList;
```

### Component Composition

- Prefer composition over props drilling — use children, render props, or context
- Extract reusable logic into custom hooks (`src/hooks/`)
- Keep route handlers (views) thin — delegate logic to hooks and services

---

## Modularity & Organization

- **Extract complex sub-elements**: If a component contains complex sub-rendering (e.g., custom tooltips, chart dots, or repeated UI blocks like progress bars), extract them into their own files.
- **Centralize Business Logic**: Move complex calculations, data transformations, and validation logic from components into utility files (`src/utils/`).
- **Externalize Types**: Do not define interfaces locally within component files. Move them to appropriate files in `src/types/` (e.g., `trade.ts`, `account.ts`) to ensure reusability and consistency.
- **Atomic Components**: Reusable UI elements (like a `ProgressBar` or `StatusBadge`) should live in `src/components/common/` rather than being defined as local helper functions inside a view.

---

## Imports & Path Aliases

Use path aliases for all imports beyond one directory level. Never use deep relative paths like `../../../`.

```typescript
// Good
import Button from "@components/formElements/Button";
import { useAuth } from "@hooks/useAuth";
import type { User } from "@types/user";
import { API } from "@constants/api";

// Bad
import Button from "../../../components/formElements/Button";
```

### Available Aliases

| Alias | Path |
|---|---|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@views/*` | `src/views/*` |
| `@services/*` | `src/services/*` |
| `@hooks/*` | `src/hooks/*` |
| `@types/*` | `src/types/*` |
| `@constants/*` | `src/constants/*` |
| `@utils/*` | `src/utils/*` |
| `@assets/*` | `src/assets/*` |
| `@contexts/*` | `src/contexts/*` |
| `@styles/*` | `src/styles/*` |
| `@routes/*` | `src/routes/*` |
| `@store/*` | `src/store/*` |

### Import Order

Group imports in this order with blank lines between groups:

1. React and third-party libraries
2. Path alias imports (`@components`, `@services`, etc.)
3. Relative imports (same directory only)
4. Type-only imports at the end of each group

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import Button from "@components/formElements/Button";
import { userService } from "@services/userService";
import type { User } from "@types/user";

import "./UserList.scss";
```

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserList.tsx`, `PageHeader.tsx` |
| Component files | PascalCase | `UserList.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts`, `useDebounce.ts` |
| Services | camelCase with `Service` suffix | `userService.ts` |
| Types/Interfaces | PascalCase | `User`, `LoginFormData` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `ROUTES` |
| Functions/variables | camelCase | `handleSubmit`, `isLoading` |
| SCSS view files | PascalCase | `Dashboard.scss`, `Users.scss` |
| SCSS partials | _kebab-case | `_colors.scss`, `_buttons.scss` |
| Event handlers | `handle` prefix | `handleClick`, `handleSubmit` |
| Boolean variables | `is`/`has`/`should` prefix | `isLoading`, `hasError` |

---

## Styling

- **Bootstrap 5** for grid system and utility classes
- **SCSS** for custom styles — **no inline styles ever**
- Use SCSS variables from `styles/abstracts/_colors.scss` for all colors
- Component-specific styles co-located with view files

```scss
// Good — use variables
.card-header {
  background-color: $primary;
  color: $white;
  padding: $spacing-md;
}

// Bad — inline styles in JSX
<div style={{ backgroundColor: '#4A90D9', padding: 16 }}>
```

---

## Forms

- **React Hook Form** for all form state management
- **Zod** for schema-based validation via `@hookform/resolvers/zod`
- Define validation schemas in the same file as the form or in `utils/validators.ts` if shared
- Use the existing form components (`Textbox`, `Select`, `Button`, etc.)

```typescript
const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name is required"),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## API & Data Fetching

- **Axios** instance in `services/api.ts` with interceptors for auth token and error handling
- **TanStack React Query** for all server state (fetching, caching, pagination, mutations)
- Service files in `services/` return Axios promises — React Query hooks consume them
- API endpoints defined as constants in `constants/api.ts`

```typescript
// Service
export const userService = {
  list: (params: ListParams) => api.get<PaginatedResponse<User>>(API.ADMIN.USERS, { params }),
};

// Component — using React Query
const { data, isLoading } = useQuery({
  queryKey: ["users", filters],
  queryFn: () => userService.list(filters).then((res) => res.data),
});
```

---

## State Management

- **Redux Toolkit + redux-persist** for auth and global app state (persisted in localStorage)
- Use typed hooks: `useAppDispatch` and `useAppSelector` from `@store/hooks` (never raw `useDispatch`/`useSelector`)
- **React Query** for all server/API state — do not put fetched data in Redux
- **Component-local state** (`useState`) for UI-only state (modals, toggles, form inputs)
- New slices go in `src/store/` — add to `whitelist` in persist config if they need persistence

---

## Error Handling

- Axios interceptor handles 401 globally (redirect to login)
- React Query `onError` for query/mutation-specific errors
- **React Toastify** for user-facing error/success notifications
- **ErrorBoundary** component wraps the app for render error recovery
- Always type error responses using `types/common.ts`

---

## Performance

- **Lazy load routes** with `React.lazy()` + `Suspense` for code splitting
- Use `React.memo` for list item components rendered in loops
- Use `useMemo` for expensive computations, `useCallback` for stable function references passed as props
- Avoid unnecessary re-renders — don't create objects/arrays in JSX

```typescript
// Good
const columns = useMemo(() => [...], []);

// Bad — creates new array every render
<Table columns={[...]} />
```

---

## Testing

- **Vitest** as test runner (Vite-native)
- **React Testing Library** for component tests
- Co-locate test files with source: `Component.test.tsx` next to `Component.tsx`
- Test user interactions, not implementation details
- Mock API calls in service tests

---

## Linting & Formatting

- **ESLint 9** with typescript-eslint and react-hooks plugins
- **Prettier** for code formatting

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Type check
npm run type-check
```

**Run before every commit:**

```bash
npm run type-check && npm run lint:fix && npm run format
```

---

## Git Commit Messages

Use conventional commits:

```
feat: add user list page with search and pagination
fix: resolve token refresh race condition
refactor: extract pagination hook from UserList
style: update sidebar active state colors
test: add login form validation tests
chore: update dependencies
```

---

## Do NOT

- Use `any` type
- Write inline styles
- Use deep relative imports (`../../..`)
- Put server data in React Context (use React Query)
- Create class components
- Skip TypeScript strict checks
- Commit `console.log` statements
- Use `var` — use `const` by default, `let` only when reassignment is needed