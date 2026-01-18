chrome.runtime.onMessage.addListener(
    (
        msg: unknown,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ) => {
        const m = msg as { type?: string };

        if (m?.type === 'QFM_PING') {
            sendResponse({ ok: true, ts: Date.now() });
            return true;
        }
        return false;
});
