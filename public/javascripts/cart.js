// Add-to-cart without a page reload, plus toasts and the header cart badge.
// Forms marked data-add-to-cart still work as plain POSTs if this script fails.
(function () {
    function toastRoot() {
        let root = document.getElementById('toast-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'toast-root';
            root.setAttribute('aria-live', 'polite');
            root.className = 'fixed top-24 right-4 left-4 sm:left-auto z-[70] flex flex-col items-end gap-3 pointer-events-none';
            document.body.appendChild(root);
        }
        return root;
    }

    // Built with textContent only: messages can contain product names typed by the owner.
    function toast(message, opts) {
        opts = opts || {};
        const isError = opts.type === 'error';
        const el = document.createElement('div');
        el.className = 'pointer-events-auto w-full sm:w-80 bg-white rounded-lg shadow-lg border-l-4 px-4 py-3 flex items-center gap-3 transition duration-300 opacity-0 translate-y-[-8px] '
            + (isError ? 'border-red-500' : 'border-green-500');

        const icon = document.createElement('i');
        icon.className = (isError ? 'ri-error-warning-line text-red-500' : 'ri-checkbox-circle-fill text-green-500') + ' text-xl';
        const text = document.createElement('p');
        text.className = 'flex-1 text-sm text-gray-800';
        text.textContent = message;
        el.append(icon, text);

        if (opts.link) {
            const a = document.createElement('a');
            a.href = opts.link.href;
            a.className = 'text-sm font-semibold text-orange-500 hover:underline whitespace-nowrap';
            a.textContent = opts.link.label;
            el.appendChild(a);
        }

        toastRoot().appendChild(el);
        requestAnimationFrame(function () { el.classList.remove('opacity-0', 'translate-y-[-8px]'); });
        setTimeout(function () {
            el.classList.add('opacity-0');
            setTimeout(function () { el.remove(); }, 300);
        }, opts.duration || 3500);
    }
    window.bvToast = toast;

    function pop(el) {
        el.classList.remove('bv-pop');
        void el.offsetWidth; // restart the animation
        el.classList.add('bv-pop');
    }

    function setCartCount(count) {
        const badge = document.getElementById('cart-count');
        if (!badge) return;
        badge.textContent = count;
        badge.classList.toggle('hidden', !count);
        pop(badge);
    }

    document.addEventListener('submit', async function (e) {
        const form = e.target.closest('form[data-add-to-cart]');
        if (!form) return;
        e.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        if (button.disabled) return;
        button.disabled = true;
        form.setAttribute('aria-busy', 'true');

        try {
            const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' } });
            // Logged out / unexpected response: let the normal form flow handle it.
            if (res.redirected || !res.ok) throw new Error('fallback');
            const data = await res.json();

            // Every add-to-cart form for this product (e.g. card + "buy again") flips to "in cart".
            document.querySelectorAll('form[data-add-to-cart][action="' + form.getAttribute('action') + '"]').forEach(function (f) {
                f.dataset.inCart = 'true';
                f.querySelector('button[type="submit"]').setAttribute('aria-label', 'In cart');
            });
            pop(button);
            setCartCount(data.cartCount);
            toast(data.added ? 'Added to your cart' : 'Already in your cart', { link: { href: '/cart', label: 'View cart' } });
        } catch (err) {
            form.submit();
            return;
        } finally {
            button.disabled = false;
            form.removeAttribute('aria-busy');
        }
    });

    // Server-side flash messages rendered as <div hidden data-toast="..." data-toast-type="error">
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-toast]').forEach(function (el) {
            if (el.dataset.toast) toast(el.dataset.toast, { type: el.dataset.toastType });
        });
    });
})();
