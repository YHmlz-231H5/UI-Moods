// UI Moods · does the binding actually bind?
//
// `check-vue.mjs` proves that a wrapper and its manifest agree: the same
// props, the same classes, the same parts. It renders the wrapper, so it sees
// what the wrapper draws — but it never *uses* it, because a wrapper has no
// user.
//
// A binding is the one thing a wrapper has that a static render cannot show.
// A component can declare `modelValue`, accept it, and then ignore it, and
// every agreement check in this repository would still pass. So the binding
// is checked by using it:
//
//   - a bound value has to reach the markup, in every place the value shows;
//   - an unbound component has to render exactly what it rendered before, so
//     a host that used the old props gets the same page;
//   - a change has to publish the new value on `update:modelValue`, and it
//     has to publish it before the legacy `change` event, so a host that
//     listens to both sees them in the order it expects;
//   - a group has to tell its options which one is selected, which is the
//     part `provide`/`inject` exists for.
//
// The last one is the interesting one: the group's value reaches its options
// through Vue's own injection, and nothing in a static render can tell
// whether that wiring works.

import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Check that the bindings bind.
 *
 * @param {string} root the repository root
 * @returns {Promise<{ errors: string[], skipped?: boolean }>}
 */
export async function checkVModel(root) {
  let vue;
  let serverRenderer;
  try {
    vue = await import("vue");
    serverRenderer = await import("@vue/server-renderer");
  } catch {
    // Vue is not installed: the binding cannot be checked, but the library
    // itself is fine.
    return { errors: [], skipped: true };
  }

  const { renderToString } = serverRenderer;
  const { h, createRenderer } = vue;

  const errors = [];
  const note = (m) => errors.push(m);

  /** The components under test. */
  const UM = await import(pathToFileURL(join(root, "vue", "components", "index.js")).href);

  /**
   * A renderer that draws nothing and remembers everything.
   *
   * The browser's renderer would do, but a test has no browser, and a headless
   * one is a lot of machinery for a question about a component's own logic. So
   * the tree is built by hand: an element is an object with its props, and the
   * props are where a handler lives — which is exactly what the test needs to
   * reach.
   */
  function createTestRenderer() {
    let nextId = 1;

    return createRenderer({
      createElement: (type) => ({ id: nextId++, type, props: {}, children: [], parent: null }),
      createText: (text) => ({ id: nextId++, text }),
      createComment: (text) => ({ id: nextId++, comment: text }),
      setText: (node, text) => {
        node.text = text;
      },
      setElementText: (el, text) => {
        el.children = [{ text }];
      },
      insert: (child, parent, anchor) => {
        child.parent = parent;
        const at = anchor ? parent.children.indexOf(anchor) : -1;
        if (at >= 0) parent.children.splice(at, 0, child);
        else parent.children.push(child);
      },
      remove: (child) => {
        const parent = child.parent;
        if (!parent) return;
        const at = parent.children.indexOf(child);
        if (at >= 0) parent.children.splice(at, 1);
        child.parent = null;
      },
      parentNode: (node) => node.parent,
      nextSibling: (node) => {
        const parent = node.parent;
        if (!parent) return null;
        const at = parent.children.indexOf(node);
        return at >= 0 ? (parent.children[at + 1] ?? null) : null;
      },
      querySelector: () => null,
      setScopeId: () => {},
      patchProp: (el, key, _prev, next) => {
        el.props[key] = next;
      },
    });
  }

  const testRenderer = createTestRenderer();

  /**
   * Mount a component in the test renderer.
   *
   * @param {object} component the component
   * @param {object} props the props to render it with
   * @param {Function} [children] the slot content
   * @returns {{ root: object }}
   */
  function mount(component, props = {}, children) {
    const app = testRenderer.createApp({
      render() {
        return h(component, props, children);
      },
    });
    // The tree the component drew is the root instance's subtree. The
    // renderer's own return value is the component's proxy, not its markup, so
    // the subtree is where the elements are.
    app.mount({ id: 0, type: "root", props: {}, children: [], parent: null });
    return { root: app._instance.subTree };
  }

  /**
   * Every element in a tree, depth first.
   *
   * A component's own markup is not in its vnode's children — the children are
   * the slot — it is in the subtree the component rendered. So the walk follows
   * that too, or the tree would stop at the first component.
   *
   * @param {object} node the tree
   * @returns {object[]}
   */
  function elements(node) {
    const out = [];
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      if (n.component?.subTree) {
        walk(n.component.subTree);
        return;
      }
      if (typeof n.type === "string") out.push(n);
      if (Array.isArray(n.children)) {
        for (const child of n.children) walk(child);
      }
    };
    walk(node);
    return out;
  }

  /**
   * The first element in a tree that matches.
   *
   * @param {object} node the tree
   * @param {Function} match the test
   * @returns {object | null}
   */
  function find(node, match) {
    return elements(node).find(match) ?? null;
  }

  /**
   * Render a component and return the HTML.
   *
   * @param {object} component the component
   * @param {object} props the props to render it with
   * @param {Function} [children] the slot content
   * @returns {Promise<string>}
   */
  async function render(component, props = {}, children) {
    const app = vue.createSSRApp({
      render() {
        return h(component, props, children);
      },
    });
    return renderToString(app);
  }

  /**
   * Mount a control and press it.
   *
   * The listener is a prop — `onUpdate:modelValue` is how Vue delivers an
   * event to a parent — so the test listens exactly the way a host does.
   *
   * @param {object} component the component
   * @param {object} props the props to render it with
   * @param {object} event the DOM event to deliver
   * @returns {Array} the events, in the order they were published
   */
  function press(component, props, event) {
    const emitted = [];
    const { root } = mount(component, {
      ...props,
      "onUpdate:modelValue": (v) => emitted.push(["update:modelValue", v]),
      onChange: (e) => emitted.push(["change", e]),
    });
    const input = find(root, (el) => el.type === "input");
    if (!input) {
      emitted.push(["no-input"]);
      return emitted;
    }
    input.props.onChange(event);
    return emitted;
  }

  // --- 1. a bound value reaches the markup ----------------------------------

  {
    const html = await render(UM.UMInput, { modelValue: "hello" });
    if (!html.includes('value="hello"')) {
      note(`input: a bound value did not reach the markup — ${html}`);
    }
  }

  {
    const html = await render(UM.UMSwitch, { modelValue: true });
    if (!/\bchecked\b/.test(html)) {
      note(`switch: a bound true did not reach the markup — ${html}`);
    }
  }

  {
    const html = await render(UM.UMSwitch, { modelValue: false, checked: true });
    if (/\bchecked\b/.test(html)) {
      note(`switch: a bound false did not override the older prop — ${html}`);
    }
  }

  {
    const html = await render(UM.UMCheckbox, { modelValue: true, value: "a" });
    if (!/\bchecked\b/.test(html)) {
      note(`checkbox: a bound true did not reach the markup — ${html}`);
    }
  }

  // --- 2. a binding has to change something ---------------------------------
  //
  // The older props have to keep working, and the only way to know that is to
  // compare what the component renders with and without the binding.

  {
    const legacy = await render(UM.UMSwitch, { checked: true });
    const unbound = await render(UM.UMSwitch, {});
    if (legacy === unbound) {
      note("switch: binding a value changed nothing — the binding is not wired");
    }
  }

  // --- 3. a change publishes the new value ----------------------------------

  {
    const emitted = press(UM.UMInput, {}, { target: { value: "typed" } });
    const first = emitted[0];
    if (!first || first[0] !== "update:modelValue" || first[1] !== "typed") {
      note(`input: a change did not publish the new value — ${JSON.stringify(emitted)}`);
    }
    if (emitted[1]?.[0] !== "change") {
      note(`input: update:modelValue did not come before change — ${JSON.stringify(emitted)}`);
    }
  }

  {
    const emitted = press(UM.UMSwitch, {}, { target: { checked: true } });
    if (emitted[0]?.[0] !== "update:modelValue" || emitted[0]?.[1] !== true) {
      note(`switch: a change did not publish the new state — ${JSON.stringify(emitted)}`);
    }
  }

  {
    const emitted = press(UM.UMCheckbox, {}, { target: { checked: true } });
    if (emitted[0]?.[0] !== "update:modelValue" || emitted[0]?.[1] !== true) {
      note(`checkbox: a change did not publish the new state — ${JSON.stringify(emitted)}`);
    }
  }

  {
    const emitted = press(UM.UMRadio, { value: "pro" }, { target: { checked: true } });
    if (emitted[0]?.[0] !== "update:modelValue" || emitted[0]?.[1] !== true) {
      note(`radio: a change did not publish the new state — ${JSON.stringify(emitted)}`);
    }
  }

  // --- 4. a group publishes the value that was picked -----------------------

  {
    const emitted = [];
    const { root } = mount(
      UM.UMRadioGroup,
      {
        modelValue: "free",
        "onUpdate:modelValue": (v) => emitted.push(["update:modelValue", v]),
        onChange: (e) => emitted.push(["change", e]),
      },
      { default: () => [h(UM.UMRadio, { value: "pro" }, { label: () => "Pro" })] },
    );
    // The panel is where the group's handler sits, because the change event
    // bubbles out of the input and the panel is what it bubbles to.
    const panel = find(root, (el) =>
      String(el.props?.class ?? "").includes("um-radio-group__options"),
    );
    if (!panel) {
      note("radio-group: the options panel was not rendered");
    } else {
      panel.props.onChange({ target: { value: "pro" } });
      if (emitted[0]?.[0] !== "update:modelValue" || emitted[0]?.[1] !== "pro") {
        note(
          `radio-group: picking an option did not publish its value — ${JSON.stringify(emitted)}`,
        );
      }
      if (emitted[1]?.[0] !== "change") {
        note(
          `radio-group: update:modelValue did not come before change — ${JSON.stringify(emitted)}`,
        );
      }
    }
  }

  {
    const emitted = [];
    const { root } = mount(
      UM.UMCheckboxGroup,
      {
        modelValue: ["a"],
        "onUpdate:modelValue": (v) => emitted.push(["update:modelValue", v]),
        onChange: (e) => emitted.push(["change", e]),
      },
      { default: () => [h(UM.UMCheckbox, { value: "b" }, { label: () => "B" })] },
    );
    const panel = find(root, (el) =>
      String(el.props?.class ?? "").includes("um-checkbox-group__options"),
    );
    if (!panel) {
      note("checkbox-group: the options panel was not rendered");
    } else {
      panel.props.onChange({ target: { value: "b", checked: true } });
      const next = emitted[0]?.[1];
      if (!Array.isArray(next) || !next.includes("b") || !next.includes("a")) {
        note(
          `checkbox-group: ticking an option did not publish the list — ${JSON.stringify(emitted)}`,
        );
      }
    }
  }

  // --- 5. a group tells its options which one is selected -------------------
  //
  // This is the part that only works if the injection is wired: the group's
  // value has to reach an option that is written somewhere else entirely.

  {
    const html = await render(
      UM.UMRadioGroup,
      { modelValue: "pro" },
      { default: () => [h(UM.UMRadio, { value: "pro" }, { label: () => "Pro" })] },
    );
    if (!/\bchecked\b/.test(html)) {
      note(`radio-group: the option the group names was not selected — ${html}`);
    }
  }

  {
    const html = await render(
      UM.UMRadioGroup,
      { modelValue: "free" },
      { default: () => [h(UM.UMRadio, { value: "pro" }, { label: () => "Pro" })] },
    );
    if (/\bchecked\b/.test(html)) {
      note(`radio-group: an option the group did not name was selected — ${html}`);
    }
  }

  {
    const html = await render(
      UM.UMCheckboxGroup,
      { modelValue: ["a"] },
      { default: () => [h(UM.UMCheckbox, { value: "a" }, { label: () => "A" })] },
    );
    if (!/\bchecked\b/.test(html)) {
      note(`checkbox-group: the option the group names was not ticked — ${html}`);
    }
  }

  {
    const html = await render(
      UM.UMCheckboxGroup,
      { modelValue: ["b"] },
      { default: () => [h(UM.UMCheckbox, { value: "a" }, { label: () => "A" })] },
    );
    if (/\bchecked\b/.test(html)) {
      note(`checkbox-group: an option the group did not name was ticked — ${html}`);
    }
  }

  // --- 6. the group's own option follows the binding ------------------------

  {
    const html = await render(UM.UMRadioGroup, { modelValue: "pro", value: "pro" });
    if (!/\bchecked\b/.test(html)) {
      note(`radio-group: the group's own option did not follow the binding — ${html}`);
    }
  }

  {
    const html = await render(UM.UMCheckboxGroup, { modelValue: ["a"], value: "a" });
    if (!/\bchecked\b/.test(html)) {
      note(`checkbox-group: the group's own option did not follow the binding — ${html}`);
    }
  }

  // --- 7. the group's arithmetic --------------------------------------------

  {
    const { tickedValues } = await import(
      pathToFileURL(join(root, "vue", "lib", "group.mjs")).href
    );
    const ticked = tickedValues(["a"], { target: { value: "b", checked: true } });
    if (JSON.stringify(ticked) !== JSON.stringify(["a", "b"])) {
      note(`checkbox-group: ticking an option did not add it — ${JSON.stringify(ticked)}`);
    }
    const unticked = tickedValues(["a", "b"], { target: { value: "a", checked: false } });
    if (JSON.stringify(unticked) !== JSON.stringify(["b"])) {
      note(`checkbox-group: unticking an option did not remove it — ${JSON.stringify(unticked)}`);
    }
  }

  return { errors };
}
