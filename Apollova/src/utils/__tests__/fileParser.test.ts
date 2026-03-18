import { describe, it, expect } from 'vitest';
import { parseFilename, generateCaption } from '../fileParser';

describe('parseFilename', () => {
  it('parses "Artist - Title.mp4"', () => {
    const { title, artist } = parseFilename('Ed Sheeran - Shape of You.mp4');
    expect(title).toBe('Ed Sheeran');
    expect(artist).toBe('Shape of You');
  });

  it('returns Unknown Artist for title-only', () => {
    const { title, artist } = parseFilename('SomeTitle.mp4');
    expect(title).toBe('SomeTitle');
    expect(artist).toBe('Unknown Artist');
  });

  it('handles empty string', () => {
    const { title, artist } = parseFilename('');
    expect(title).toBe('Unknown Title');
    expect(artist).toBe('Unknown Artist');
  });

  it('handles multiple dashes — takes second segment only', () => {
    const { title, artist } = parseFilename('A - B - C.mp4');
    expect(title).toBe('A');
    expect(artist).toBe('B');
  });

  it('trims whitespace', () => {
    const { title, artist } = parseFilename('  Artist  -  Title  .mp4');
    expect(title).toBe('Artist');
    expect(artist).toBe('Title');
  });

  it('handles .mov extension', () => {
    const { title, artist } = parseFilename('Artist - Title.mov');
    expect(title).toBe('Artist');
    expect(artist).toBe('Title');
  });

  it('handles .avi extension', () => {
    const { title, artist } = parseFilename('Artist - Title.avi');
    expect(title).toBe('Artist');
    expect(artist).toBe('Title');
  });

  it('handles no extension', () => {
    const { title, artist } = parseFilename('Artist - Title');
    expect(title).toBe('Artist');
    expect(artist).toBe('Title');
  });
});

describe('generateCaption', () => {
  it('includes title and artist', () => {
    const caption = generateCaption('Shape of You', 'Ed Sheeran');
    expect(caption).toContain('Shape of You');
    expect(caption).toContain('Ed Sheeran');
  });

  it('strips special chars in hashtags', () => {
    const caption = generateCaption("Can't Stop", 'RHCP');
    expect(caption).toContain('#CantStop');
    expect(caption).toContain('#RHCP');
  });

  it('handles empty inputs', () => {
    const caption = generateCaption('', '');
    expect(caption).toContain(' - ');
    expect(caption).toContain('#fyp');
  });
});
