let http = new XMLHttpRequest();
http.open('get', '/assets/productsData/productsData.json', true);
http.send();
http.onload = function(){
   if(this.readyState == 4 && this.status == 200){
    let cartList = document.querySelector(".cartList")
    let cartItem = "" 
      let products = JSON.parse(this.responseText);
      if(cart.length > 0){
        cart.forEach(item => {
            let positionProduct = products.findIndex((value) => value.id == item.product_id);
            let info = products[positionProduct];
            let discount = Math.floor(((info.price - info.discountedPrice) / info.price) * 100);
            cartItem = cartItem + `<div class="cartItem" id="${info.id}">
                        <div class="product-img" style="background-image:url(${info.image});">
                            <span class="discount">-${discount}%</span>
                        </div>
                        <div class="quantityControl">
                            <button class="decrease"  onclick="decrease_quantity(${info.id})">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="increase" onclick="add_quantity(${info.id})">+</button>
                        </div>
                        <p class="price">PKR ${info.discountedPrice}</p>
                        <p class="totalPrice">PKR ${info.discountedPrice * item.quantity}</p>
                        <button onclick="remove_cart(${info.id}, ${item.quantity})" class="removeItem"><span></span></button>
                     </div>`
        })
        cartList.innerHTML = cartItem + "<h3>Empty Cart</h3>"
        // Insert WhatsApp button if not present
      
        if(cartQty==0 && window.location.href.indexOf("cart") > -1){
            let emptyCart = document.querySelector(".cartList h3");
            emptyCart.style.display = "block"
        }
        else if (cartQty!=0 && window.location.href.indexOf("cart") > -1){
            let emptyCart = document.querySelector(".cartList h3");
            emptyCart.style.display = "none"
        }
      }
   }
}


// Function to send cart details to WhatsApp (robust, works from button)
function sendCartToWhatsApp(productsArg) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.length) {
        alert("Your cart is empty!");
        return;
    }
    // Prompt for user details
    let name = prompt('Enter your name:');
    if (!name) return alert('Name is required!');
    let email = prompt('Enter your email:');
    if (!email) return alert('Email is required!');
    let address = prompt('Enter your home address:');
    if (!address) return alert('Address is required!');

    // Try to get products from argument, window, or fetch
    let products = productsArg;
    if (!products || !products.length) {
        if (typeof window.products !== 'undefined' && window.products.length) {
            products = window.products;
        }
    }
    function doSend(productsList) {
        let message = `🛒 *Cart Details*:\n*Name:* ${name}\n*Email:* ${email}\n*Address:* ${address}\n\n`;
        let total = 0;
        cart.forEach((item, idx) => {
            let info = productsList.find(p => p.id == item.product_id);
            if (info) {
                let line = `${idx + 1}. ${info.title} x${item.quantity} - PKR ${info.discountedPrice * item.quantity}\n`;
                message += line;
                total += info.discountedPrice * item.quantity;
            }
        });
        message += `\nTotal: PKR ${total}`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/+923228435204?text=${encoded}`, "_blank");
    }
    if (products && products.length) {
        doSend(products);
    } else {
        // Fallback: fetch products data
        fetch('/assets/productsData/productsData.json')
            .then(res => res.json())
            .then(data => doSend(data))
            .catch(() => alert('Could not load product data.'));
    }
}


const remove_cart = (product_id , qty) =>{
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if(positionItemInCart >= 0){
        let info = cart[positionItemInCart];
        cart.splice(positionItemInCart, 1);
        
        document.querySelector(`[id='${product_id}']`).remove()
        
        localStorage.setItem("cart", JSON.stringify(cart))
        cartQty -=qty
        localStorage.setItem('cartQty', cartQty);
        updateCartQty()
        calculateTotal()
    }
   
}
