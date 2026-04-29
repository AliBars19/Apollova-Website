
export function parseFilename(filename: string): { title: string; artist: string } {
  // Remove the file extension (.mp4, .mov, .avi, etc.)
  const nameWithoutExtension = filename.replace(/\.(mp4|mov|avi|mkv)$/i, '');
  
  // Split by " - " to separate title and artist
  const parts = nameWithoutExtension.split(' - ');
  
  // Extract title and artist
  const title = parts[0]?.trim() || 'Unknown Title';
  const artist = parts[1]?.trim() || 'Unknown Artist';
  
  return { title, artist };
}

const HASHTAG_POOLS: string[][] = [
  ['#fyp', '#foryou', '#music', '#lyrics', '#lyricvideo'],
  ['#fyp', '#viral', '#musicvideo', '#nowplaying', '#lyrics'],
  ['#foryoupage', '#music', '#lyricvideo', '#trending', '#fyp'],
  ['#fyp', '#foryou', '#lyrics', '#vibes', '#musiclovers'],
  ['#fyp', '#trending', '#music', '#lyricsong', '#explore'],
  ['#foryou', '#fyp', '#musicvideo', '#lyrics', '#hitsong'],
];

export function generateCaption(title: string, artist: string): string {
  const titleHashtag = title.replace(/[^a-zA-Z0-9]/g, '');
  const artistHashtag = artist.replace(/[^a-zA-Z0-9]/g, '');

  // Pick a random hashtag set — different every upload
  const pool = HASHTAG_POOLS[Math.floor(Math.random() * HASHTAG_POOLS.length)];
  const hashtags = pool.join(' ');

  return `${title} - ${artist} ${hashtags} #${artistHashtag} #${titleHashtag}`;
}