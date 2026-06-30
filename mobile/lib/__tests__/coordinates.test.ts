import { mapDetectionToView } from "../coordinates";

describe("mapDetectionToView", () => {
  it("maps image coordinates into a cover-style camera view", () => {
    const mapped = mapDetectionToView(
      {
        id: "cup:1:2:3:4",
        label: "cup",
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        source: "local",
      },
      200,
      200,
      400,
      400,
    );

    expect(mapped.x1).toBe(0);
    expect(mapped.y1).toBe(0);
    expect(mapped.x2).toBe(200);
    expect(mapped.y2).toBe(200);
  });
});
