// Shopping Cart System for Amazon Associates
class ShoppingCart {
    constructor() {
        this.cart = this.loadCart();
        this.init();
    }

    loadCart() {
        const saved = localStorage.getItem('coastline_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('coastline_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    }

    addItem(product) {
        const existing = this.cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                image: product.image,
                url: product.url,
                price: product.price || 0,
                asin: product.asin || '',
                quantity: 1
            });
        }
        this.saveCart();
        this.showNotification(`${product.name} added to cart`);
    }

    removeItem(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.saveCart();
        if (window.location.pathname.includes('checkout.html')) {
            this.renderCart();
        }
    }

    updateQuantity(id, delta) {
        const item = this.cart.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveCart();
                this.renderCart();
            }
        }
    }

    getItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            badge.textContent = this.getItemCount();
            badge.style.display = this.getItemCount() > 0 ? 'flex' : 'none';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #4ecdc4;
            color: #000;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    renderCart() {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p style="color: var(--grey-400); margin-bottom: 32px;">Browse our toolkit to find products you need.</p>
                    <a href="toolkit.html" class="btn btn-primary">Browse Products</a>
                </div>
            `;
            return;
        }

        let cartHTML = '<div class="cart-items">';
        
        this.cart.forEach(item => {
            cartHTML += `
                <div class="cart-item reveal">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div>
                        <h4>${item.name}</h4>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="cart.removeItem('${item.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        });

        cartHTML += `</div>
            <div class="cart-summary">
                <div class="summary-row total">
                    <span>Total Items</span>
                    <span>${this.getItemCount()}</span>
                </div>
                <p style="color: var(--grey-400); font-size: 0.9rem; margin-top: 16px;">
                    All items will be added to your Amazon cart. You will be redirected to Amazon to complete your purchase securely.
                </p>
                <button class="btn btn-primary checkout-btn" onclick="cart.checkoutWithAmazon()">
                    Complete Purchase on Amazon →
                </button>
            </div>
        `;

        container.innerHTML = cartHTML;
        
        setTimeout(() => {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
        }, 100);
    }

    checkoutWithAmazon() {
        // Build Amazon cart URL with all items
        // This uses Amazon's official Add to Cart link format
        const asins = this.cart.map(item => item.asin).filter(asin => asin);
        
        if (asins.length > 0) {
            // For multiple ASINs we can use Amazon bulk add
            window.open(`https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=${asins.join('&ASIN.2=')}&Quantity.1=1`, '_blank');
        } else {
            // Fallback: open toolkit page
            window.location.href = 'toolkit.html';
        }

        // Clear cart after checkout
        this.cart = [];
        this.saveCart();
    }

    init() {
        // Add cart icon to navigation
        this.addCartToNav();
        
        // Add Add to Cart buttons to product cards
        this.setupProductButtons();

        // Render cart if on checkout page
        if (window.location.pathname.includes('checkout.html')) {
            this.renderCart();
        }

        this.updateCartBadge();
    }

    addCartToNav() {
        const navLinks = document.getElementById('nav-links');
        if (navLinks && !document.getElementById('cart-nav-item')) {
            const cartItem = document.createElement('li');
            cartItem.id = 'cart-nav-item';
            cartItem.innerHTML = `
                <a href="checkout.html" style="position: relative;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span id="cart-badge" style="position:absolute;top:-8px;right:-8px;background:#4ecdc4;color:#000;width:18px;height:18px;border-radius:50%;font-size:0.7rem;display:none;align-items:center;justify-content:center;font-weight:600;">0</span>
                </a>
            `;
            
            // Insert before Get Started button
            const ctaItem = navLinks.querySelector('.nav-cta').parentElement;
            navLinks.insertBefore(cartItem, ctaItem);
        }
    }

    setupProductButtons() {
        // Only run on toolkit page
        if (!window.location.pathname.includes('toolkit.html')) return;

        document.querySelectorAll('.service-card').forEach(card => {
            const titleElement = card.querySelector('h3');
            let name = '';
            if (titleElement) {
                // Remove span elements properly
                const clone = titleElement.cloneNode(true);
                const badges = clone.querySelectorAll('.product-badge');
                badges.forEach(badge => badge.remove());
                name = clone.textContent.trim();
            }
            const image = card.querySelector('.product-image')?.src;
            const url = card.querySelector('a.btn')?.href;
            
            if (name && image) {
                // Extract ASIN from Amazon URL if available
                let asin = '';
                if (url && url.includes('amzn.to')) {
                    // For shortlinks we'll handle at checkout
                    asin = '';
                } else if (url && url.includes('/dp/')) {
                    asin = url.match(/\/dp\/([A-Z0-9]+)/)?.[1] || '';
                }

                const addBtn = document.createElement('button');
                addBtn.className = 'btn btn-outline';
                addBtn.textContent = 'Add to Cart';
                addBtn.style.marginRight = '8px';
                addBtn.onclick = (e) => {
                    e.preventDefault();
                    this.addItem({
                id: encodeURIComponent(name).replace(/[^a-zA-Z0-9]/g, '_').slice(0,16),
                        name: name,
                        image: image,
                        url: url,
                        asin: asin
                    });
                };

                const existingBtn = card.querySelector('a.btn');
                if (existingBtn) {
                    existingBtn.style.display = 'inline-block';
                    existingBtn.style.marginTop = '8px';
                    existingBtn.parentNode.insertBefore(addBtn, existingBtn);
                }
            }
        });
    }
}

// Initialize cart
let cart;
document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();
});

// Add slide in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
