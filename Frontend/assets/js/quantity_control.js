
const add_quantity = (product_id) =>{
    if (!product_id || product_id === 'undefined') return;
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if(positionItemInCart >= 0){
        cartQty +=1
        localStorage.setItem('cartQty', cartQty);
        updateCartQty()
        let info = cart[positionItemInCart];
        cart[positionItemInCart].quantity = cart[positionItemInCart].quantity + 1;
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`)
        if (!qty) return;
        let newQty;
        newQty = Number(qty.innerText) + 1
        let removeBtn = document.querySelector(`[id='${product_id}'] .removeItem`);
        if (removeBtn) removeBtn.setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`)
        qty.innerHTML = newQty
        let price = document.querySelector(`[id='${product_id}'] .price`)
        let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`)
        if (!price || !totalPrice) return;
        let convertedPrice = price.innerText.replace("PKR ", "")
        totalPrice.innerHTML = "PKR " + (Number(convertedPrice) * Number(newQty))
        localStorage.setItem("cart", JSON.stringify(cart))
        calculateTotal()
    }
   
}

const decrease_quantity = (product_id) =>{
    if (!product_id || product_id === 'undefined') return;
    cartQty -=1
        localStorage.setItem('cartQty', cartQty);
        updateCartQty()
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if(positionItemInCart >= 0){
        let info = cart[positionItemInCart];
        let changeQuantity = cart[positionItemInCart].quantity - 1;
        if (changeQuantity > 0) {
            cart[positionItemInCart].quantity = changeQuantity;
        }else{
            cart.splice(positionItemInCart, 1);
            setTimeout(() => {
                let cartItemDiv = document.querySelector(`[id='${product_id}']`);
                if (cartItemDiv) cartItemDiv.remove()
            }, 100);
            
        }
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`)
        if (!qty) return;
        let newQty;
        newQty = Number(qty.innerText) - 1
        let removeBtn = document.querySelector(`[id='${product_id}'] .removeItem`);
        if (removeBtn) removeBtn.setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`)
        let price = document.querySelector(`[id='${product_id}'] .price`)
        let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`)
        if (!price || !totalPrice) return;
        let convertedPrice = price.innerText.replace("PKR ", "")
        totalPrice.innerHTML = "PKR " +  Number(convertedPrice) * Number(newQty)
        localStorage.setItem("cart", JSON.stringify(cart))
        calculateTotal()
    }

    
}
