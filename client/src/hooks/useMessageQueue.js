import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for smooth, real-time message display
 * Queues incoming messages and displays them one-by-one with smooth transitions
 */
export function useMessageQueue(initialMessages = []) {
  const [displayedMessages, setDisplayedMessages] = useState(initialMessages);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  // Add message to queue
  const enqueueMessage = (message) => {
    setMessageQueue(prev => [...prev, { ...message, id: `${Date.now()}-${Math.random()}` }]);
  };

  // Process queue - display messages one by one
  useEffect(() => {
    if (messageQueue.length === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    const processNext = async () => {
      if (messageQueue.length === 0) {
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      // Get next message
      const [nextMessage, ...remaining] = messageQueue;

      // Add to displayed messages
      setDisplayedMessages(prev => [...prev, nextMessage]);

      // Remove from queue
      setMessageQueue(remaining);

      // Wait before processing next (creates smooth flow)
      const delay = nextMessage.action === 'tool_use' ? 800 : 400;
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, delay);
    };

    processNext();
  }, [messageQueue, messageQueue.length]);

  // Clear all messages
  const clearMessages = () => {
    setDisplayedMessages([]);
    setMessageQueue([]);
  };

  return {
    messages: displayedMessages,
    enqueueMessage,
    clearMessages,
    hasQueuedMessages: messageQueue.length > 0,
    isProcessing
  };
}
