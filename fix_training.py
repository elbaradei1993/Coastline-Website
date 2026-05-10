#!/usr/bin/env python3
"""Fix garbled HTML entities (mojibake) in training.html and training-schedule.html"""
import re, html

TARGETS = ['training.html', 'training-schedule.html', 'website/training.html']

# Map HTML entities that are garbled mojibake back to clean ASCII/unicode
# Common pattern: &acirc;&rdquo;&euro; is the HTML-entity form of â€" (em-dash mojibake)
# In CSS comments they appear as decorative dashes — replace the whole garbled comment text
# with a clean version.

def fix_content(text):
    # First decode HTML entities to get the actual characters
    # Then the real characters are sequences like â€™ â€œ â€ etc.
    
    # Replace garbled entity sequences that represent punctuation
    # Pattern: sequences of &acirc;&rdquo;... 
    # These are decorative dividers in CSS comments, simplify them
    
    # Fix garbled CSS comment dividers like:
    # /* &acirc;&rdquo;&euro;&acirc;&rdquo;&euro; Track Filter &acirc;&rdquo;&euro;... */
    # -> /* ── Track Filter ─────────── */
    def fix_comment(m):
        inner = m.group(1)
        # Remove all garbled entity sequences, keep only clean text
        cleaned = re.sub(r'(&acirc;(&rdquo;|&lsquo;|&rsquo;|&ldquo;|&mdash;|&ndash;|&euro;|&tilde;|&iexcl;|&#\d+;)?)+', '─', inner)
        cleaned = cleaned.strip().strip('─').strip()
        # Rebuild clean comment with dashes
        return f'/* ── {cleaned} ──' + '─' * max(0, 40 - len(cleaned)) + ' */'
    
    # Fix CSS comments with garbled chars
    text = re.sub(r'/\*\s*([^*]*?)\s*\*/', fix_comment, text)
    
    # Fix garbled entities in HTML text content:
    # &acirc;&rdquo;&euro; sequences -> clean equivalents
    replacements = [
        # Right single quote (apostrophe): â€™
        (r'&acirc;&euro;&trade;', "'"),
        (r'&Acirc;&euro;&trade;', "'"),
        # Left double quote: â€œ
        (r'&acirc;&euro;&oelig;', '"'),
        # Right double quote: â€
        (r'&acirc;&euro;', '"'),
        # Em dash: â€"
        (r'&acirc;&ndash;', '—'),
        # En dash: â€"
        (r'&acirc;&mdash;', '–'),
        # Ellipsis: â€¦
        (r'&acirc;&hellip;', '...'),
        # BOM entity
        (r'&#65279;', ''),
        # General cleanup of remaining &acirc; followed by misc entities
        (r'&acirc;[&;\w]+;?', "'"),
        # Common remaining: &rdquo;&euro; pairs
        (r'&rdquo;&euro;', '─'),
        # Simple entity sequences that are just dash decorations
        (r'(?:&acirc;|&rdquo;|&euro;|&lsquo;|&rsquo;|&ldquo;|&tilde;|&iexcl;){2,}', ''),
    ]
    
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)
    
    # Remove BOM
    text = text.lstrip('\ufeff')
    text = text.replace('&#65279;', '')
    
    return text

import os
for fname in TARGETS:
    if not os.path.exists(fname):
        print(f'Skip: {fname}')
        continue
    content = open(fname, 'r', encoding='utf-8').read()
    fixed = fix_content(content)
    if fixed != content:
        open(fname, 'w', encoding='utf-8').write(fixed)
        print(f'Fixed: {fname}')
    else:
        print(f'No change: {fname}')
