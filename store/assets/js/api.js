const BASE_URL = 'http://localhost:5000/api';

const api = {
    // Products
    async getProducts(category = '') {
        const url = category ? `${BASE_URL}/products?cat=${category}` : `${BASE_URL}/products`;
        const res = await fetch(url);
        return res.json();
    },

    async getProduct(id) {
        const res = await fetch(`${BASE_URL}/products/${id}`);
        return res.json();
    },

    async createProduct(productData) {
        const res = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });
        return res.json();
    },

    async updateProduct(id, productData) {
        const res = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });
        return res.json();
    },

    async deleteProduct(id) {
        const res = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return res.json();
    },

    // Auth
    async login(email, password) {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async register(name, email, password) {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return res.json();
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    // Cart handling (LocalStorage)
    getCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    },

    addToCart(id, name, price, image_url, quantity = 1) {
        let cart = this.getCart();
        // Handle if first param is an object
        let pid = id;
        let pname = name;
        let pprice = price;
        let pimg = image_url;

        if (typeof id === 'object') {
            pid = id.id;
            pname = id.name;
            pprice = id.price;
            pimg = id.image_url;
        }

        const existing = cart.find(item => item.id === pid);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                id: pid,
                name: pname,
                price: pprice,
                image_url: pimg,
                quantity: quantity
            });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
    },

    updateCartCount() {
        const cart = this.getCart();
        const count = cart.reduce((acc, item) => acc + item.quantity, 0);
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.innerText = count;
    },

    // Orders Management
    async getOrders() {
        const res = await fetch(`${BASE_URL}/orders/all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return res.json();
    },

    async updateOrderStatus(id, status) {
        const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        return res.json();
    }
};
