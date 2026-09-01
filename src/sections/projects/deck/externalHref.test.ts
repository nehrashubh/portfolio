import { externalHref } from './externalHref';

describe('externalHref', () => {
  it('passes http and https through, trimmed', () => {
    expect(externalHref('https://example.com/a')).toBe('https://example.com/a');
    expect(externalHref('  http://example.com  ')).toBe('http://example.com');
  });

  it('refuses anything that is not http(s), so a bad data file cannot inject script', () => {
    expect(externalHref('javascript:alert(1)')).toBeUndefined();
    expect(externalHref('data:text/html,<script>')).toBeUndefined();
    expect(externalHref('/relative')).toBeUndefined();
    expect(externalHref('')).toBeUndefined();
  });
});
