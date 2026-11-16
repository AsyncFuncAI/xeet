/** Resolve any of the five platforms through the hosted public-post service. */
export async function resolvePublicPost(url, { origin = 'https://xeet.sharenow.today', signal } = {}) {
  const request = async (path, init = {}) => {
    const response = await fetch(new URL(path, origin), { ...init, signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Lookup failed (${response.status})`);
    return data;
  };
  let data = await request('/api/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  const id = data.job, deadline = Date.now() + 110000;
  while (data.pending) {
    if (Date.now() > deadline) throw new Error('Public-post lookup timed out');
    signal?.throwIfAborted();
    await new Promise(resolve => setTimeout(resolve, 1500));
    data = await request('/api/result?id=' + encodeURIComponent(id));
  }
  return data;
}
