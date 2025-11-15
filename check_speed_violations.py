"""
Script to check speed limit violations in metadata files using cached OSM speed limits.
Exports violations to JSON files (one per metadata file).
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from osm_speed_limits_cache import OSMSpeedLimitsCache

def parse_speed_limit(maxspeed_str: str) -> Optional[float]:
    """
    Parse speed limit string to numeric value.
    Handles formats like "50", "50 km/h", "RS:urban" (defaults to 50), etc.
    
    Args:
        maxspeed_str: Speed limit string from OSM
        
    Returns:
        Numeric speed limit in km/h, or None if cannot be parsed
    """
    if not maxspeed_str or not isinstance(maxspeed_str, str):
        return None
    
    # Remove whitespace
    maxspeed_str = maxspeed_str.strip()
    
    # Handle common text-based speed limits
    text_limits = {
        'RS:urban': 50,  # Serbia urban default
        'RS:rural': 80,  # Serbia rural default
        'RS:trunk': 100,  # Serbia trunk default
        'RS:motorway': 120,  # Serbia motorway default
        'urban': 50,
        'rural': 80,
        'trunk': 100,
        'motorway': 120,
        'none': None,
        'walk': 5,
    }
    
    if maxspeed_str in text_limits:
        return text_limits[maxspeed_str]
    
    # Try to extract numeric value
    # Match patterns like "50", "50 km/h", "50km/h", "50 mph" (convert to km/h)
    numeric_match = re.search(r'(\d+(?:\.\d+)?)', maxspeed_str)
    if numeric_match:
        value = float(numeric_match.group(1))
        
        # Check if it's in mph (convert to km/h)
        if 'mph' in maxspeed_str.lower():
            value = value * 1.60934
        
        return value
    
    return None

def find_speed_limit_for_coordinate(cache: OSMSpeedLimitsCache, 
                                    latitude: float, 
                                    longitude: float,
                                    precision: int = 6) -> Optional[Dict[str, Any]]:
    """
    Find speed limit for a coordinate, trying exact match first, then nearest.
    
    Args:
        cache: OSMSpeedLimitsCache instance
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        precision: Decimal precision for exact matching
        
    Returns:
        Speed limit dictionary with maxspeed value, or None
    """
    # Try exact match first
    speed_limits = cache.get_speed_limit(latitude, longitude, precision)
    
    if speed_limits:
        # Return the first speed limit (or could return all)
        # For now, we'll use the first one and parse it
        for limit in speed_limits:
            maxspeed = parse_speed_limit(limit.get('maxspeed'))
            if maxspeed is not None:
                return {
                    'maxspeed': maxspeed,
                    'maxspeed_raw': limit.get('maxspeed'),
                    'highway': limit.get('highway', 'unknown'),
                    'name': limit.get('name', ''),
                    'way_id': limit.get('way_id')
                }
    
    # Try nearest match
    nearest = cache.get_speed_limit_nearest(latitude, longitude, max_distance=0.001)
    if nearest:
        for limit in nearest:
            maxspeed = parse_speed_limit(limit.get('maxspeed'))
            if maxspeed is not None:
                return {
                    'maxspeed': maxspeed,
                    'maxspeed_raw': limit.get('maxspeed'),
                    'highway': limit.get('highway', 'unknown'),
                    'name': limit.get('name', ''),
                    'way_id': limit.get('way_id')
                }
    
    return None
start_global = 0
end_global = 0

def check_metadata_file_violations(metadata_file: Path, 
                                  cache: OSMSpeedLimitsCache,
                                  violation_threshold: float = 0.0) -> List[Dict[str, Any]]:
    """
    Check speed limit violations in a metadata file.

    For each continuous period where the speed limit is exceeded,
    keep only the entry with the maximal over_speed.
    """
    global start_global, end_global

    violations = []
    
    print(f"Processing {metadata_file.name}...")
    
    # Cache for coordinate lookups to avoid repeated API calls
    coordinate_cache: Dict[str, Optional[Dict[str, Any]] ] = {}
    
    try:
        with open(metadata_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'dynamicMetadata' not in data:
            print(f"  Warning: No 'dynamicMetadata' found in {metadata_file.name}")
            return violations
        
        entry_count = 0

        # Track the "best" violation in the current continuous run
        current_run_best: Optional[Dict[str, Any]] = None

        for entry in data['dynamicMetadata']:
            # Init start_global / end_global
            ts_us = entry.get('timestampUs', 0)
            if start_global == 0:
                start_global = ts_us
            end_global = ts_us

            # Check if entry has required fields
            if 'latitude' not in entry or 'longitude' not in entry:
                # If run is active and we lose info, flush it
                if current_run_best is not None:
                    violations.append(current_run_best)
                    current_run_best = None
                continue
            
            if 'displaySpeed' not in entry:
                if current_run_best is not None:
                    violations.append(current_run_best)
                    current_run_best = None
                continue
            
            entry_count += 1
            lat = entry['latitude']
            lon = entry['longitude']
            speed = entry.get('displaySpeed', 0)
            
            # Skip if speed is 0 or negative (not moving)
            if speed <= 0:
                if current_run_best is not None:
                    violations.append(current_run_best)
                    current_run_best = None
                continue
            
            # Create cache key for coordinate
            coord_key = f"{round(lat, 6):.6f},{round(lon, 6):.6f}"
            
            # Check cache first
            if coord_key not in coordinate_cache:
                speed_limit_info = find_speed_limit_for_coordinate(cache, lat, lon)
                coordinate_cache[coord_key] = speed_limit_info
            else:
                speed_limit_info = coordinate_cache[coord_key]
            
            if not speed_limit_info:
                # No speed limit: end current run if there is one
                if current_run_best is not None:
                    violations.append(current_run_best)
                    current_run_best = None
                continue
            
            maxspeed = speed_limit_info['maxspeed']

            # Is this entry over the limit?
            if speed > maxspeed + violation_threshold:
                over_speed = speed - maxspeed

                # Build violation record for this entry
                violation = {
                    'timestamp_us': ts_us,
                    'timestamp_s': ts_us / 1_000_000 if ts_us else 0,
                    'latitude': lat,
                    'longitude': lon,
                    'speed_kmh': speed,
                    'speed_limit_kmh': maxspeed,
                    'speed_limit_raw': speed_limit_info['maxspeed_raw'],
                    'over_speed': over_speed,
                    'over_speed_percent': ((over_speed) / maxspeed * 100) if maxspeed > 0 else 0,
                    'highway_type': speed_limit_info['highway'],
                    'road_name': speed_limit_info['name'],
                    'way_id': speed_limit_info['way_id'],
                    'altitude': entry.get('altitude'),
                    'compass_angle': entry.get('compassAngle'),
                }

                # Update current run's best violation
                if current_run_best is None or violation['over_speed'] > current_run_best['over_speed']:
                    current_run_best = violation

            else:
                # We are back under the limit: if a run was active, close it
                if current_run_best is not None:
                    violations.append(current_run_best)
                    current_run_best = None

        # End of loop: if a run is still active, flush it
        if current_run_best is not None:
            violations.append(current_run_best)
            current_run_best = None
        
        print(f"  Processed {entry_count} entries, found {len(violations)} violation segments")
        
    except Exception as e:
        print(f"  Error processing {metadata_file.name}: {e}")
    
    return violations

def export_violations_to_json(violations: List[Dict[str, Any]], 
                              output_file: Path,
                              file_id: str):
    """
    Export violations to JSON file with specified structure.
    
    Args:
        violations: List of violation dictionaries
        output_file: Path to output JSON file
        file_id: ID for the metadata file
    """
    # Sort violations by timestamp to get start_time and end_time
    sorted_violations = sorted(violations, key=lambda x: x.get('timestamp_us', 0)) if violations else []
    
    # Get start_time and end_time from timestamps
    start_time = 0
    end_time = end_global / 1_000_000
    
    # Create timeline events
    list_of_timeline_events = []
    for violation in sorted_violations:
        event = {
            'timestamp': violation.get('timestamp_us', 0) / 1_000_000,  # Convert to seconds
            'latitude': violation.get('latitude'),
            'longitude': violation.get('longitude'),
            'speed_limit': violation.get('speed_limit_kmh'),
            'current_speed': violation.get('speed_kmh'),
            'detected_violation': 3
        }
        list_of_timeline_events.append(event)
    
    # Create the JSON structure
    output_data = {
        'id': file_id,
        'start_time': start_time,
        'end_time': end_time,
        'score': 0,
        'list_of_timeline_events': list_of_timeline_events
    }
    
    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    if violations:
        print(f"  Exported {len(violations)} violations to {output_file.name}")
    else:
        print(f"  Exported 0 violations to {output_file.name} (empty timeline)")

def main():
    """Main function to check speed violations and export to JSON."""
    metadata_dir = Path("test_metadata")
    output_dir = Path("output_json")
    cache_file = "osm_speed_limits_cache.json"
    violation_threshold = 10.0  # Consider any speed over limit as violation
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)
    
    print("=" * 60)
    print("Speed Limit Violation Checker")
    print("=" * 60)
    
    # Load speed limits cache
    print("\nLoading speed limits cache...")
    try:
        cache = OSMSpeedLimitsCache(cache_file)
    except FileNotFoundError:
        print(f"Error: Cache file not found: {cache_file}")
        print("Please run download_osm_speed_limits.py first to create the cache.")
        return
    
    # Process each metadata file (exclude violation JSON files)
    print("\nProcessing metadata files...")
    all_json_files = list(metadata_dir.glob("*.json"))
    metadata_files = [f for f in all_json_files if not f.name.endswith("_violations.json")]
    
    if not metadata_files:
        print(f"No JSON files found in {metadata_dir}")
        return
    
    total_violations = 0
    
    for metadata_file in metadata_files:
        # Check violations
        violations = check_metadata_file_violations(
            metadata_file, 
            cache, 
            violation_threshold
        )
        
        # Export to JSON in output_json folder (even if no violations, create empty structure)
        output_file = output_dir / f"{metadata_file.stem}_violations.json"
        file_id = metadata_file.stem  # Use filename without extension as ID
        export_violations_to_json(violations, output_file, file_id)
        
        if violations:
            total_violations += len(violations)
    
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  - Processed {len(metadata_files)} metadata files")
    print(f"  - Total violations found: {total_violations}")
    print(f"  - Output directory: {output_dir}")
    print("=" * 60)

if __name__ == "__main__":
    main()

