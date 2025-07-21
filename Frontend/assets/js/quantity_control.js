
const add_quantity = (product_id) =>{
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if(positionItemInCart >= 0){
        cartQty +=1
        localStorage.setItem('cartQty', cartQty);
        updateCartQty()
        let info = cart[positionItemInCart];
        cart[positionItemInCart].quantity = cart[positionItemInCart].quantity + 1;
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`)
        
        
        let newQty;
        newQty = Number(qty.innerText) + 1
        document.querySelector(`[id='${product_id}'] .removeItem`).setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`)
        qty.innerHTML = newQty
        let price = document.querySelector(`[id='${product_id}'] .price`)
        let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`)
        let convertedPrice = price.innerText.replace("PKR ", "")
        console.log(newQty)
        totalPrice.innerHTML = "PKR " + (Number(convertedPrice) * Number(newQty))




        localStorage.setItem("cart", JSON.stringify(cart))
        calculateTotal()
    }
   
}

const decrease_quantity = (product_id) =>{
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
                document.querySelector(`[id='${product_id}']`).remove()
            }, 100);
            
        }
        let qty = document.querySelector(`[id='${product_id}'] .quantityControl span`)
        let newQty;
        newQty = Number(qty.innerText) - 1
        qty.innerHTML = newQty
        document.querySelector(`[id='${product_id}'] .removeItem`).setAttribute("onclick", `remove_cart(${product_id}, ${newQty})`)
        let price = document.querySelector(`[id='${product_id}'] .price`)
        let totalPrice = document.querySelector(`[id='${product_id}'] .totalPrice`)
        let convertedPrice = price.innerText.replace("PKR ", "")
        console.log(newQty)
        totalPrice.innerHTML = "PKR " +  Number(convertedPrice) * Number(newQty)
        localStorage.setItem("cart", JSON.stringify(cart))
        calculateTotal()
    }

    
}
