import cv2
import numpy as np

def region_of_interest(img, vertices):
    mask = np.zeros_like(img)
    cv2.fillPoly(mask, vertices, 255)
    return cv2.bitwise_and(img, mask)

def filter_solid_lines(lines, min_length=150):
    """Keep only long, continuous lines (approx solid lane markings)."""
    filtered = []
    if lines is None:
        return filtered
    for line in lines:
        x1, y1, x2, y2 = line[0]
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        if length >= min_length:
            filtered.append(line)
    return filtered

def detect_left_crossing(frame, frame_idx, detections, car_half_width=50, crossing_margin=10):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    height, width = frame.shape[:2]
    roi_vertices = [(0, height), (width//2, height//2), (width, height)]
    roi = region_of_interest(edges, np.array([roi_vertices], np.int32))

    lines = cv2.HoughLinesP(roi, 1, np.pi/180, 50, minLineLength=100, maxLineGap=50)
    lines = filter_solid_lines(lines, min_length=150)  # keep only solid-like lines

    if lines:
        x_coords = []
        for line in lines:
            x1, _, x2, _ = line[0]
            x_coords.extend([x1, x2])

        car_center = width // 2
        car_left = car_center - car_half_width

        # Left boundary (solid line)
        left_boundary = min(x_coords)

        # Detect partial/full crossing to the left
        if car_left < left_boundary + crossing_margin:
            detections.append(frame_idx)

def main(video_path):
    cap = cv2.VideoCapture(video_path)
    detections = []
    frame_idx = 0
    fps = cap.get(cv2.CAP_PROP_FPS)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        detect_left_crossing(frame, frame_idx, detections)
        frame_idx += 1

    cap.release()

    # Convert frame indices to timestamps
    results = [{"frame": f, "time_sec": round(f / fps, 2)} for f in detections]

    print("Left-side full line crossings detected:")
    for r in results:
        print(r)

    return results

if __name__ == "__main__":
    results = main("testFullLine.mp4")
