# Enhanced Fragrantica Scraper - Advanced Bot Avoidance

## Overview
This enhanced scraper uses sophisticated techniques to avoid bot detection while scraping Fragrantica perfume data. It includes multiple layers of protection against Cloudflare and other anti-bot measures.

## Key Features

### 1. Intelligent Request Throttling
- **Variable delays** based on request frequency (8-40 seconds)
- **Random jitter** to make patterns unpredictable
- **Increasing delays** as more requests are made

### 2. User Agent Rotation
- **Random user agents** for every request
- **Real browser fingerprints** using cloudscraper
- **Multiple browser profiles** (Chrome, Windows, desktop)

### 3. Advanced Cloudflare Bypass
- **Multiple retry strategies** (3 attempts per URL)
- **Different headers** for each attempt
- **Realistic browser headers** with proper referrer

### 4. Robust Error Handling
- **Automatic retries** for failed requests
- **Graceful degradation** when blocked
- **Comprehensive logging** for debugging

## Installation

```bash
pip install cloudscraper fake-useragent requests
```

## Usage

### Basic Command
```bash
python enhanced_fragrantica_scraper.py
```

### Input File
- **File**: `perfumes.csv`
- **Delimiter**: Semicolon (`;`)
- **Structure**: `perfume;url;perfume_name;perfume_link`

### Output File
- **File**: `output_perfumes.csv`
- **Same structure** as input with scraped data filled

## Advanced Configuration

### Customizing Delays
Modify the `_throttle_requests()` method to adjust timing:
```python
# Current settings:
if self.request_count > 20:
    min_delay = 20
    max_delay = 40
elif self.request_count > 10:
    min_delay = 15
    max_delay = 30
else:
    min_delay = 8
    max_delay = 20
```

### Adding Proxies
To use proxies, add them to the proxy list:
```python
def _get_proxy_list(self):
    return [
        'http://user:pass@proxy1.com:8080',
        'http://user:pass@proxy2.com:8080',
        # Add your proxy servers here
    ]
```

### Tor Support (Optional)
For maximum anonymity, install Tor and use the advanced version:
```bash
pip install stem
```

## Monitoring and Debugging

### Log Files
- **scraper.log**: Detailed execution logs
- **debug_fragrantica.html**: HTML of last scraped page

### Progress Tracking
- Progress saved every 5 rows
- Resume capability by running again (will append to existing output)

## Best Practices

1. **Run during off-peak hours** (reduces server load)
2. **Monitor logs** for any blocking issues
3. **Use residential proxies** for large-scale scraping
4. **Respect robots.txt** and rate limits
5. **Test with small batches** first

## Troubleshooting

### Common Issues

1. **429 Too Many Requests**
   - Increase delays in `_throttle_requests()`
   - Add more proxies
   - Wait longer between runs

2. **Cloudflare Challenges**
   - The script automatically retries with different strategies
   - Check `debug_fragrantica.html` for challenge pages

3. **Connection Errors**
   - Ensure stable internet connection
   - Check proxy configurations if using proxies

### Debug Mode
Enable detailed debugging by changing log level:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Performance Notes

- **Expected speed**: 2-4 perfumes per minute
- **Memory usage**: Low (single page processing)
- **Network usage**: Moderate (HTML + image metadata)

## Legal Considerations

- Use for personal/educational purposes only
- Respect Fragrantica's terms of service
- Don't overload their servers
- Consider using their API if available

## Support

Check the log files for detailed error information. For persistent issues:
1. Review the debug HTML file
2. Check network connectivity
3. Verify Cloudflare isn't presenting captchas
4. Consider using the Tor version for complete anonymity