(() => {
    const icons = {
        "🌏": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
        "🤖": '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M9 3h6M8 12h.01M16 12h.01M8 16h8"/>',
        "📍": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
        "❤️": '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
        "💰": '<path d="M7 7h10l2 13H5L7 7Z"/><path d="M9 7c-1-2 0-4 3-4s4 2 3 4M12 10v7M9.5 12h4.1a1.5 1.5 0 0 1 0 3H10"/>',
        "⏱️": '<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 2v3"/>',
        "🕒": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/>',
        "☀️": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        "🍜": '<path d="M4 11h16c0 5-3 8-8 8s-8-3-8-8ZM7 22h10M8 3l8 5M12 2l6 6"/>',
        "🏛️": '<path d="m3 9 9-6 9 6M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 21h18"/>',
        "🌿": '<path d="M20 4C12 4 6 8 6 15c0 3 2 5 5 5 7 0 9-8 9-16Z"/><path d="M4 21c3-6 8-10 14-14"/>',
        "📱": '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 18h2"/>',
        "✨": '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z"/>',
        "🔍": '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
        "🤔": '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M9 16c1.5-1 4.5-1 6 0M9 7c1-1 2-1 3-.5"/>',
        "🗺️": '<path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z"/><path d="M8 3v15M16 6v15"/>',
        "🛍️": '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
        "🎢": '<path d="M3 19c3-9 6-12 9-8s5 5 9-5M4 19h16M7 15v4M12 13v6M17 11v8"/>',
        "🎯": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        "🏙️": '<path d="M3 21V8h7v13M10 21V3h11v18M6 11h1M6 15h1M14 7h2M18 7h1M14 11h2M18 11h1M14 15h2M18 15h1M2 21h20"/>',
        "🌤️": '<path d="M7 9a5 5 0 0 1 9-3M14 2v2M20 8h2M18.5 3.5 17 5"/><path d="M18 18H7a4 4 0 1 1 1-7.9A5 5 0 0 1 18 11a3.5 3.5 0 0 1 0 7Z"/>',
        "🚌": '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M7 7h10M7 11h10M7 18v2M17 18v2M7.5 15h.01M16.5 15h.01"/>',
        "🚶": '<circle cx="12" cy="4" r="2"/><path d="m10 22 1-7-3-3 2-5 4 3 3 1M14 22l-2-7"/>',
        "🚗": '<path d="m5 11 2-5h10l2 5M3 12h18v6H3v-6ZM6 18v2M18 18v2M6.5 15h.01M17.5 15h.01"/>',
        "🚲": '<circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><path d="m6 17 4-7 4 7h-4l-2-4M14 7h3"/>',
        "🍽️": '<circle cx="12" cy="13" r="7"/><path d="M4 3v5M2 3v3a2 2 0 0 0 4 0V3M4 8v13M20 3c-2 2-2 6 0 8v10"/>',
        "⭐": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
        "⚠️": '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
        "⚠": '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
        "⏰": '<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M5 4 2 2M19 4l-2 2M9 2h6"/>',
        "🕑": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l-3 2"/>',
        "🧗": '<path d="m3 20 6-10 3 5 2-3 7 8H3Z"/><circle cx="14" cy="5" r="2"/><path d="m13 8-2 3 3 2 2 4"/>',
        "🆓": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15V9h4M7 12h3M13 15V9h4M13 12h3"/>',
        "💵": '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9H6v1M17 15h1v-1"/>',
        "💎": '<path d="m4 9 4-5h8l4 5-8 11L4 9Z"/><path d="M4 9h16M8 4l4 5 4-5M12 9v11"/>',
        "☕": '<path d="M4 8h13v6a6 6 0 0 1-6 6H9a5 5 0 0 1-5-5V8ZM17 10h2a2 2 0 0 1 0 4h-2M7 4v2M11 3v3M15 4v2"/>',
        "🧭": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
        "♥": '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>'
    };

    const emojiPattern = new RegExp(Object.keys(icons).join("|"), "g");

    function makeIcon(emoji) {
        const wrapper = document.createElement("span");
        wrapper.className = "ui-icon";
        wrapper.setAttribute("aria-hidden", "true");
        wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[emoji]}</svg>`;
        return wrapper;
    }

    function replaceTextNode(node) {
        if (!node.nodeValue || !emojiPattern.test(node.nodeValue)) return;
        emojiPattern.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let cursor = 0;

        for (const match of node.nodeValue.matchAll(emojiPattern)) {
            fragment.append(node.nodeValue.slice(cursor, match.index));
            fragment.append(makeIcon(match[0]));
            cursor = match.index + match[0].length;
        }

        fragment.append(node.nodeValue.slice(cursor));
        node.replaceWith(fragment);
    }

    function scan(root) {
        if (root.nodeType === Node.TEXT_NODE) {
            replaceTextNode(root);
            return;
        }
        if (!(root instanceof Element || root instanceof Document)) return;
        if (root instanceof Element && root.closest("option, script, style")) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
            const parent = walker.currentNode.parentElement;
            if (parent && !parent.closest("option, script, style")) {
                nodes.push(walker.currentNode);
            }
        }
        nodes.forEach(replaceTextNode);
    }

    document.addEventListener("DOMContentLoaded", () => {
        scan(document);
        new MutationObserver(mutations => {
            mutations.forEach(mutation => mutation.addedNodes.forEach(scan));
        }).observe(document.body, { childList: true, subtree: true });
    });
})();
