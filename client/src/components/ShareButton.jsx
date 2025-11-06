export default function ShareButton({ simulation }) {
  const shareToLinkedIn = () => {
    const text = `I just watched 3 AI newsrooms debate "${simulation.topic}"! 🤖📰

📰 ${simulation.progressive?.headline || 'Progressive perspective'}
📰 ${simulation.conservative?.headline || 'Conservative perspective'}
📰 ${simulation.tech?.headline || 'Tech perspective'}

Each AI editor brought a completely different perspective.

Try it yourself: ${window.location.origin}

#AI #Journalism #AgenticAI #FutureOfMedia`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=600');

    // Copy text to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Post text copied to clipboard! Paste it in LinkedIn.');
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={shareToLinkedIn}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Share on LinkedIn
      </button>

      <button
        onClick={copyLink}
        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors"
      >
        Copy Link
      </button>
    </div>
  );
}
