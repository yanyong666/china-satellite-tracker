import { describe, expect, it } from "vitest";
import { publicTrpcContext } from "../client/src/lib/trpc";
import { memberTrpcContext } from "../client/src/lib/cloudflareMemberTrpc";

describe("public and member tRPC clients", () => {
  it("use distinct React Provider contexts so nested member routes cannot replace public market routing", () => {
    expect(publicTrpcContext).not.toBe(memberTrpcContext);
  });
});
