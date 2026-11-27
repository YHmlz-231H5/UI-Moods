// UI Moods · the component layer, assembled once.
//
// The component layer is a set of partials — one per component, plus a shared
// layer and a set of quality hooks — and every consumer of them needs to know
// what order they go in:
//
//   - the builder writes the whole sheet;
//   - the validator rebuilds the sheet to prove the file on disk is current;
//   - the distributor writes one file per component, so that a host can link
//     only the components it uses.
//
// Three readers of one order is three chances to drift. So the order is
// computed here, once, and all three read it from here.
//
// The order is not cosmetic. A rule that sets a property another rule also
// sets is resolved by order, and moving it changes what is painted: the
// quality hooks close the sheet, so a glow hook still wins over the shadow a
// component gives itself.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadManifests } from "./manifest.mjs";
import { boxModelCss } from "./box-model.mjs";
import { motionCss } from "./motion.mjs";

/**
 * The chunk kinds, in the order they appear in the sheet.
 *
 *   shared    — `components/_base.css`: the layer constants and the one focus
 *               and disabled treatment every component answers to.
 *   box-model — the generated `box-sizing` rule, scoped to the library's own
 *               elements.
 *   component — one per manifest, in catalogue order.
 *   hooks     — `components/_hooks.css`: the quality hooks, last.
 */
export function assembleChunks(root) {
  const componentsDir = join(root, "components");
  const { manifests, problems } = loadManifests(root);

  const chunks = [];

  const sharedFiles = readdirSync(componentsDir)
    .filter((f) => f.startsWith("_") && f.endsWith(".css"))
    .sort();
  const first = sharedFiles.filter((f) => f === "_base.css");
  const last = sharedFiles.filter((f) => f === "_hooks.css");
  const middle = sharedFiles.filter((f) => !first.includes(f) && !last.includes(f));

  if (!first.length) {
    problems.push("components/_base.css missing — the shared layer has to exist");
    return { chunks, manifests, problems };
  }

  for (const name of [...first, ...middle]) {
    chunks.push({
      id: name.replace(/\.css$/, ""),
      title: "shared layer",
      kind: "shared",
      css: readFileSync(join(componentsDir, name), "utf8").trim(),
    });
  }

  chunks.push({
    id: "_box-model",
    title: "box model",
    kind: "box-model",
    css: boxModelCss(manifests),
  });

  // The motion contract sits with the shared layer rather than with the
  // components, because it answers for all of them at once: when the reader
  // has asked for reduced motion, nothing the library paints moves.
  chunks.push({
    id: "_motion",
    title: "motion contract",
    kind: "motion",
    css: motionCss(manifests),
  });

  for (const m of manifests) {
    const stylePath = join(componentsDir, m.id, m.style ?? "style.css");
    if (!existsSync(stylePath)) {
      problems.push(`components/${m.id}/${m.style ?? "style.css"} missing`);
      continue;
    }
    chunks.push({
      id: m.id,
      title: m.name,
      kind: "component",
      css: readFileSync(stylePath, "utf8").trim(),
    });
  }

  for (const name of last) {
    chunks.push({
      id: name.replace(/\.css$/, ""),
      title: "quality hooks",
      kind: "hooks",
      css: readFileSync(join(componentsDir, name), "utf8").trim(),
    });
  }

  return { chunks, manifests, problems };
}

/** The chunks of one kind. */
export function chunksOfKind(chunks, kind) {
  return chunks.filter((c) => c.kind === kind);
}

/**
 * The whole sheet as one string.
 *
 * The chunks are joined with a blank line, so the sheet reads the same way the
 * partials do.
 */
export function joinChunks(chunks) {
  return chunks.map((c) => c.css).join("\n\n");
}
