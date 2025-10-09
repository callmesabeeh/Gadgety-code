const searchParams = new URLSearchParams(window.location.search);

if(searchParams.has('_id')){
    let url_product_id = searchParams.get('_id');
    let http = new XMLHttpRequest();
    http.open('get', 'https://gadgety-code.vercel.app/projects', true);
    http.send();
    http.onload = function(){
        if(this.readyState == 4 && this.status == 200){

            let products = JSON.parse(this.responseText);
            // Map _id to id for consistency
            products = products.map(item => ({ ...item, id: item.id || item._id }));
            let result = products.find(item => item.url === url_product_id);
            if (!result) {
                alert('Product not found!');
                return;
            }
            
            
            const mainImgUrl = result.image.substring(0, result.image.lastIndexOf('.'));
            const mainImgNewUrl = `${mainImgUrl}_d.webp?maxwidth=1300`;
            let output = `
            <div class="imgContainer">
                        <div class="sideImgs">
                            
                        ${result.additionalImages.slice(1).map(img => {
                            const baseUrl = img.substring(0, img.lastIndexOf('.'));
        
        
                            const newUrl = `${baseUrl}_d.webp?maxwidth=750`;
                            return `<img onclick="swapWithMainImg(this, '${newUrl}')" src="${newUrl}") alt="">`
                        }
                        ).join('')}
                        
                        </div>
                        <div class="mainImgDiv">

                            <img src="${mainImgNewUrl}" alt="" class="mainImg">
                        </div>
            `
            document.querySelector(".productInfo").innerHTML = output;
            if(result.additionalImages.length===1){
                document.querySelector(".sideImgs").style.display = "none"
            }

            document.querySelector(".product-name").innerText = result.title
            document.querySelector(".price").innerHTML = `<h5>Price</h5>
            <p>PKR ${result.discountedPrice} <span class="ogPrice">${result.price}</span></p>`
            document.querySelector(".desc").innerHTML = result.description
            document.querySelector(".addCartBtn").setAttribute("onclick",`add_to_cart('${result.id}', event, 1)`)
            document.querySelector(".quantityControl").innerHTML = ` <button onclick="decrease_quantity_plain('${result.id}')">-</button>
                            <span class="quantity">1</span>
                            <button onclick="add_quantity_plain('${result.id}')">+</button>`
        }
    }
}
else{
    window.location = "/"
}

const decrease_quantity_plain = (product_id) => {
 changeQty = Number(document.querySelector(".quantity").innerText) - 1
 document.querySelector(".quantity").innerHTML = changeQty
document.querySelector(".addCartBtn").setAttribute("onclick",`add_to_cart('${product_id}', event, ${changeQty})`)

}
const add_quantity_plain = (product_id) => {
    changeQty = Number(document.querySelector(".quantity").innerText) + 1
 document.querySelector(".quantity").innerHTML = changeQty
document.querySelector(".addCartBtn").setAttribute("onclick",`add_to_cart('${product_id}', event, ${changeQty})`)

}


const swapWithMainImg = (img, imgUrl) => {
    let mainImg = document.querySelector(".mainImg")
    img.setAttribute("src", mainImg.getAttribute("src"))
    img.setAttribute("onclick", `swapWithMainImg(this, '${mainImg.getAttribute("src")}')`)
    mainImg.setAttribute("src", imgUrl)
    
    console.log(img)
    console.log(imgUrl)
}