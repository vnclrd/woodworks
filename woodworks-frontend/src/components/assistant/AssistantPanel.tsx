import { PanelRightOpen, Sparkles, PanelRightClose, RotateCcw, X, Send } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function AssistantPanel({ app }: Props) {
  const { isLargeScreen, isChatOpen, setIsChatOpen, resetChat, chatScrollRef, chatMessages, isAssistantTyping, CHAT_SUGGESTIONS, sendChatMessage, chatInput, setChatInput } = app;
  return (
<>
  {/* Mobile backdrop */}
  {!isLargeScreen && isChatOpen && (
    <div
      className="fixed inset-0 z-40 bg-[#2125298A] transition-opacity duration-300"
      onClick={() => setIsChatOpen(false)}
      aria-hidden="true"
    />
  )}

  {/* AI Assistant Panel with smooth sliding/width transition */}
  <aside
    aria-label="AI assistant"
    role={isLargeScreen ? undefined : 'dialog'}
    aria-modal={isLargeScreen ? undefined : true}
    className={
      isLargeScreen
        ? `flex flex-col shrink-0 min-h-0 bg-[#BF5700] text-white border-l border-black/10 transition-all duration-300 ease-in-out overflow-hidden ${
            isChatOpen ? 'w-80' : 'w-14 items-center'
          }`
        : `fixed inset-y-0 right-0 z-40 flex flex-col w-full max-w-sm bg-[#BF5700] text-white shadow-[-8px_0_16px_#21252933] transition-transform duration-300 ease-in-out ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`
    }
  >
    {isLargeScreen && !isChatOpen ? (
      /* Collapsed State View */
      <div className="flex flex-col items-center gap-2 py-3 w-full">
        <button
          onClick={() => setIsChatOpen(true)}
          title="Open AI assistant"
          aria-label="Open AI assistant"
          className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-[#A34A00] transition-colors cursor-pointer"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center text-white" aria-hidden="true">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>
    ) : (
      /* Expanded State View */
      <div className={`flex flex-col h-full w-80 ${!isLargeScreen ? 'w-full' : ''}`}>
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-white/20">
          <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">AI Assistant</p>
            <span className="inline-block mt-0.5 rounded-sm bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-[#A34A00]">
              Preview
            </span>
          </div>
          <button
            onClick={resetChat}
            title="New chat"
            aria-label="Start a new chat"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[#A34A00] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsChatOpen(false)}
            title={isLargeScreen ? 'Collapse assistant' : 'Close assistant'}
            aria-label={isLargeScreen ? 'Collapse AI assistant' : 'Close AI assistant'}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[#A34A00] transition-colors cursor-pointer"
          >
            {isLargeScreen ? <PanelRightClose className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Messages */}
        <div
          ref={chatScrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-4"
          aria-live="polite"
        >
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              <p
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap wrap-break-words ${
                  msg.role === 'user'
                    ? 'bg-white text-[#212529] rounded-tr-sm'
                    : 'bg-[#A34A00] text-white rounded-tl-sm'
                }`}
              >
                {msg.text}
              </p>
            </div>
          ))}

          {isAssistantTyping && (
            <div className="flex gap-2" role="status" aria-label="The assistant is typing">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-[#A34A00] px-3 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {chatMessages.length === 1 && !isAssistantTyping && (
            <div className="pt-1 space-y-2">
              <p className="text-xs font-semibold">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendChatMessage(suggestion)}
                    className="rounded-full border border-white/60 px-3 py-1.5 text-xs text-left hover:bg-[#A34A00] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-white/20 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage(chatInput);
            }}
            className="flex items-end gap-2 rounded-lg bg-white p-1.5"
          >
            <textarea
              aria-label="Message the AI assistant"
              rows={1}
              placeholder="Ask anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendChatMessage(chatInput);
                }
              }}
              className="flex-1 min-w-0 max-h-32 resize-none bg-transparent px-2 py-2 text-sm text-[#212529] placeholder-[#5C636A] focus:outline-none field-sizing-content"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isAssistantTyping}
              aria-label="Send message"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-[#212529] hover:bg-[#495057] text-white transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="mt-2 text-[11px] leading-4">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    )}
  </aside>
</>
  );
}