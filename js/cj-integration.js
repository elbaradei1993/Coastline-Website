// CJ Dropshipping Automatic Product Rendering
(function () {
    'use strict';

    const CJ_API = {
        baseUrl: 'https://developers.cjdropshipping.com/api2.0/v1',
        accessToken: '0580277abfe24bcc9fccdc3ede57d334',

        async getProducts(count = 16) {
            try {
                const response = await fetch(`${this.baseUrl}/product/listV2?page=1&size=${count}&orderBy=1`, {
                    headers: { 'CJ-Access-Token': this.accessToken }
                });
                return await response.json();
            } catch (e) {
                console.error('CJ API Error:', e);
                return null;
            }
        }
    };

    function renderProductCard(product) {
        const price = product.discountPrice || product.nowPrice || product.sellPrice || '0.00';
        const discount = product.discountPriceRate > 0 ? `<span class="product-badge badge-bestseller">-${product.discountPriceRate}%</span>` : '';
        const shipping = product.addMarkStatus === 1 ? '<span class="product-badge badge-essential">Free Shipping</span>' : '';
        
        return `
            <div class="service-card reveal">
                <img src="${product.bigImage}" alt="${product.nameEn}" class="product-image" loading="lazy">
                <h3>${product.nameEn.substring(0, 55)}${discount}${shipping}</h3>
                <p>$${price} | ${product.threeCategoryName || 'Trending Product'} | ${product.warehouseInventoryNum || 'In Stock'} in stock</p>
                <a href="#" class="btn btn-outline cj-product" data-vid="${product.id}">Order Now →</a>
            </div>
        `;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const products = await CJ_API.getProducts(16);
        
        if (products && products.data && products.data.content && products.data.content[0].productList) {
            const productList = products.data.content[0].productList;
            console.log('✅ CJ Products loaded:', productList.length);
            
            const grid = document.querySelector('#cj-products .services-grid');
            grid.innerHTML = productList.map(renderProductCard).join('');
            
            // Re-initialize scroll animations
            if (typeof initScrollReveal === 'function') initScrollReveal();
            window.dispatchEvent(new Event('scroll'));
        }
    });

})();