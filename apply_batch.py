#!/usr/bin/env python3
"""Apply a cleaned batch to varhanici-data.json"""
import json
import sys
import copy

DATA_FILE = '/home/kwart/projects/varhanici/varhanici-data.json'


def main():
    batch_start = int(sys.argv[1])
    batch_file = sys.argv[2]

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    original = copy.deepcopy(data)

    with open(batch_file, 'r', encoding='utf-8') as f:
        batch = json.load(f)
    batch_end = batch_start + len(batch)

    # Apply batch
    for i, entry in enumerate(batch):
        idx = batch_start + i
        # Verify liturgicky_den matches
        if data[idx]['liturgicky_den'] != entry['liturgicky_den']:
            print(f'ERROR: liturgicky_den mismatch at {idx}: '
                  f'{data[idx]["liturgicky_den"]} != {entry["liturgicky_den"]}',
                  file=sys.stderr)
            sys.exit(1)
        data[idx] = entry

    # Validate no other entries changed
    for i in range(len(data)):
        if i < batch_start or i >= batch_end:
            if data[i] != original[i]:
                print(f'ERROR: Entry {i} modified outside batch!', file=sys.stderr)
                sys.exit(1)

    # Validate batch structure
    for i in range(batch_start, batch_end):
        e = data[i]
        assert isinstance(e.get('komentare'), list) and len(e['komentare']) == 1, \
            f'Entry {i}: komentare must be list of length 1'
        assert isinstance(e['komentare'][0], str) and len(e['komentare'][0].strip()) > 0, \
            f'Entry {i}: komentare[0] must be non-empty string'
        assert isinstance(e.get('doporucene_pisne'), list), \
            f'Entry {i}: doporucene_pisne must be list'
        assert all(isinstance(p, str) for p in e['doporucene_pisne']), \
            f'Entry {i}: doporucene_pisne must contain only strings'

    # JSON round-trip check
    json_str = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    json.loads(json_str)  # Verify it parses

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(json_str)

    # Report changes
    for i in range(batch_start, batch_end):
        old_p = set(original[i]['doporucene_pisne'])
        new_p = set(data[i]['doporucene_pisne'])
        added = sorted(new_p - old_p)
        removed = sorted(old_p - new_p)
        print(f"[{i}] {data[i]['liturgicky_den']}: +{len(added)} -{len(removed)}"
              + (f" added:{added}" if added else "")
              + (f" removed:{removed}" if removed else ""))

    print(f"\nBatch {batch_start}–{batch_end - 1} applied successfully.")


if __name__ == '__main__':
    main()
