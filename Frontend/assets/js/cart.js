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
    if (!product_id || product_id === 'undefined') return;
    let item = cart.find(item => item.product_id == product_id);
    if (item) {
        item.quantity += 1;
        cartQty += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartQty', cartQty);
        updateCartQty();
        calculateTotal();
        // Update DOM for this cart item if present
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`);
        if (qty) {
            let newQty = Number(qty.innerText) + 1;
            qty.innerHTML = newQty;
            let removeBtn = document.querySelector(`[id='${product_id}'] .removeItem`);
            if (removeBtn) removeBtn.setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`);
            let price = document.querySelector(`[id='${product_id}'] .price`);
            let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`);
            if (price && totalPrice) {
                let convertedPrice = price.innerText.replace("PKR ", "");
                totalPrice.innerHTML = "PKR " + (Number(convertedPrice) * Number(newQty));
            }
        }
        updateCartDisplay();
    }
}

function decrease_quantity(product_id) {
    if (!product_id || product_id === 'undefined') return;
    let itemIndex = cart.findIndex(item => item.product_id == product_id);
    if (itemIndex > -1) {
        let item = cart[itemIndex];
        if (item.quantity > 1) {
            item.quantity -= 1;
            cartQty -= 1;
        } else {
            cartQty -= 1;
            cart.splice(itemIndex, 1); // Remove item if quantity is 1
            setTimeout(() => {
                let cartItemDiv = document.querySelector(`[id='${product_id}']`);
                if (cartItemDiv) cartItemDiv.remove();
            }, 100);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartQty', cartQty);
        updateCartQty();
        calculateTotal();
        // Update DOM for this cart item if present
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`);
        if (qty) {
            let newQty = Number(qty.innerText) - 1;
            qty.innerHTML = newQty;
            let removeBtn = document.querySelector(`[id='${product_id}'] .removeItem`);
            if (removeBtn) removeBtn.setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`);
            let price = document.querySelector(`[id='${product_id}'] .price`);
            let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`);
            if (price && totalPrice) {
                let convertedPrice = price.innerText.replace("PKR ", "");
                totalPrice.innerHTML = "PKR " + (Number(convertedPrice) * Number(newQty));
            }
        }
        updateCartDisplay();
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
    // If products are loaded, re-render cart instantly
    if (typeof window.products !== 'undefined' && window.products.length) {
        if (typeof renderCart === 'function') {
            renderCart(window.products);
        }
    } else {
        // Fallback: reload the page to fetch products and render
        if (window.location.href.indexOf("cart") > -1) {
            window.location.reload();
        }
    }
}

