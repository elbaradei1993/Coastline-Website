#!/usr/bin/env python3
"""Fix encoding issues in HTML files - replace non-ASCII & mojibake with HTML entities."""

import os

REPLACEMENTS = [
    # Real Unicode chars → HTML entities (in case any survived)
    ('\u2013', '&ndash;'),   # en-dash
    ('\u2014', '&mdash;'),   # em-dash
    ('\u2018', '&lsquo;'),   # left single quote
    ('\u2019', '&rsquo;'),   # right single quote
    ('\u201C', '&ldquo;'),   # left double quote
    ('\u201D', '&rdquo;'),   # right double quote
    ('\u2026', '&hellip;'),  # ellipsis
    ('\u00A0', '&nbsp;'),    # non-breaking space
    ('\u00E9', '&eacute;'),  # é
    ('\u00E8', '&egrave;'),  # è
    ('\u00EA', '&ecirc;'),   # ê
    ('\u00E0', '&agrave;'),  # à
    ('\u00E2', '&acirc;'),   # â
    ('\u00F4', '&ocirc;'),   # ô
    ('\u00FB', '&ucirc;'),   # û
    ('\u00FC', '&uuml;'),    # ü
    ('\u00E7', '&ccedil;'),  # ç
    ('\u00AE', '&reg;'),     # ®
    ('\u00A9', '&copy;'),    # ©
    ('\u20AC', '&euro;'),    # €
]

files = ['training.html', 'website/training.html', 'training-schedule.html', 'website/training-schedule.html']

for fname in files:
    if not os.path.exists(fname):
        print(f'SKIP (not found): {fname}')
        continue
    
    raw = open(fname, 'rb').read()
    
    # Try UTF-8 first
    try:
        content = raw.decode('utf-8')
        encoding_used = 'utf-8'
    except Exception:
        content = raw.decode('latin-1')
        encoding_used = 'latin-1'
    
    original = content
    
    for char, entity in REPLACEMENTS:
        content = content.replace(char, entity)
    
    changed = sum(1 for a, b in zip(original, content) if a != b)
    
    # Save as pure ASCII + entities (safest)
    with open(fname, 'w', encoding='ascii', errors='xmlcharrefreplace') as f:
        f.write(content)
    
    print(f'Fixed {fname} ({encoding_used}, ~{changed} chars changed)')

print('Done.')
