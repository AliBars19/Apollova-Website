
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

export function generateCaption(title: string, artist: string): string {
  const titleHashtag = title.replace(/[^a-zA-Z0-9]/g, '');
  const artistHashtag = artist.replace(/[^a-zA-Z0-9]/g, '');
  
  const caption = `${title} - ${artist} #fyp #musica #macbook #${titleHashtag} #${artistHashtag}`;
  
  return caption;
}