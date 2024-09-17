export async function fetchGetSection(type): Promise<any> {
  try {
    const response = await fetch(`http://localhost:3000/section/${type}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Error: ${response.status} ${response.statusText} while fetching room's from ${response.url}`
      );
    }
    const payload = await response.json();
    return payload;
  } catch (error) {
    console.error('Failed to load room:', error);
    throw new Error('Failed to load room. Please try again later.');
  }
}
