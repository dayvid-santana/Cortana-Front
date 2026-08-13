import { describe, expect, it } from "vitest";

import { commitKeys } from "@/features/commits/api/queries";
import { decisionKeys } from "@/features/decisions/api/queries";
import { projectKeys } from "@/features/projects/api/queries";
import { questionKeys } from "@/features/questions/api/queries";

describe("query key factories", () => {
  it("projectKeys.detail is scoped under projectKeys.all", () => {
    expect(projectKeys.detail("proj_1")).toEqual(["projects", "detail", "proj_1"]);
    expect(projectKeys.status("proj_1")).toEqual(["projects", "detail", "proj_1", "status"]);
  });

  it("commitKeys differentiate list filters so distinct filters don't share a cache entry", () => {
    const docsKey = commitKeys.list("proj_1", { branch: "main" });
    const codeKey = commitKeys.list("proj_1", { branch: "feature/auth" });
    expect(docsKey).not.toEqual(codeKey);
    expect(commitKeys.detail("proj_1", "a17d3e1")).toEqual([
      "projects",
      "proj_1",
      "commits",
      "detail",
      "a17d3e1",
    ]);
  });

  it("decisionKeys and questionKeys are namespaced per project", () => {
    expect(decisionKeys.all("proj_1")[1]).toBe("proj_1");
    expect(questionKeys.all("proj_2")[1]).toBe("proj_2");
    expect(decisionKeys.all("proj_1")).not.toEqual(questionKeys.all("proj_1"));
  });

  it("list keys change when filters change, so React Query treats them as different cache entries", () => {
    const active = decisionKeys.list("proj_1", { status: "active" });
    const revoked = decisionKeys.list("proj_1", { status: "revoked" });
    expect(active).not.toEqual(revoked);
  });
});
