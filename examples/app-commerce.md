# Example · App pack usage (commerce)

An **app pack** is the second layer of UI Moods. It fixes *how a product
flows* — the screens, their order, and their content — while the mood it
references fixes *how it looks*.

## Step 1 — find the pack

```bash
npx ui-moods serve
# → 行业应用 → commerce
```

or read the data directly:

```bash
cat apps/commerce/app.json
```

`app.json` is the authoritative form. It declares the screens, each one an
ordered list of **blocks**:

```json
{
  "id": "commerce",
  "name": "Commerce",
  "nameZh": "电商零售",
  "mood": "corporate",
  "screens": [
    {
      "id": "cart",
      "title": "购物车",
      "blocks": [
        { "type": "list", "items": [{ "icon": "cart", "title": "…", "sub": "…", "value": "…" }] },
        { "type": "prices", "items": [{ "label": "小计", "value": "¥ 298.00", "total": true }] }
      ]
    }
  ]
}
```

## Step 2 — bundle the mood it uses

```bash
npx ui-moods bundle corporate > corporate.prompt.md
```

## Step 3 — paste into your agent chat

Paste the generated prompt package first, then paste the section below.

## Requirement

Build a **cart screen** for a grocery app:

- a list of 3 purchased items (thumbnail, name, spec, unit price, quantity
  stepper, subtotal)
- a coupon input
- a totals block: subtotal, delivery fee, discount, total
- a "settle" primary button and a "keep shopping" secondary action
- an empty state for when the cart has no items

## Delivery rules

- Use only the tokens from the bundle above.
- Follow the layout conventions of `apps/commerce/app.json` — especially its
  `cart` screen — for the structure of your screen.
- Do not invent new colors, radii, shadows or spacing values. Every visual
  parameter comes from `mood/corporate@1.0.0`.
- Self-check against the mood's acceptance checklist before delivery.
- Cite the mood version in your summary: `mood/corporate@1.0.0`.
