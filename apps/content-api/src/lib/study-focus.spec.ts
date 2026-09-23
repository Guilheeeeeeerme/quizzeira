import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStudyFocusOptions,
  nodeAppliesToPosition,
  nodeIdsForPosition,
} from "./study-focus.js";

describe("study-focus options", () => {
  it("hides empty areas and dedupes subjects by slug", () => {
    const { focusAreas, focusSubjects } = buildStudyFocusOptions({
      positions: [
        { id: "p1", title: "Analista", slug: "analista", implicit: false },
        { id: "p2", title: "Técnico", slug: "tecnico", implicit: false },
        { id: "p3", title: "geral", slug: "geral", implicit: true },
      ],
      nodes: [
        { id: "n1", parentId: null, depth: 0, title: "Informática", positionIds: ["p1"] },
        { id: "n2", parentId: "n1", depth: 1, title: "Redes", positionIds: ["p1"] },
        { id: "n3", parentId: null, depth: 0, title: "Português", positionIds: [] },
      ],
      publishedByNodeId: new Map([
        ["n2", 3],
      ]),
      publishedBySubject: [
        { subjectSlug: "informatica", subject: "Informática", count: 3 },
        { subjectSlug: "informatica", subject: "Informatica", count: 2 },
        { subjectSlug: "portugues", subject: "Português", count: 4 },
        { subjectSlug: "geral", subject: "geral", count: 9 },
      ],
      publishedByPositionId: new Map(),
    });

    assert.equal(focusAreas.length, 1);
    assert.equal(focusAreas[0]?.id, "p1");
    assert.equal(focusAreas[0]?.publishedCount, 3);

    assert.equal(focusSubjects.length, 2);
    const info = focusSubjects.find((s) => s.slug === "informatica");
    assert.ok(info);
    assert.equal(info.publishedCount, 5);
    assert.equal(info.title, "Informática");
    assert.deepEqual(info.areaIds, ["p1"]);
    assert.ok(!focusSubjects.some((s) => s.slug === "geral"));
  });

  it("excludes position slugs from subjects and humanizes bare slug titles", () => {
    const { focusSubjects } = buildStudyFocusOptions({
      positions: [{ id: "p1", title: "Analista", slug: "analista", implicit: false }],
      nodes: [],
      publishedByNodeId: new Map(),
      publishedBySubject: [
        { subjectSlug: "analista", subject: "analista", count: 4 },
        { subjectSlug: "raciocinio-logico", subject: "raciocinio-logico", count: 2 },
      ],
      publishedByPositionId: new Map([["p1", 4]]),
    });
    assert.ok(!focusSubjects.some((s) => s.slug === "analista"));
    assert.equal(focusSubjects[0]?.title, "Raciocinio Logico");
  });

  it("promotes ALL-CAPS cargo headings to areas when positions are implicit", () => {
    const { focusAreas, focusSubjects } = buildStudyFocusOptions({
      positions: [{ id: "p0", title: "geral", slug: "geral", implicit: true }],
      nodes: [
        {
          id: "n1",
          parentId: null,
          depth: 0,
          title: "ADMINISTRADOR E ECONOMISTA",
          positionIds: [],
        },
        {
          id: "n2",
          parentId: null,
          depth: 0,
          title: "Raciocínio Lógico",
          positionIds: [],
        },
      ],
      publishedByNodeId: new Map(),
      publishedBySubject: [
        { subjectSlug: "administrador-e-economista", subject: "administrador-e-economista", count: 10 },
        { subjectSlug: "raciocinio-logico", subject: "raciocinio-logico", count: 5 },
      ],
      publishedByPositionId: new Map(),
    });
    assert.equal(focusAreas.length, 1);
    assert.equal(focusAreas[0]?.slug, "administrador-e-economista");
    assert.equal(focusSubjects.length, 1);
    assert.equal(focusSubjects[0]?.slug, "raciocinio-logico");
    assert.equal(focusSubjects[0]?.title, "Raciocínio Lógico");
  });

  it("nodeAppliesToPosition treats empty ids as all positions", () => {
    assert.equal(nodeAppliesToPosition([], "p1"), true);
    assert.equal(nodeAppliesToPosition(["p1"], "p1"), true);
    assert.equal(nodeAppliesToPosition(["p2"], "p1"), false);
  });

  it("nodeIdsForPosition returns matching nodes", () => {
    const ids = nodeIdsForPosition(
      [
        { id: "a", parentId: null, depth: 0, title: "A", positionIds: [] },
        { id: "b", parentId: null, depth: 0, title: "B", positionIds: ["p1"] },
        { id: "c", parentId: null, depth: 0, title: "C", positionIds: ["p2"] },
      ],
      "p1",
    );
    assert.deepEqual(ids.sort(), ["a", "b"]);
  });
});
