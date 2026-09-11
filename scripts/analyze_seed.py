import json
from collections import defaultdict

def analyze():
    with open('seed_shows.json', encoding='utf-8') as f:
        shows = json.load(f)
    with open('reference.json', encoding='utf-8') as f:
        ref = json.load(f)

    print("==================================================")
    print("1. CONVENTION: SEASON 0 (TRAILERS)")
    print("==================================================")
    season_0 = [s for s in shows if s.get('season_number') == 0]
    print(f"Total Season 0 rows: {len(season_0)}")
    for s in season_0:
        print(f"  • Show: '{s['show_title']}' | EpID: {s['episode_id']} | Title: '{s['episode_title']}' | Lang: {s['language']} | Artwork: {s.get('artwork_available')} | Status: {s.get('status')}")

    print("\n==================================================")
    print("2. CONVENTION: CONTENT_GROUP COLLAPSING")
    print("==================================================")
    groups = defaultdict(list)
    for s in shows:
        groups[s.get('content_group')].append(s)

    multi = {k: v for k, v in groups.items() if len(v) > 1}
    single = {k: v for k, v in groups.items() if len(v) == 1}
    print(f"Total content groups: {len(groups)}")
    print(f"Multilingual groups (variants to collapse): {len(multi)}")
    print(f"Single variant groups: {len(single)}")
    print("\nSamples of multilingual content_groups:")
    for cg in list(multi.keys())[:4]:
        eps = multi[cg]
        langs = [e['language'] for e in eps]
        ep_ids = [e['episode_id'] for e in eps]
        print(f"  • Content group '{cg}':")
        print(f"    - Variants: {len(eps)} ({', '.join(langs)})")
        print(f"    - Episode IDs: {ep_ids}")
        for e in eps:
            print(f"      [{e['language']}] {e['episode_id']}: '{e['episode_title']}' ({e['duration_seconds']}s)")

    print("\n==================================================")
    print("3. DELIBERATE IMPERFECTIONS IN SEED DATA")
    print("==================================================")
    
    # 1. Sections
    allowed_sections = set(ref['sections'])
    bad_sections = [s for s in shows if s.get('section') not in allowed_sections]
    print(f"\n[A] Missing/Invalid Section ({len(bad_sections)} rows):")
    shows_with_bad_sec = defaultdict(list)
    for s in bad_sections:
        shows_with_bad_sec[s['show_title']].append(s['episode_id'])
    for show_title, ep_ids in shows_with_bad_sec.items():
        print(f"  • Show: '{show_title}' has section=None for all {len(ep_ids)} episodes: {ep_ids}")
        print(f"    Rule violation: 'a published show must have a section'")

    # 2. Artwork
    missing_artwork = [s for s in shows if len(s.get('artwork_available', [])) < 3]
    print(f"\n[B] Missing Artwork (<3 types) ({len(missing_artwork)} rows):")
    for s in missing_artwork:
        avail = s.get('artwork_available', [])
        missing = set(['poster', 'banner', 'thumbnail']) - set(avail)
        print(f"  • EpID {s['episode_id']} ('{s['show_title']}' S{s['season_number']}E{s['episode_number']}):")
        print(f"    Status: {s['status']} | Available: {avail} | Missing: {list(missing)}")
        print(f"    Rule violation: 'an episode can't be published without artwork'")

    # 3. Duplicate (content_group, language)
    seen = {}
    dupes = []
    for s in shows:
        key = (s.get('content_group'), s.get('language'))
        if key in seen:
            dupes.append((s, seen[key]))
        else:
            seen[key] = s
    print(f"\n[C] Duplicate (content_group, language) ({len(dupes)} duplicates):")
    for dup, orig in dupes:
        key = (dup.get('content_group'), dup.get('language'))
        print(f"  • Duplicate key: {key}")
        print(f"    - Original: {orig['episode_id']} title='{orig['episode_title']}'")
        print(f"    - Duplicate: {dup['episode_id']} title='{dup['episode_title']}'")
        print(f"    Rule violation: '(content_group, language) must be unique'")

    # 4. Durations
    bad_dur = [s for s in shows if not s.get('duration_seconds') or s.get('duration_seconds') <= 0]
    print(f"\n[D] Missing/Invalid Durations ({len(bad_dur)} rows):")
    if not bad_dur:
        print("  • None found in seed data (all episodes have positive duration).")

    # 5. Status distribution
    statuses = defaultdict(int)
    for s in shows:
        statuses[s.get('status')] += 1
    print(f"\n[E] Status breakdown across 95 episodes: {dict(statuses)}")

    # 6. Shows overview
    print("\n==================================================")
    print("4. SUMMARY OF ALL 8 SHOWS")
    print("==================================================")
    shows_map = defaultdict(lambda: {'episodes': 0, 'seasons': set(), 'section': None, 'content_groups': set(), 'languages': set()})
    for s in shows:
        st = s['show_title']
        shows_map[st]['episodes'] += 1
        shows_map[st]['seasons'].add(s['season_number'])
        shows_map[st]['section'] = s.get('section')
        shows_map[st]['content_groups'].add(s.get('content_group'))
        shows_map[st]['languages'].add(s.get('language'))

    for title, info in shows_map.items():
        print(f"  • '{title}':")
        print(f"    Section: {info['section']} | Episodes: {info['episodes']} | Seasons: {sorted(list(info['seasons']))}")
        print(f"    Unique content groups: {len(info['content_groups'])} | Languages: {sorted(list(info['languages']))}")

if __name__ == '__main__':
    analyze()
