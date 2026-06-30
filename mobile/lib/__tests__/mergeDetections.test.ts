import { mergeDetections, toDetections } from "../mergeDetections";

describe("mergeDetections", () => {
  it("upgrades overlapping local labels with cloud labels", () => {
    const local = toDetections(
      [{ label: "cup", x1: 10, y1: 10, x2: 100, y2: 100 }],
      "local",
    );
    const cloud = toDetections(
      [{ label: "coffee mug", x1: 12, y1: 12, x2: 98, y2: 98 }],
      "cloud",
    );

    const merged = mergeDetections(local, cloud);
    expect(merged).toHaveLength(1);
    expect(merged[0].label).toBe("coffee mug");
    expect(merged[0].source).toBe("cloud");
  });

  it("adds non-overlapping cloud detections", () => {
    const local = toDetections(
      [{ label: "chair", x1: 0, y1: 0, x2: 50, y2: 50 }],
      "local",
    );
    const cloud = toDetections(
      [{ label: "plant", x1: 200, y1: 200, x2: 280, y2: 280 }],
      "cloud",
    );

    const merged = mergeDetections(local, cloud);
    expect(merged).toHaveLength(2);
  });
});
