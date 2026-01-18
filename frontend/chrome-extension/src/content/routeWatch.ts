type RouteCallBack = (url: string) => void;

export function watchSpaRoutes(onChange: RouteCallBack) {
    let lastUrl = location.href;

    const notifyIfChanged = () => {
        const current = window.location.href;
        if (current !== lastUrl) {
            lastUrl = current;
            onChange(current);
        }
    };

    const pushState = history.pushState;
    const replaceState = history.replaceState;

    history.pushState = function(this: History, args: any) {
        pushState.apply(this, args);
        notifyIfChanged();
    } as any;

    history.replaceState = function(this: History, args: any) {
        replaceState.apply(this, args);
        notifyIfChanged();
    } as any;

    window.addEventListener('popstate', notifyIfChanged);
    const mo = new MutationObserver(() => notifyIfChanged())

    return () => {
        window.removeEventListener('popstate', notifyIfChanged);
        mo.disconnect();
        history.pushState = pushState;
        history.replaceState = replaceState;
    };
}