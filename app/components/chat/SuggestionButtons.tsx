import { ArrowUp } from '@phosphor-icons/react';

interface SuggestionButtonsProps {
  chatStarted: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export const SuggestionButtons = ({ chatStarted, onSuggestionClick }: SuggestionButtonsProps) => {
  if (chatStarted) {
    return null;
  }

  const suggestions = [
    {
      title: 'Build a Slack clone',
      prompt:
        'Build a Slack clone with real-time messaging, channels, direct messages, emoji reactions, and file sharing capabilities',
    },
    {
      title: 'Build a Todo app',
      prompt:
        'Build a Todo app with task categories, due dates, priority levels, recurring tasks, and progress tracking',
    },
    {
      title: 'Build a Bluesky clone',
      prompt:
        'Build a Bluesky clone with a feed of posts, user profiles, following system, post likes and reposts, and hashtag support',
    },
  ];

  return (
    <div id="suggestions" className="flex flex-col justify-center items-center">
      <div className="flex gap-6">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            onClick={() => onSuggestionClick?.(suggestion.prompt)}
            className="flex gap-1 items-center rounded-full px-3 py-1 border bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
          >
            <ArrowUp className="size-4" />
            {suggestion.title}
          </button>
        ))}
      </div>
    </div>
  );
};
