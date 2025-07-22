var cart = []
var cartQty = 0
if(localStorage.getItem('cart')){
    cart = JSON.parse(localStorage.getItem('cart'));
  
  }
if(localStorage.getItem('cartQty')){
    cartQty = JSON.parse(localStorage.getItem('cartQty'));
    updateCartQty()
    
  }
setTimeout(() => {
    calculateTotal()
}, 100);

setTimeout(() => {
    if(cartQty==0 && window.location.href.indexOf("cart") > -1){
    
        let emptyCart = document.querySelector(".cartList h3");
      
        emptyCart.style.display = "block"
        
        
        
      }
      else if (cartQty!=0 && window.location.href.indexOf("cart") > -1){
        let emptyCart = document.querySelector(".cartList h3");
      
        emptyCart.style.display = "none"
      }
}, 100);

const add_to_cart = (product_id , e, productQty) => {
    if (!product_id || product_id === 'undefined') {
        alert('Invalid product. Please refresh the page.');
        return;
    }
    cartQty = cartQty + productQty
    updateCartQty()
    console.log(product_id)
    e.stopPropagation(); 
    e.preventDefault(); 
    
   

    let positionThisProductInCart = cart.findIndex((value) => value.product_id == product_id);
    if(cart.length <= 0){
        cart = [{
            product_id: product_id,
            quantity: productQty
        }];
    }else if(positionThisProductInCart < 0){
        cart.push({
            product_id: product_id,
            quantity: productQty
        });
    }else{
        cart[positionThisProductInCart].quantity = cart[positionThisProductInCart].quantity + productQty;
    }
    
   
    localStorage.setItem('cart', JSON.stringify(cart));
    
    localStorage.setItem('cartQty', cartQty);
    console.log(cart)
}

function add_quantity(product_id) {
    let item = cart.find(item => item.product_id == product_id);
    if (item) {
        item.quantity += 1;
        cartQty += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartQty', cartQty);
        updateCartQty();
        calculateTotal();
        updateCartDisplay(); // Update cart UI without reload
    }
}

function decrease_quantity(product_id) {
    let itemIndex = cart.findIndex(item => item.product_id == product_id);
    if (itemIndex > -1) {
        let item = cart[itemIndex];
        if (item.quantity > 1) {
            item.quantity -= 1;
            cartQty -= 1;
        } else {
            cartQty -= 1;
            cart.splice(itemIndex, 1); // Remove item if quantity is 1
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartQty', cartQty);
        updateCartQty();
        calculateTotal();
        updateCartDisplay(); // Update cart UI without reload
    }
}

function calculateTotal() {
    let total = 0;
    if (typeof window.products !== 'undefined') {
        cart.forEach(item => {
            let product = window.products.find(p => p.id == item.product_id);
            if (product) {
                total += (product.discountedPrice || product.price) * item.quantity;
            }
        });
    }
    let totalElem = document.querySelector('.cartTotal');
    if (totalElem) totalElem.innerText = 'Total: PKR ' + total;
}

function updateCartQty() {
    let cartQtyElem = document.querySelector('.cartQty');
    if (cartQtyElem) {
        cartQtyElem.innerText = cartQty;
    }
}

// New: Update cart display after quantity changes
function updateCartDisplay() {
    // This function should re-render the cart items in the DOM.
    // If you use cart_to_html.js for rendering, you can reload the cart page or call its logic here.
    // For now, we'll reload the cart page if on cart page, otherwise do nothing.
    if (window.location.href.indexOf("cart") > -1) {
        // If you have a function to render cart, call it here instead of reload
        window.location.reload();
    }
}

