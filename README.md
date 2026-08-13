# GrabnGo App

A mobile-first web app for tracking emergency-kit items and their expiry dates.

This is the frontend. It talks to the GrabnGo API, which lives in its own repo
(`grab-n-go-bag-api`) and owns the database, the accounts and the expiry
reminder emails. Nothing is stored in the browser except the session token and
the theme choice.

## Running it

Requires Node 22+ (there's an `.nvmrc`).

```sh
nvm use
npm install
npm run dev      # http://localhost:3000
```

The API has to be running too, on port 3001, or every request fails with
"Couldn't reach the server". Start it first, from the API repo, with
`npm run dev`.

Copy `.env.example` to `.env` and point it at that API:

```sh
VITE_AUTH_URL=http://localhost:3001/auth
VITE_BAG_API_URL=http://localhost:3001/bag
```

Both variables name the **API's** port, never this app's. Only names beginning
`VITE_` reach browser code, which is what keeps anything else in the file out
of the bundle.

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript only |

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 (CSS-first, no config file) ·
react-router-dom v7 · Vitest · lucide-react.

No component library, no state manager — React context plus `useReducer` is
enough at this size.

## How it's laid out

```
src/
  gateways/            One file per service — every endpoint the app can call
  utils/request.ts     The fetch wrapper every gateway goes through
  containers/Bag/      constants · actions · reducer · effects · selectors
  containers/Auth/     the same five, for the session
  lib/expiry.ts        Pure expiry maths — days left, status, labels, sorting
  lib/validation.ts    Pure form rules, all unit-tested
  lib/storage.ts       The only module that touches localStorage
  lib/dates.ts         Calendar-day helpers
  context/BagContext   Holds the Bag reducer and runs its effects
  context/AuthContext  Holds the Auth reducer and runs its effects
  pages/               Welcome, Login, Categories, CategoryDetail
  components/          Presentational pieces
```

### Theme

Red, white and black with a manual dark mode. Tokens are defined once in
`src/index.css` and exposed through `@theme inline` so utilities resolve them at
use time and flip with the theme — components never reference a hex value.

Tailwind v4 defaults dark mode to `prefers-color-scheme`, which makes a manual
toggle impossible, so a `@custom-variant` points the `dark:` variant at a
`.dark` class instead. An inline script in `index.html` applies that class
before first paint, so a dark-phone user never sees a white flash.

Colour rules worth keeping:

- **Red means "act on this."** The only non-warning uses are the logo mark and
  the sign-in button; "Add item" is neutral.
- **The red inverts direction between modes** — it darkens on white and lightens
  on black. One red never serves both.
- **Nothing is signalled by colour alone.** Every expired item carries a text
  badge, so the screen reads in greyscale.

### Expiry status

| Days left | Status |
| --- | --- |
| `null` (no expiry) | `no-expiry` |
| `< 0` | `expired` |
| `0` to `10` | `expiring` |
| `> 10` | `ok` |

Expiring **today** is `expiring`, not `expired` — it's still usable and still
actionable. Dates are compared as calendar days parsed to local midnight, never
as timestamps, so "expires today" doesn't flip to "expired" partway through the
afternoon or shift across timezones.

### API layer

Laid out the way the `ggx-pwa` gateways are: one file per service under
`src/gateways/`, and a single `src/utils/request.ts` that every one of them
calls.

```
src/
  utils/request.ts               fetch → checkStatus → parseJSON, throws ApiError
  gateways/AuthApiGateway.ts     sessions, registration, current user
  gateways/BagApiGateway.ts      categories and items
```

A gateway file is nothing but endpoints. Each exported function is named
`<verb><Noun>API`, builds its `url`, builds a `requestParams` object, and hands
both to `request`. No state, no caching, no error handling — a gateway describes
*what* to call, `request` owns *how*, and the caller decides what a failure
means.

```ts
export function getItemsByCategoryAPI(categoryId: string, queryParams?: string) {
  let url = `${import.meta.env.VITE_BAG_API_URL}/categories/${categoryId}/items`;

  if (queryParams) url += queryParams;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Item[]>(url, requestParams);
}
```

Three things differ from `ggx-pwa`, all forced by this project:

- **Gateways return the promise, not `call(request, …)`.** There is no
  redux-saga here, so there is no effect to yield — `await` the function.
- **`import.meta.env.VITE_*`, not `process.env.*`.** Vite only exposes vars
  under the `VITE_` prefix. Base URLs live in `.env` (see `.env.example`) and
  are typed in `src/vite-env.d.ts`, so a missing one is a compile error rather
  than a request to `undefined/items`.
- **`authHeader()` reads through `lib/storage`**, since that module is the only
  one in this app allowed to touch `localStorage`. The token is kept under
  `grabngo-token`.

Non-2xx responses throw an `ApiError` carrying `status` and the parsed `body`
(JSON when it is JSON, text when a proxy answers with HTML). `204`/`205`
resolve to `null`, which is why the delete endpoints are typed `Promise<null>`.

### Containers

State is organised the way a `ggx-pwa` container is — same five files, same
naming — minus redux:

```
containers/Bag/
  constants.ts   'app/Bag/ADD_ITEM' and its _SUCCESS / _FAIL siblings
  actions.ts     addItemAction, addItemSuccessAction, addItemFailAction, …
  reducer.ts     pure switch over the action union, exports initialState
  effects.ts     where saga.ts would be — the async workers
  selectors.ts   makeSelectItems, makeSelectLoading, makeSelectError, …
```

The two differences from ggx-pwa, both deliberate:

- **No store.** `BagContext` and `AuthContext` hold the reducer via
  `useReducer` and expose one function per action. The containers stay
  store-agnostic — a `configureStore` could pick these reducers up unchanged.
- **`effects.ts`, not `saga.ts`.** Sagas earn their keep on concurrent flows —
  `takeLatest` races, cancellation, retries. There are none here, so each
  worker is a plain `async` function taking `dispatch`: dispatch the bare
  action, `await` the gateway, dispatch `_SUCCESS` or `_FAIL`. Same three-phase
  shape, no generators and no extra dependencies.

**Every write is optimistic.** The bare action applies the change immediately,
`_SUCCESS` reconciles the row with what the service actually stored, and
`_FAIL` undoes it.
Creates are the interesting case: the id is minted client-side so the row can be
on screen before the request is answered, then `ADD_ITEM_SUCCESS` swaps it for
the stored row in place. A new *category* also reparents any items already filed
under its temporary id. For edits and deletes there is no snapshot to roll back
to, so the effect re-issues `loadBag` to resync and the reducer only records the
error.

`loading` covers the initial fetch alone. Edits never set it — an optimistic
change that also flashed a spinner would be the worst of both.

### Auth

Real accounts, held by the API. Registering seeds a bag of eight categories and
signs you in. The session is a JWT the API issues, kept in `localStorage` and
sent as an `Authorization` header by every gateway that needs one. On boot the
app asks the API who the token belongs to, and drops it if the answer is no
longer valid.

A failed sign-in says which field is wrong. An unregistered address is reported
against the email input, a bad password against the password one, because the
API names the field in its error body and `Auth/effects.ts` honours it.

## Tests

```sh
npm test
```

Covers `expiry.ts` and `validation.ts` — every status boundary, the rules that
must *reject* and the ones that must *allow* (quantity `0`, a past expiry, no
expiry at all), and a clock sweep proving an item expiring today reads
"expires today" at every hour.

`containers/Bag/reducer.ts` is covered too, which is the payoff for keeping it
pure: the optimistic add and its swap-on-success, the rollback on failure, a
category taking its items with it when deleted, and the reducer neither mutating
the state handed to it nor returning a new object for an action it ignores.
