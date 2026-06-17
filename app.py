import os
import re
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ns = {'atom': 'http://www.w3.org/2005/Atom'}

# Simple In-Memory Cache
cache = {
    'data': None,
    'last_updated': 0
}
CACHE_DURATION = 1800  # 30 minutes cache

def strip_html_tags(html_str):
    """Strips HTML tags to get plain text, preserving spacing."""
    # Remove HTML tags
    clean = re.compile('<.*?>')
    text = re.sub(clean, ' ', html_str)
    # Replace multiple spaces/newlines with single spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fix_relative_links(html):
    """Converts relative links to absolute Google Cloud documentation links."""
    # If href starts with "/" and not "//"
    return re.sub(r'href="/(?=[^/])', 'href="https://cloud.google.com/', html)

def parse_content_html(html, date_str, base_link):
    """
    Parses the HTML inside Atom entry's CDATA.
    Splits content by <h3> headers to separate different release note items (e.g., Feature, Issue).
    """
    # Pattern to find <h3>Category</h3> followed by everything until the next <h3> or end of string
    pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL | re.IGNORECASE)
    matches = list(pattern.finditer(html))
    
    parsed_updates = []
    
    if not matches:
        # If there are no <h3> headings, treat the entire block as one "General" update
        text_only = strip_html_tags(html)
        # Avoid empty content
        if html.strip():
            parsed_updates.append({
                'type': 'General',
                'content': fix_relative_links(html.strip()),
                'text_only': text_only,
                'id': f"{date_str.replace(' ', '_').replace(',', '')}_general"
            })
        return parsed_updates
        
    for idx, match in enumerate(matches):
        update_type = match.group(1).strip()
        update_content = match.group(2).strip()
        
        # Unique ID for UI selection & actions
        safe_date = date_str.replace(' ', '_').replace(',', '')
        safe_type = update_type.lower().replace(' ', '_')
        update_id = f"{safe_date}_{safe_type}_{idx}"
        
        # Clean html and text
        fixed_html = fix_relative_links(update_content)
        text_only = strip_html_tags(fixed_html)
        
        parsed_updates.append({
            'type': update_type,
            'content': fixed_html,
            'text_only': text_only,
            'id': update_id
        })
        
    return parsed_updates

def parse_feed():
    """Fetches and parses the XML feed from Google Cloud."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        
        parsed_entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            date_str = title.text.strip() if title is not None else "Unknown Date"
            
            updated_elem = entry.find('atom:updated', ns)
            updated_time = updated_elem.text.strip() if updated_elem is not None else ""
            
            link_elem = entry.find('atom:link[@rel="alternate"]', ns)
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ''
            
            updates = parse_content_html(content_html, date_str, link)
            
            # Extract date components for better frontend filtering
            # Example format: "June 16, 2026"
            month_year = ""
            try:
                # Find month and year from string like "June 16, 2026"
                parts = date_str.split(',')
                if len(parts) == 2:
                    month_day = parts[0].strip().split(' ')
                    year = parts[1].strip()
                    if len(month_day) == 2:
                        month_year = f"{month_day[0]} {year}"
            except Exception:
                pass
            
            parsed_entries.append({
                'date': date_str,
                'month_year': month_year,
                'updated_time': updated_time,
                'link': link,
                'updates': updates
            })
            
        return parsed_entries
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    # Check if cache is valid
    if force_refresh or not cache['data'] or (now - cache['last_updated']) > CACHE_DURATION:
        notes = parse_feed()
        if notes is not None:
            cache['data'] = notes
            cache['last_updated'] = now
            status = "fresh"
        else:
            # If fetch failed but we have cached data, return cached data as fallback
            if cache['data']:
                status = "cached_fallback"
            else:
                return jsonify({'error': 'Failed to fetch release notes and no cache available'}), 500
    else:
        status = "cached"
        
    return jsonify({
        'status': status,
        'last_updated': cache['last_updated'],
        'data': cache['data']
    })

if __name__ == '__main__':
    # Bind to all interfaces to allow local network access if needed
    app.run(host='0.0.0.0', port=5000, debug=True)
