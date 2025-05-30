// Cart State
let cart = [];
let cartCounter = document.getElementById('cartCounter');
let cartItemsContainer = document.getElementById('cartItems');
let cartTotalElement = document.getElementById('cartTotal');
let cartSidebar = document.getElementById('cartSidebar');

// Initialize Cart
function initCart() {
    loadCart();
    setupEventListeners();
    updateCartUI();
}

// Load Cart from Local Storage
function loadCart() {
    const savedCart = localStorage.getItem('fluxkart-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save Cart to Local Storage
function saveCart() {
    localStorage.setItem('fluxkart-cart', JSON.stringify(cart));
}

// Event Listeners
function setupEventListeners() {
    // Add to Cart Buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const product = {
                id: this.dataset.id,
                name: this.dataset.name,
                price: parseFloat(this.dataset.price),
                quantity: 1
            };
            addToCart(product);
        });
    });

    // Cart Toggle
    document.querySelector('a[href="#cart"]').addEventListener('click', function(e) {
        e.preventDefault();
        cartSidebar.classList.remove('translate-x-full');
        document.getElementById('cartOverlay').classList.remove('hidden');
    });

    // Close Cart
    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
}

// Cart Functions
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(product);
    }
    
    saveCart();
    updateCartUI();
    showAddedToCartMessage(product.name);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    // Update counter
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = totalItems;
    cartCounter.classList.toggle('hidden', totalItems === 0);

    // Update cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
        cartTotalElement.textContent = '$0.00';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-gray-600">$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div class="flex items-center">
                <span class="font-semibold mr-4">$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-item text-red-500 hover:text-red-700" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            removeFromCart(this.dataset.id);
        });
    });

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

function closeCart() {
    cartSidebar.classList.add('translate-x-full');
    document.getElementById('cartOverlay').classList.add('hidden');
}

function showAddedToCartMessage(productName) {
    const message = document.createElement('div');
    message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
    message.textContent = `Added ${productName} to cart!`;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Initialize when loaded
if (document.readyState !== 'loading') {
    initCart();
}