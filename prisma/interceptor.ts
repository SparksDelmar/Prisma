const originalFetch = window.fetch;

const applyFetch = (fn: typeof window.fetch) => {
  try {
    Object.defineProperty(window, 'fetch', {
      value: fn,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (e) {
    try {
      (window as any).fetch = fn;
    } catch (err) {
      console.error("[Prisma] Critical: Failed to intercept fetch.", err);
    }
  }
};

export const setInterceptorUrl = (baseUrl: string | null) => {
  if (!baseUrl) {
    applyFetch(originalFetch);
    return;
  }

  let normalizedBase = baseUrl.trim();
  try {
    new URL(normalizedBase);
  } catch (e) {
    console.warn("[Prisma] Invalid Base URL provided:", normalizedBase);
    return;
  }

  if (normalizedBase.endsWith('/')) {
    normalizedBase = normalizedBase.slice(0, -1);
  }

  const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString: string;
    
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else {
      urlString = input.url;
    }

    const defaultHost = 'generativelanguage.googleapis.com';

    if (urlString.includes(defaultHost)) {
      try {
        const url = new URL(urlString);
        const proxy = new URL(normalizedBase);
        
        url.protocol = proxy.protocol;
        url.host = proxy.host;
        
        if (proxy.pathname !== '/') {
            const cleanPath = proxy.pathname.endsWith('/') ? proxy.pathname.slice(0, -1) : proxy.pathname;
            url.pathname = cleanPath + url.pathname;
        }

        const newUrl = url.toString();

        if (input instanceof Request) {
          const requestData: RequestInit = {
            method: input.method,
            headers: input.headers,
            body: input.body,
            mode: input.mode,
            credentials: input.credentials,
            cache: input.cache,
            redirect: input.redirect,
            referrer: input.referrer,
            integrity: input.integrity,
          };
          
          const mergedInit = { ...requestData, ...init };
          return originalFetch(new URL(newUrl), mergedInit);
        }
        
        return originalFetch(newUrl, init);
      } catch (e) {
        console.error("[Prisma Interceptor] Failed to redirect request:", e);
      }
    }

    return originalFetch(input, init);
  };

  applyFetch(interceptedFetch);
};
