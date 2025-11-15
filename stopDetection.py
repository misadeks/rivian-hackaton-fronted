#!/usr/bin/env python3
# stop_sign_timestamps.py
# Detect stop signs in an MP4 and output timestamps of frames with detections.
# For each detection, also check car metadata (displaySpeed).

import cv2
import csv
import os
import sys
import json
from ultralytics import YOLO

def detect_stop_signs(
    input_video: str,
    model_path: str,
    metadata_path: str,
    output_csv: str = "stop_sign_timestamps.csv",
    stop_class_name: str = None,   # auto-detect if None
    conf_thresh: float = 0.25,
    iou_thresh: float = 0.45,
    img_size: int = 640,
    device: str = None
):
    if not os.path.isfile(input_video):
        print(f"Video not found: {input_video}")
        sys.exit(1)
    if not os.path.isfile(model_path):
        print(f"Model not found: {model_path}")
        sys.exit(1)
    if not os.path.isfile(metadata_path):
        print(f"Metadata file not found: {metadata_path}")
        sys.exit(1)

    # Load YOLO model
    model = YOLO(model_path)

    # Auto-detect stop sign class name if not provided
    model_classes = model.names
    if stop_class_name is None:
        for cid, cname in model_classes.items():
            if "stop" in cname.lower():
                stop_class_name = cname
                break
        if stop_class_name is None:
            print("❌ No stop sign class found in model.names")
            sys.exit(1)
    print(f"Using stop sign class: {stop_class_name}")

    # Load metadata JSON
    with open(metadata_path) as f:
        metadata = json.load(f)["dynamicMetadata"]

    # Open video
    cap = cv2.VideoCapture(input_video)
    if not cap.isOpened():
        print(f"Failed to open video: {input_video}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_idx = 0

    # Prepare CSV
    with open(output_csv, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["frame_index", "timestampUs", "displaySpeed", "status"])

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Run YOLO inference
            results = model.predict(
                source=frame,
                conf=conf_thresh,
                iou=iou_thresh,
                imgsz=img_size,
                device=device,
                verbose=False
            )

            detected = False
            for r in results:
                if r.boxes is None:
                    continue
                names = r.names if hasattr(r, "names") else model.names
                for b in r.boxes:
                    cls_id = int(b.cls.item())
                    cls_name = names.get(cls_id, str(cls_id)) if isinstance(names, dict) else names[cls_id]
                    if stop_class_name.lower() in cls_name.lower():
                        detected = True
                        break

            if detected:
                # Get metadata for this frame
                if frame_idx < len(metadata):
                    meta_entry = metadata[frame_idx]
                    ts_us = meta_entry["timestampUs"]
                    speed = meta_entry["displaySpeed"]
                    status = "STOPPED" if speed == 0 else "MOVING"
                    writer.writerow([frame_idx, ts_us, speed, status])
                else:
                    # Fallback if metadata shorter than video
                    timestamp_us = int((frame_idx / fps) * 1_000_000) if fps > 0 else int((frame_idx / 25.0) * 1_000_000)
                    writer.writerow([frame_idx, timestamp_us, None, "NO_METADATA"])

            frame_idx += 1

    cap.release()
    print(f"✅ Detections with metadata saved to {output_csv}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Stop sign detection from MP4 using YOLOv8 + car metadata.")
    parser.add_argument("--input", required=True, help="Path to input MP4 file.")
    parser.add_argument("--model", required=True, help="Path to YOLOv8 .pt weights trained on traffic signs.")
    parser.add_argument("--metadata", required=True, help="Path to car metadata JSON file.")
    parser.add_argument("--output-csv", default="stop_sign_timestamps.csv", help="Output CSV file.")
    parser.add_argument("--stop-class-name", default=None, help="Optional: class name for stop signs in the model.")
    parser.add_argument("--conf-thresh", type=float, default=0.25, help="Confidence threshold.")
    parser.add_argument("--iou-thresh", type=float, default=0.45, help="IoU threshold.")
    parser.add_argument("--img-size", type=int, default=640, help="Inference image size.")
    parser.add_argument("--device", default=None, help="Device: 'cpu' or '0' for GPU.")
    args = parser.parse_args()

    detect_stop_signs(
        input_video=args.input,
        model_path=args.model,
        metadata_path=args.metadata,
        output_csv=args.output_csv,
        stop_class_name=args.stop_class_name,
        conf_thresh=args.conf_thresh,
        iou_thresh=args.iou_thresh,
        img_size=args.img_size,
        device=args.device
    )
