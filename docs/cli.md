# CLI reference

Installing `emoji-kit` provides the `emoji-kit` binary (also importable from `emoji-kit/cli`). Every command supports `--json` for machine-readable output.

```sh
emoji-kit <command> [args] [options]
```

## Commands

### `get <name|char|hex>`

Resolve one emoji by shortcode, alias, Unicode character, or hex code.

```sh
emoji-kit get thumbsup
emoji-kit get +1
emoji-kit get '👍'
emoji-kit get 1F44D
emoji-kit get thumbsup --json
```

Unknown values print an error to stderr and exit with a non-zero status.

### `search <query> [--app <id>] [--limit n]`

Search names, shortcodes, and tags. Default limit is 20.

```sh
emoji-kit search 'thumbs up'
emoji-kit search fire --app tiktok --limit 5
emoji-kit search fire --json
```

### `list [--app id] [--limit n]`

List emoji in dataset order with optional app filtering. Default limit is 20.

```sh
emoji-kit list --app github --limit 10
emoji-kit list --limit 5 --json
```

### `render <text>`

Replace `:shortcode:` tokens with Unicode characters. App-qualified tokens use a slash.

```sh
emoji-kit render 'Hi :thumbsup: :tiktok/fire:'
```

Unknown tokens are left as-is. The output is plain text, never HTML.

### `apps [--json]`

List the 28 curated app definitions, including their ids, categories, aliases, and notes.

```sh
emoji-kit apps
emoji-kit apps --json
```

### `check [--json]`

Verify generated data checksums at runtime and report metadata (versions, counts, sources).

```sh
emoji-kit check
emoji-kit check --json
```

The JSON output includes `ok`, a list of failed file names, and dataset `metadata`.

## Options

| Option | Applies to | Meaning |
| --- | --- | --- |
| `--json` | all commands | Pretty-printed JSON output |
| `--app <id>` | `search`, `list` | Filter by app overlay id |
| `--limit <n>` | `search`, `list` | Maximum number of results |

Running without a command prints usage. The CLI reads only local generated data; it performs no network requests. See [data pipeline](data-pipeline.md) for dataset details and [app categories](app-categories.md) for the list of valid app ids.
