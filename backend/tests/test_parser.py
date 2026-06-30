from app.parser import dedupe_boxes, parse_boxes


def test_parse_boxes_with_semantic_labels():
    answer = (
        "<semantic>cup</semantic><box><100><200><300><400></box>"
        "<semantic>laptop</semantic><box><500><100><800><600></box>"
    )
    boxes = parse_boxes(answer, 1000, 1000)
    assert len(boxes) == 2
    assert boxes[0].label == "cup"
    assert boxes[0].x1 == 100
    assert boxes[1].label == "laptop"


def test_dedupe_boxes_removes_overlap():
    answer = (
        "<semantic>cup</semantic><box><100><100><300><300></box>"
        "<semantic>coffee mug</semantic><box><110><110><310><310></box>"
    )
    boxes = dedupe_boxes(parse_boxes(answer, 1000, 1000))
    assert len(boxes) == 1
    assert boxes[0].label == "coffee mug"
