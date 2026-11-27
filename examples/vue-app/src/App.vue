<script setup>
// A real Vue 3 application that consumes the ui-moods component library.
//
// Two things are being demonstrated here, and they are the two halves of what
// the library is for:
//
//   1. The components. `<UMButton>`, `<UMTag>`, `<UMAlert>` and the rest are
//      Vue components from `ui-moods/vue`, but they are still plain markup
//      with a `um-` class underneath — the stylesheet decides what they look
//      like.
//
//   2. The mood. `useTheme()` reads and writes the `data-um-theme` attribute
//      on the document. Because `themes/all.css` carries all 32 moods in one
//      sheet, changing the mood costs **no network request at all** — the
//      browser has every mood already, and the cascade picks the one the
//      attribute names.
//
// The same attribute can be set by hand, from the plain `themes/switcher.js`,
// or from any other framework. The document owns the mood, not this file.

import { computed, ref } from "vue";
import { useTheme } from "ui-moods/vue";

const { theme, setTheme, themes } = useTheme();

const name = ref("Ada Lovelace");
const notify = ref(true);
const plan = ref("pro");

const moods = computed(() => themes.value ?? []);

function pick(id) {
  setTheme(id);
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <h1 class="title">ui-moods</h1>
        <p class="sub">
          The same markup, in any of 32 moods. Switching costs no network request.
        </p>
      </div>

      <select class="picker" :value="theme ?? ''" @change="pick($event.target.value)">
        <option v-for="m in moods" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </header>

    <main class="grid">
      <UMCard class="panel">
        <template #default>
          <h2 class="panel-title">Components</h2>

          <div class="row">
            <UMButton variant="primary">Save</UMButton>
            <UMButton variant="default">Cancel</UMButton>
            <UMButton variant="text">Learn more</UMButton>
          </div>

          <div class="row">
            <UMButton variant="success" size="sm">Done</UMButton>
            <UMButton variant="warning" size="sm">Pending</UMButton>
            <UMButton variant="danger" size="sm">Delete</UMButton>
          </div>

          <div class="row">
            <UMTag variant="primary">new</UMTag>
            <UMTag variant="success">synced</UMTag>
            <UMTag variant="warning">beta</UMTag>
            <UMTag variant="danger">failed</UMTag>
          </div>
        </template>
      </UMCard>

      <UMCard class="panel">
        <template #default>
          <h2 class="panel-title">Form</h2>

          <label class="field">
            <span class="field-label">Name</span>
            <UMInput v-model="name" placeholder="Ada Lovelace" />
          </label>

          <label class="field field--inline">
            <UMSwitch v-model="notify" />
            <span>Email me about changes</span>
          </label>

          <div class="field">
            <span class="field-label">Plan</span>
            <div class="row">
              <UMRadioGroup v-model="plan" direction="horizontal" name="plan">
                <template #option>
                  <UMRadio value="free">Free</UMRadio>
                  <UMRadio value="pro">Pro</UMRadio>
                  <UMRadio value="team">Team</UMRadio>
                </template>
              </UMRadioGroup>
            </div>
          </div>
        </template>
      </UMCard>

      <UMCard class="panel">
        <template #default>
          <h2 class="panel-title">Feedback</h2>

          <UMAlert variant="success" title="Saved">
            Your changes are live.
          </UMAlert>
          <UMAlert variant="warning" title="Almost out of space">
            82% of the quota is used.
          </UMAlert>
          <UMAlert variant="danger" title="Payment failed">
            The card on file was declined.
          </UMAlert>
        </template>
      </UMCard>
    </main>

    <footer class="foot">
      <span class="foot-text">
        The mood is one attribute on the document:
        <code>data-um-theme="{{ theme }}"</code>
      </span>
    </footer>
  </div>
</template>

<style>
/* The host's own layout. The library does not touch it — it states its own
   box model for the elements it paints and nothing else. */
body {
  margin: 0;
  background: var(--um-bg-page);
  color: var(--um-text-regular);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  color: var(--um-text-primary);
  font-size: 28px;
}
.sub {
  margin: 4px 0 0;
  color: var(--um-text-secondary);
  font-size: 14px;
}
.picker {
  font: inherit;
  padding: 8px 12px;
  border-radius: var(--um-radius-medium);
  border: 1px solid var(--um-border-base);
  background: var(--um-surface-control);
  color: var(--um-text-primary);
}
.grid {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}
.panel {
  padding: 20px;
}
.panel-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--um-text-primary);
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.field {
  display: block;
  margin-bottom: 16px;
}
.field--inline {
  display: flex;
  align-items: center;
  gap: 10px;
}
.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--um-text-secondary);
}
.foot {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--um-border-base);
}
.foot-text {
  font-size: 13px;
  color: var(--um-text-secondary);
}
.foot code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--um-color-primary-text);
}
</style>
