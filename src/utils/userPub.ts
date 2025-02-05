
if (event.kind === 0) {
  const content = JSON.parse(event.content || '{}');
  const metadata = {
    name: content.name || 'Anonymous',
    picture: content.picture || '/default-profile.jpg'
  };

