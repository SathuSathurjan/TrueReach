"""
detector.py — wraps YOLOv8 (Ultralytics, COCO-pretrained) and exposes a
single simple method: detect(frame) -> (people_count, vehicle_count, annotated_frame)
"""

from ultralytics import YOLO

# COCO class IDs this project tracks
PERSON_CLASS = 0
VEHICLE_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


class AudienceDetector:
    def __init__(self, confidence_threshold: float = 0.4, model_path: str = "yolov8n.pt"):
        print(f"Loading YOLOv8 model ({model_path})...")
        self.model = YOLO(model_path)  # auto-downloads on first run
        self.confidence_threshold = confidence_threshold

    def detect(self, frame):
        """
        Runs detection on a single frame.
        Returns (people_count, vehicle_count, annotated_frame).
        """
        results = self.model(frame, verbose=False, conf=self.confidence_threshold)[0]

        people_count = 0
        vehicle_count = 0

        for box in results.boxes:
            class_id = int(box.cls[0])
            if class_id == PERSON_CLASS:
                people_count += 1
            elif class_id in VEHICLE_CLASSES:
                vehicle_count += 1

        annotated_frame = results.plot()
        return people_count, vehicle_count, annotated_frame
